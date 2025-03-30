"use client";
import { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SessionContext } from "@/lib/supabase/usercontext";
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Mail, Lock } from 'lucide-react';

export default function DoctorSignup() {
    const router = useRouter();
    const supabase = createClient();
    const { sessionData, isLoading: sessionLoading } = useContext(SessionContext);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionLoading && sessionData?.session) {
            checkExistingProfile(sessionData.session.user.id);
        }
    }, [sessionData, sessionLoading]);

    const checkExistingProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('doc_profiles')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            // If profile exists, redirect to verify
            if (data) {
                router.push('/doctor/verify');
                return;
            }

            // If no profile, redirect to setup
            router.push('/doctor/setup');
        } catch (error) {
            console.error('Error checking profile:', error);
            setError('An error occurred while checking your profile.');
        }
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSigningIn(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                await checkExistingProfile(data.user.id);
            }
        } catch (error: any) {
            console.error('Error signing in:', error);
            setError(error.message || 'An error occurred during sign in');
        } finally {
            setIsSigningIn(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSigningIn(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/doctor/verify`,
                }
            });

            if (error) throw error;

            if (data.user) {
                router.push('/doctor/setup');
            }
        } catch (error: any) {
            console.error('Error signing up:', error);
            setError(error.message || 'An error occurred during sign up');
        } finally {
            setIsSigningIn(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setIsSigningIn(true);
            setError(null);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/doctor/docsignup`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) throw error;

        } catch (error: any) {
            console.error('Error signing in with Google:', error);
            setError(error.message || 'An error occurred during Google sign in');
        } finally {
            setIsSigningIn(false);
        }
    };

    if (sessionLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-blue-50 to-zinc-200 dark:from-zinc-900 dark:via-blue-900/10 dark:to-zinc-900 p-4 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <Image src="/icon.svg" alt="PharmaAI" width={50} height={50} className="mx-auto mb-4" />
                    </Link>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                        Doctor Portal
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Sign in to manage your practice or create a new account
                    </p>
                </div>

                <Card className="p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-xl rounded-xl">
                    {error && (
                        <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full mb-6"
                        onClick={handleGoogleSignIn}
                        disabled={isSigningIn}
                    >
                        {isSigningIn ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Image
                                src="/google.svg"
                                alt="Google"
                                width={20}
                                height={20}
                                className="mr-2"
                            />
                        )}
                        {isSigningIn ? 'Signing in...' : 'Continue with Google'}
                    </Button>

                    <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
                        By signing up, you agree to our{' '}
                        <Link href="/terms" className="text-blue-600 hover:underline">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-blue-600 hover:underline">
                            Privacy Policy
                        </Link>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}