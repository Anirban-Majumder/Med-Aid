"use client"
import { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SessionContext } from "@/lib/supabase/usercontext";
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

export default function DoctorSignUp() {
    const router = useRouter();
    const supabase = createClient();
    const { sessionData } = useContext(SessionContext);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Use useEffect to handle redirection instead of doing it during render
    useEffect(() => {
        const checkSession = async () => {
            // Wait for any loading states
            if (isLoading) return;

            // If already logged in, check if they have a profile
            if (sessionData?.session?.user?.id) {
                try {
                    const { data, error } = await supabase
                        .from('doc_profiles')
                        .select('*')
                        .eq('user_id', sessionData.session.user.id)
                        .maybeSingle();

                    // If they have a profile, send them to verify
                    if (data && !error) {
                        router.push('/doctor/verify');
                        return;
                    }

                    // If no profile found, send them to setup
                    if (error && error.code === 'PGRST116') {
                        router.push('/doctor/setup');
                        return;
                    }
                } catch (err) {
                    console.error('Error checking profile:', err);
                }
            }
        };

        checkSession();
    }, [sessionData, isLoading, router]);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/doctor/setup`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) {
                throw error;
            }
        } catch (error) {
            console.error('Error signing in with Google:', error);
            setError('Failed to sign in with Google. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-blue-50 to-zinc-200 dark:from-zinc-900 dark:via-blue-900/10 dark:to-zinc-900 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full"
            >
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <Image src="/icon.svg" alt="Med-Aid" width={50} height={50} className="mx-auto mb-4" />
                    </Link>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                        Doctor Registration
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Join our healthcare platform and connect with patients more effectively.
                    </p>
                </div>

                <Card className="p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm shadow-xl rounded-xl border border-zinc-200/50 dark:border-zinc-700/50">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <Button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-200 dark:border-zinc-600"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                        <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                                        <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                                        <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                                        <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                                    </g>
                                </svg>
                            )}
                            <span>Sign up with Google</span>
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-zinc-800 text-gray-500 dark:text-gray-400">
                                    Or
                                </span>
                            </div>
                        </div>

                        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                            Already registered as a doctor?{' '}
                            <Link href="/SignIn?type=doctor" className="text-blue-600 dark:text-blue-400 hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </Card>

                <div className="mt-8 text-center">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Not a healthcare provider?{' '}
                        <Link href="/SignIn" className="text-blue-600 dark:text-blue-400 hover:underline">
                            Sign in as a patient
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}