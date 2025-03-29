"use client"

import { useState, useContext, useEffect } from "react";
import { SessionContext } from "@/lib/supabase/usercontext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Profile } from "@/lib/db_types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePushNotification, isPushNotificationSupported } from "@/lib/push-notification";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const SetUpPage = () => {
    const { sessionData, setSessionData } = useContext(SessionContext);
    const supabase = createClient();
    const router = useRouter();
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [preferences, setPreferences] = useState({
        pushNotifications: false,
        telegramMessages: false,
        sms: false,
        whatsappMessages: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [pushSupported, setPushSupported] = useState(false);
    const [showUnsupportedDialog, setShowUnsupportedDialog] = useState(false);

    const { isPushSupported } = usePushNotification();

    useEffect(() => {
        setMounted(true);
        if (mounted) {
            setPushSupported(isPushNotificationSupported());
        }
    }, [mounted]);

    const handleChange = (e: any) => {
        const { name, type, checked, value } = e.target;
        if (type === 'checkbox') {
            setPreferences((prev) => ({ ...prev, [name]: checked }));
        } else {
            if (name === 'name') setName(value);
            if (name === 'phoneNumber') setPhoneNumber(value);
        }
    };

    const handleToggle = (prefName: string) => {
        if (prefName === 'pushNotifications' && !preferences.pushNotifications && !pushSupported) {
            setShowUnsupportedDialog(true);
            return;
        }

        setPreferences((prev) => ({
            ...prev,
            [prefName]: !prev[prefName as keyof typeof prev]
        }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsSubmitting(true);

        const user_id = sessionData.session?.user.id;
        const nameParts = name.split(" ");

        if (user_id) {
            const { error } = await supabase.from('profiles').upsert({
                user_id: user_id,
                first_name: nameParts[0] || "",
                last_name: nameParts.slice(1).join(" ") || "",
                phone: phoneNumber,
                reminder_preference: preferences,
            }, {
                onConflict: 'user_id'
            });

            if (error) {
                console.error('Error submitting user data:', error);
                alert(error.message);
            } else {
                console.log('User data submitted successfully!');
                if (sessionData.profile) {
                    setSessionData(prev => ({
                        ...prev,
                        profile: {
                            ...prev.profile,
                            first_name: nameParts[0] || "",
                            last_name: nameParts.slice(1).join(" ") || "",
                            phone: phoneNumber,
                        } as Profile,
                    }));
                    if (preferences.telegramMessages) {
                        const shouldRegister = window.confirm("Telegram registration is available. Do you want to register now?");
                        if (shouldRegister) {
                            window.open(`https://t.me/MeD_Aid_0Bot?start=${user_id}`, '_blank');
                        }
                    }
                }
                router.push('/Dashboard');
            }
        } else {
            console.error('No valid session found.');
            alert('No valid session found. Please sign in again.');
        }

        setIsSubmitting(false);
    };

    if (!mounted) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white to-gray-100 dark:from-gray-900 dark:to-gray-950">
                <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
        );
    }

    const containerAnimation = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                ease: "easeOut",
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        }
    };

    const itemAnimation = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3 }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white to-gray-100 dark:from-gray-900 dark:to-gray-950 px-4 py-8">
            <motion.div
                className="w-full max-w-md p-6 lg:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                initial="hidden"
                animate="visible"
                variants={containerAnimation}
            >
                <motion.div
                    className="text-center mb-8"
                    variants={itemAnimation}
                >
                    <div className="relative mx-auto mb-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                        </div>
                        <div className="absolute -bottom-2 right-1/2 transform translate-x-8 bg-white dark:bg-gray-800 rounded-full p-1">
                            <div className="w-6 h-6 bg-cyan-500 dark:bg-cyan-600 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Complete Your Profile
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm max-w-xs mx-auto">
                        Set up your preferences and personalize your experience
                    </p>
                </motion.div>

                <motion.form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                    variants={containerAnimation}
                >
                    <motion.div variants={itemAnimation}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <input
                                type="text"
                                name="name"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition duration-200"
                            />
                        </div>
                    </motion.div>

                    <motion.div variants={itemAnimation}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            <input
                                type="tel"
                                name="phoneNumber"
                                placeholder="Enter your phone number"
                                value={phoneNumber}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition duration-200"
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        className="space-y-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
                        variants={itemAnimation}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                            </svg>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Notification Preferences
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                <div className="space-y-0.5">
                                    <Label className="text-sm text-gray-700 dark:text-gray-300" htmlFor="push-notifications">
                                        Push Notifications
                                    </Label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Receive notifications on your device
                                    </p>
                                </div>
                                <Switch
                                    id="push-notifications"
                                    checked={preferences.pushNotifications}
                                    onCheckedChange={() => handleToggle('pushNotifications')}
                                />
                            </div>

                            <div className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                <div className="space-y-0.5">
                                    <Label className="text-sm text-gray-700 dark:text-gray-300" htmlFor="telegram-messages">
                                        Telegram Messages
                                    </Label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Receive reminders via Telegram
                                    </p>
                                </div>
                                <Switch
                                    id="telegram-messages"
                                    checked={preferences.telegramMessages}
                                    onCheckedChange={() => handleToggle('telegramMessages')}
                                />
                            </div>

                            <div className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                <div className="space-y-0.5">
                                    <Label className="text-sm text-gray-700 dark:text-gray-300" htmlFor="sms">
                                        SMS Notifications
                                    </Label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Receive text message reminders
                                    </p>
                                </div>
                                <Switch
                                    id="sms"
                                    checked={preferences.sms}
                                    onCheckedChange={() => handleToggle('sms')}
                                />
                            </div>

                            <div className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                <div className="space-y-0.5">
                                    <Label className="text-sm text-gray-700 dark:text-gray-300" htmlFor="whatsapp-messages">
                                        WhatsApp Messages
                                    </Label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Receive reminders via WhatsApp
                                    </p>
                                </div>
                                <Switch
                                    id="whatsapp-messages"
                                    checked={preferences.whatsappMessages}
                                    onCheckedChange={() => handleToggle('whatsappMessages')}
                                />
                            </div>
                        </div>
                    </motion.div>

                    <motion.button
                        type="submit"
                        className="w-full px-6 py-3 text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 font-medium flex items-center justify-center gap-2 disabled:opacity-70"
                        variants={itemAnimation}
                        disabled={isSubmitting}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            <>
                                Complete Setup
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                                </svg>
                            </>
                        )}
                    </motion.button>

                    <motion.p
                        className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4"
                        variants={itemAnimation}
                    >
                        By completing setup, you agree to our
                        <a href="/terms" className="text-cyan-600 hover:text-cyan-700 mx-1">Terms of Service</a>
                        and
                        <a href="/privacypolicy" className="text-cyan-600 hover:text-cyan-700 mx-1">Privacy Policy</a>
                    </motion.p>
                </motion.form>
            </motion.div>

            <AnimatePresence>
                {showUnsupportedDialog && (
                    <Dialog open={showUnsupportedDialog} onOpenChange={setShowUnsupportedDialog}>
                        <DialogContent className="max-w-md p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
                            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Push Notifications Not Supported
                            </DialogTitle>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Your browser doesn't support push notifications or they've been blocked.
                                Please use a modern browser and ensure notifications are allowed.
                            </p>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowUnsupportedDialog(false)}
                                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg shadow"
                                >
                                    Understood
                                </button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SetUpPage;
