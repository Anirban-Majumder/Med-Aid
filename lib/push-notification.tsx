import { useContext, useEffect } from 'react';
import { SessionContext } from '@/lib/supabase/usercontext';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/db_types';

// Define types for notification permission results
interface NotificationPermissionResult {
    status: 'granted' | 'denied' | 'unsupported' | 'error';
    subscription: PushSubscription | null;
    error?: unknown;
    message?: string;
}

// Check if push notifications are supported by the browser
export function isPushNotificationSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Request push notification permission and handle the response
export async function requestNotificationPermission(): Promise<NotificationPermissionResult> {
    if (!isPushNotificationSupported()) {
        return { status: 'unsupported', subscription: null };
    }

    try {
        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
            return { status: 'denied', subscription: null };
        }

        // Register service worker if permission granted
        return registerServiceWorker();
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return { status: 'error', subscription: null, error };
    }
}

// Register service worker and create push subscription
async function registerServiceWorker(): Promise<NotificationPermissionResult> {
    try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered with scope:', registration.scope);

        // Wait for the service worker to be ready before subscribing
        if (registration.installing || registration.waiting) {
            // Wait for the service worker to be ready
            await navigator.serviceWorker.ready;
        }

        try {
            // Try to get an existing subscription first
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                return { status: 'granted', subscription };
            }

            // If no existing subscription, create a new one
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

            if (!vapidPublicKey) {
                throw new Error('VAPID public key is missing');
            }

            // Convert VAPID key to Uint8Array
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

            // Create new subscription with a catch for potential errors
            try {
                const newSubscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidKey
                });

                return { status: 'granted', subscription: newSubscription };
            } catch (subscribeError) {
                console.error('Failed to subscribe to push service:', subscribeError);

                // If subscription fails, return error without throwing
                return {
                    status: 'error',
                    subscription: null,
                    error: subscribeError,
                    message: 'Failed to subscribe to push service. This may be due to browser restrictions or network issues.'
                };
            }
        } catch (error) {
            console.error('Error creating push subscription:', error);
            return { status: 'error', subscription: null, error };
        }
    } catch (error) {
        console.error('Error registering service worker:', error);
        return { status: 'error', subscription: null, error };
    }
}

// Convert base64 to Uint8Array for applicationServerKey
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

// Hook to save push subscription to user profile
export function usePushNotification() {
    const { sessionData, setSessionData } = useContext(SessionContext);
    const supabase = createClient();

    useEffect(() => {
        // Only attempt to register if the user has opted in
        if (
            sessionData.profile?.reminder_preference?.pushNotifications &&
            !sessionData.profile?.push_token
        ) {
            const registerPush = async () => {
                try {
                    const result = await requestNotificationPermission();

                    if (result.status === 'granted' && result.subscription && sessionData.session) {
                        // Convert subscription to string
                        const subscriptionJSON = JSON.stringify(result.subscription);

                        // Update user profile with push token
                        const { error } = await supabase
                            .from('profiles')
                            .update({ push_token: subscriptionJSON })
                            .eq('user_id', sessionData.session.user.id);

                        if (error) {
                            console.error('Error saving push token:', error);
                        } else {
                            // Update session data with new push token
                            setSessionData(prev => {
                                if (!prev.profile) return prev;

                                return {
                                    ...prev,
                                    profile: {
                                        ...prev.profile,
                                        push_token: subscriptionJSON
                                    } as Profile
                                };
                            });
                            console.log('Push notification subscription saved successfully');
                        }
                    } else if (result.status === 'error') {
                        console.warn('Push notification registration issue:',
                            'message' in result ? result.message : 'Unknown error');
                        // Don't throw an error, just log it to prevent app crashes
                    }
                } catch (error) {
                    console.error('Push notification setup error:', error);
                    // Error is caught and logged but not rethrown
                }
            };

            registerPush();
        }
    }, [sessionData.profile?.reminder_preference?.pushNotifications, sessionData.profile?.push_token, sessionData.session, setSessionData, supabase]);

    return { isPushSupported: isPushNotificationSupported() };
}
