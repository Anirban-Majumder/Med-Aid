"use client"
import React, { useState, useContext, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SessionContext } from '@/lib/supabase/usercontext';
import { useRouter } from 'next/navigation';
import { Profile } from '@/lib/db_types';

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

    const handleChange = (e: any) => {
        const { name, type, checked, value } = e.target;
        if (type === 'checkbox') {
            setPreferences((prev) => ({ ...prev, [name]: checked }));
        } else {
            if (name === 'name') setName(value);
            if (name === 'phoneNumber') setPhoneNumber(value);
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        const user_id = sessionData.session?.user.id;
        const nameParts = name.split(" ");
        
        // Ensure that sessionData and the user are defined
        if (user_id) {
            const { error } = await supabase.from('profiles').upsert({
                user_id: user_id,
                first_name: nameParts[0] || "",
                last_name: nameParts.slice(1).join(" ") || "",
                phone: phoneNumber,
                reminder_preference: preferences, // stored as JSON
            }, {
                onConflict: 'user_id'
            });

            if (error) {
                console.error('Error submitting user data:', error);
                alert(error.message);
            } else {
                console.log('User data submitted successfully!');
                // Update the Session context with the new profile details
                if (sessionData.profile) {
                    setSessionData(prev => ({
                        ...prev,
                        profile: {
                            ...prev.profile,
                            first_name: nameParts[0] || "",
                            last_name: nameParts.slice(1).join(" ") || "",
                            phone: phoneNumber,
                        } as Profile, // Explicitly cast to Profile to satisfy TypeScript
                    }));
                    // If Telegram checkbox is selected, ask the user if they want to register via Telegram.
                    if (preferences.telegramMessages) {
                        const shouldRegister = window.confirm("Telegram registration is available. Do you want to register now?");
                        if (shouldRegister) {
                            window.open(`https://t.me/Pharma_a_i_bot?start=${user_id}`, '_blank');
                        }
                    }
                }
                router.push('/Dashboard');
            }
        } else {
            console.error('No valid session found.');
            alert('No valid session found. Please sign in again.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-2xl dark:bg-zinc-800">
                <div className="text-center">
                    <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
                        Set Up Your Profile
                    </h1>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 mt-1 border rounded-2xl dark:bg-zinc-700 dark:text-white focus:ring focus:ring-teal-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            name="phoneNumber"
                            placeholder="Enter your phone number"
                            value={phoneNumber}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 mt-1 border rounded-2xl dark:bg-zinc-700 dark:text-white focus:ring focus:ring-teal-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <p className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Notification Preferences
                        </p>
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name="pushNotifications"
                                    checked={preferences.pushNotifications}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-teal-500"
                                />
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Push Notifications</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name="telegramMessages"
                                    checked={preferences.telegramMessages}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-teal-500"
                                />
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Telegram Messages</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name="sms"
                                    checked={preferences.sms}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-teal-500"
                                />
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">SMS</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name="whatsappMessages"
                                    checked={preferences.whatsappMessages}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-teal-500"
                                />
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">WhatsApp Messages</span>
                            </label>
                        </div>
                    </div>
                    <button type="submit" className="w-full px-4 py-2 text-white bg-pink-500 dark:bg-pink-600 rounded-full hover:bg-pink-600 dark:hover:bg-pink-700">
                        Complete Setup
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetUpPage;