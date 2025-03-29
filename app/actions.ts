// @ts-nocheck
'use server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

let subscription: PushSubscription | null = null

export async function subscribeUser(sub: PushSubscription, user_id: string | undefined) {
  const { endpoint, keys } = sub
  console.log('Storing subscription:', sub, 'for user:', user_id)
  // Save subscription details in a separate subscriptions table:
  //const { data, error } = await supabase
  //  .from('subscriptions')
  //  .insert([{ endpoint, keys, user_id }])
  //
  //if (error) {
  //  console.error('Error storing subscription:', error)
  //  return { success: false, error: 'Failed to store subscription' }
  //}

  // Additionally, update the user's profile with the push token
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .update({ push_token: JSON.stringify(sub) })
    .eq('user_id', user_id)

  if (profileError) {
    console.error('Error updating profile push token:', profileError)
    return { success: false, error: 'Failed to update profile' }
  }

  console.log('Successfully updated profile with push token')
  return { success: true }
}

export async function unsubscribeUser() {
  subscription = null
  // In a production environment, you would want to remove the subscription from the database
  // For example: await db.subscriptions.delete({ where: { ... } })
  return { success: true }
}