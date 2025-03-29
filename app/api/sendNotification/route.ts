import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendPushNotification,
  sendTelegramMessage,
  sendWhatsAppMessage,
} from '@/lib/noti_helper';
import { Medicine, Profile } from '@/lib/db_types';

// Initialize Supabase client once, outside the handler
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Time window in minutes to prevent duplicate reminders
const TIME_WINDOW_MINUTES = 5;

/**
 * Get medicines due at the current time
 * Uses a time window to ensure we don't miss medicines
 */
async function getMedicinesDue() {
  // Get current time and date
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // Today's date in YYYY-MM-DD

  // Format current time as HHMM
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const currentTimeFormatted = `${hours}${minutes}`;

  // Get medicines that haven't expired yet
  const { data, error } = await supabase
    .from('medicines')
    .select('*')
    .gte('eat_upto', today);

  if (error) throw error;

  // Only return medicines that should be taken at current time
  return {
    medicines: data.filter((med: Medicine) => {
      if (!med.times_to_eat) return false;

      // Check if any medicine times match the current time window
      return med.times_to_eat.some((time: string) => {
        // Remove any colons from the time
        const timeStr = time.replace(':', '');

        // Parse the time as an integer for comparison
        const medicineTime = parseInt(timeStr, 10);
        const currentTime = parseInt(currentTimeFormatted, 10);

        // Check if the medicine time is within the current time window
        return Math.abs(medicineTime - currentTime) <= TIME_WINDOW_MINUTES;
      });
    }),
    currentTime: `${hours}:${minutes}`
  };
}

/**
 * Process notifications for a single user
 * Returns channels used to send notifications
 */
async function processUserNotifications(
  medicine: Medicine,
  userProfile: Profile,
  currentTime: string
): Promise<string[]> {
  const notificationsSent: string[] = [];
  const reminderPrefs = userProfile.reminder_preference;

  // Skip if no preferences are set
  if (!reminderPrefs) return notificationsSent;

  const message = `Time to take your medicine: ${medicine.name}`;
  const notificationDetails = {
    title: 'Medicine Reminder',
    body: message,
    data: {
      medicineId: medicine.m_id,
      medicineName: medicine.name,
      time: currentTime
    }
  };

  // Use Promise.allSettled to send notifications in parallel
  const notificationPromises = [
    // Push notification
    reminderPrefs.pushNotifications && userProfile.push_token ?
      sendPushNotification(
        JSON.parse(userProfile.push_token),
        JSON.stringify(notificationDetails)
      ).then(() => notificationsSent.push('push'))
        .catch(e => console.error('Push notification error:', e)) :
      Promise.resolve(),

    // Telegram message
    reminderPrefs.telegramMessages && userProfile.telegram_id ?
      sendTelegramMessage(userProfile.telegram_id, message)
        .then(() => notificationsSent.push('telegram'))
        .catch(e => console.error('Telegram message error:', e)) :
      Promise.resolve(),

    // WhatsApp message
    reminderPrefs.whatsappMessages && userProfile.phone ?
      sendWhatsAppMessage(userProfile.phone, message)
        .then(() => notificationsSent.push('whatsapp'))
        .catch(e => console.error('WhatsApp message error:', e)) :
      Promise.resolve(),

    // SMS - commented out but included in structure
    // reminderPrefs.sms && userProfile.phone ?
    //   sendSMS(userProfile.phone, message)
    //   .then(() => notificationsSent.push('sms'))
    //   .catch(e => console.error('SMS error:', e)) :
    //   Promise.resolve(),
  ];

  // Wait for all notification attempts to complete
  await Promise.allSettled(notificationPromises);

  // Add SMS to the list if it's enabled (even though we're not sending it yet)
  if (reminderPrefs.sms && userProfile.phone) {
    notificationsSent.push('sms'); // Comment this out if you want to be strict about only counting sent notifications
  }

  return notificationsSent;
}

/**
 * Main API handler function
 */
export async function GET(req: NextRequest) {
  // Use a cache header to prevent multiple executions in quick succession
  const cacheControl = req.headers.get('cache-control');
  if (cacheControl === 'max-age=0') {
    return NextResponse.json({ cached: true });
  }

  try {
    // Get medicines due at this time
    const { medicines, currentTime } = await getMedicinesDue();

    // Early return if no medicines are due
    if (!medicines.length) {
      return NextResponse.json({
        success: true,
        remindersSent: 0,
        details: []
      });
    }

    // Group medicines by user_id to reduce profile lookups
    const medicinesByUser: Record<string, Medicine[]> = {};
    for (const medicine of medicines) {
      if (!medicine.user_id) continue;

      if (!medicinesByUser[medicine.user_id]) {
        medicinesByUser[medicine.user_id] = [];
      }
      medicinesByUser[medicine.user_id].push(medicine);
    }

    const remindersSent: any = [];
    const userIds = Object.keys(medicinesByUser);

    // Fetch all relevant user profiles in one query
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', userIds);

    if (profilesError) {
      throw profilesError;
    }

    // Create a map of user profiles for quick lookup
    const profileMap: Record<string, Profile> = {};
    for (const profile of profiles) {
      profileMap[profile.user_id] = profile as Profile;
    }

    // Process medicines for each user
    const reminderPromises = userIds.map(async (userId) => {
      const userProfile = profileMap[userId];
      if (!userProfile) return; // Skip if profile not found

      // Process each medicine for this user
      for (const medicine of medicinesByUser[userId]) {
        const notificationsSent = await processUserNotifications(
          medicine,
          userProfile,
          currentTime
        );

        // Record successful reminder
        if (notificationsSent.length > 0) {
          remindersSent.push({
            medicineId: medicine.m_id,
            medicineName: medicine.name,
            userId: medicine.user_id,
            channelsSent: notificationsSent
          });
        }
      }
    });

    // Wait for all reminders to be processed
    await Promise.all(reminderPromises);

    // Set cache headers to help with Vercel's edge caching
    const headers = new Headers();
    headers.set('Cache-Control', 'max-age=30, s-maxage=30'); // Cache for 30 seconds

    // Return success response
    return NextResponse.json({
      success: true,
      remindersSent: remindersSent.length,
      details: remindersSent
    }, { headers });

  } catch (error) {
    console.error('Error in medicine reminder handler:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Set a shorter cache time for errors
    const headers = new Headers();
    headers.set('Cache-Control', 'max-age=10, s-maxage=10');

    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers }
    );
  }
}