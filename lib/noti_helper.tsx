import webpush from 'web-push';

// Initialize web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

/**
 * Send a push notification to a device
 * @param pushToken The push subscription object
 * @param payload The notification payload
 * @returns Promise resolving to the notification result
 */
export async function sendPushNotification(pushToken: any, payload: string) {
  if (!pushToken) {
    throw new Error('Invalid push token provided');
  }
  
  try {
    const result = await webpush.sendNotification(pushToken, payload);
    return result;
  } catch (error) {
    console.error('Push notification error:', error);
    throw error; // Re-throw to allow caller to handle the error
  }
}

/**
 * Send a message via Telegram
 * @param chatId The Telegram chat ID
 * @param message The message to send
 * @returns Promise resolving to the API response
 */
export async function sendTelegramMessage(chatId: string, message: string) {
  if (!chatId) {
    throw new Error('Invalid Telegram chat ID provided');
  }
  
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("Missing Telegram bot token in environment variables");
  }
  
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown', // Support for basic formatting
      }),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ description: res.statusText }));
      throw new Error(`Telegram API error: ${errorData.description || res.statusText}`);
    }
    
    return res.json();
  } catch (error) {
    console.error('Telegram message error:', error);
    throw error;
  }
}

/**
 * Send a message via WhatsApp
 * @param phoneNumber The recipient's phone number (with country code)
 * @param message The message to send
 * @returns Promise resolving to the API response
 */
export async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  if (!phoneNumber) {
    throw new Error('Invalid phone number provided');
  }
  
  // Format phone number if needed (remove spaces, ensure it starts with country code)
  const formattedPhone = phoneNumber.startsWith('+') ? 
    phoneNumber.replace(/\s+/g, '') : 
    `+${phoneNumber.replace(/\s+/g, '')}`;
  
  const token = process.env.WHATSAPP_API_KEY;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  if (!token) {
    throw new Error("Missing WhatsApp API key in environment variables");
  }
  if (!phoneNumberId) {
    throw new Error("Missing WhatsApp phone number ID in environment variables");
  }
  
  // WhatsApp Business API endpoint
  const url = `https://graph.facebook.com/v15.0/${phoneNumberId}/messages`;
  
  try {
    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "text",
      text: { body: message }
    };
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`WhatsApp API error: ${res.status} - ${errorText}`);
    }
    
    return res.json();
  } catch (error) {
    console.error('WhatsApp message error:', error);
    throw error;
  }
}

/**
 * Send SMS via a third-party provider (implementation needed)
 * @param phoneNumber The recipient's phone number
 * @param message The message to send
 * @returns Promise resolving to the SMS result
 */
export async function sendSMS(phoneNumber: string, message: string) {
  // This function is referenced in your code but not implemented
  // Implementation would depend on your SMS provider (Twilio, Nexmo, etc.)
  throw new Error('SMS sending not implemented');
}