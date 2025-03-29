"use client";
import { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SessionContext } from "@/lib/supabase/usercontext";

// Hardcoded admin emails - These users will always have admin privileges
// Even if they don't have an is_admin=true flag in the database
export const ADMIN_EMAILS = [
    "anindyakanti2020gmail.com",
    "admin@pharmaaai.com"
];

// Helper function to check if an email is in the hardcoded admin list
export const isHardcodedAdmin = (email: string | undefined | null): boolean => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase());
};

// Helper to check admin status from both database and hardcoded list
export const checkAdminStatus = async (
    supabase: any,
    userId: string,
    userEmail: string | undefined | null
): Promise<boolean> => {
    // If the email is in our hardcoded list, they're an admin regardless of DB state
    if (isHardcodedAdmin(userEmail)) {
        return true;
    }

    // Otherwise check the database
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        return data?.is_admin === true;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
};

// Re-export createClient to maintain backward compatibility
export { createClient };