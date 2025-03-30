"use client"
import { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Icon } from '@iconify/react';
import { SessionContext } from "@/lib/supabase/usercontext";
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { checkAdminStatus } from "@/lib/supabase/admin"; // Import the admin checking function
import { Layout } from "@/components/layout";
import { Input } from '@/components/ui/input';
import { Loader2, Save, User, Phone, MapPin, Award, FileText, Mail, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

type DoctorApplication = {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    specializations: string;
    registration_no: string;
    years_of_experience: number;
    description: string;
    phone: string;
    address: string;
    bio: string;
    license_url: string;
    degree_url: string;
    is_verified: boolean;
    is_approved: boolean;
    created_at: string;
};

type DoctorProfile = {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    specializations: string;
    registration_no: string;
    years_of_experience: number;
    phone: string;
    address: string;
    bio: string;
    description: string;
    email: string;
    is_verified: boolean;
    is_available: boolean;
    created_at: string;
};

export default function DoctorProfilePage() {
    const router = useRouter();
    const supabase = createClient();
    const { sessionData, isLoading: sessionLoading } = useContext(SessionContext);
    const [profile, setProfile] = useState<DoctorProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!sessionLoading && !sessionData?.session) {
            router.push('/SignIn');
            return;
        }

        const fetchProfile = async () => {
            if (sessionData?.session?.user?.id) {
                try {
                    setIsLoading(true);
                    const { data, error } = await supabase
                        .from('doc_profiles')
                        .select('*')
                        .eq('user_id', sessionData.session.user.id)
                        .single();

                    if (error) {
                        console.error('Error fetching profile:', error.message);
                        if (error.code === 'PGRST116') {
                            router.push('/doctor/setup');
                            return;
                        }
                        throw error;
                    }

                    if (!data.is_verified) {
                        router.push('/doctor/verify');
                        return;
                    }

                    setProfile(data);
                } catch (error) {
                    console.error('Error:', error);
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to load profile. Please try again.",
                    });
                } finally {
                    setIsLoading(false);
                }
            }
        };

        if (sessionData?.session) {
            fetchProfile();
        }
    }, [sessionData, sessionLoading, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!profile) return;
        setProfile({
            ...profile,
            [e.target.name]: e.target.value
        });
    };

    const handleSave = async () => {
        if (!profile || !sessionData?.session?.user?.id) return;

        try {
            setIsSaving(true);
            const { error } = await supabase
                .from('doc_profiles')
                .update({
                    phone: profile.phone,
                    address: profile.address,
                    bio: profile.bio,
                    description: profile.description,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', sessionData.session.user.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Profile updated successfully.",
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update profile. Please try again.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || sessionLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-100 via-blue-50 to-zinc-200 dark:from-zinc-900 dark:via-blue-900/10 dark:to-zinc-900">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-zinc-600 dark:text-zinc-400">Loading your profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-blue-50 to-zinc-200 dark:from-zinc-900 dark:via-blue-900/10 dark:to-zinc-900 p-4">
            <div className="max-w-4xl mx-auto">
                <Card className="p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-md">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-8">
                        <div className="flex items-center mb-4 md:mb-0">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold mr-4">
                                {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Dr. {profile.first_name} {profile.last_name}</h1>
                                <p className="text-zinc-600 dark:text-zinc-400">{profile.specializations}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button variant="outline" asChild>
                                <Link href="/doctor/dashboard">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Dashboard
                                </Link>
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <div>
                                <label className="flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    <User className="w-4 h-4 mr-2" />
                                    Registration Number
                                </label>
                                <Input
                                    value={profile.registration_no}
                                    disabled
                                    className="bg-zinc-50 dark:bg-zinc-700/30"
                                />
                            </div>

                            <div>
                                <label className="flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    <Mail className="w-4 h-4 mr-2" />
                                    Email
                                </label>
                                <Input
                                    value={profile.email}
                                    disabled
                                    className="bg-zinc-50 dark:bg-zinc-700/30"
                                />
                            </div>

                            <div>
                                <label className="flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    <Phone className="w-4 h-4 mr-2" />
                                    Phone Number
                                </label>
                                <Input
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleChange}
                                    placeholder="Enter your phone number"
                                />
                            </div>

                            <div>
                                <label className="flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    <MapPin className="w-4 h-4 mr-2" />
                                    Office Address
                                </label>
                                <Input
                                    name="address"
                                    value={profile.address}
                                    onChange={handleChange}
                                    placeholder="Enter your office address"
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    <Award className="w-4 h-4 mr-2" />
                                    Certifications
                                </label>
                                <Input
                                    name="description"
                                    value={profile.description}
                                    onChange={handleChange}
                                    placeholder="Enter your certifications"
                                />
                            </div>

                            <div>
                                <label className="flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Professional Bio
                                </label>
                                <textarea
                                    name="bio"
                                    value={profile.bio}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800/50"
                                    placeholder="Tell us about your professional experience"
                                />
                            </div>

                            <div className="bg-zinc-50 dark:bg-zinc-700/30 rounded-lg p-4">
                                <h3 className="font-medium mb-2">Account Status</h3>
                                <div className="flex items-center space-x-2 text-sm">
                                    <span className={`inline-block w-2 h-2 rounded-full ${profile.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                    <span>{profile.is_verified ? 'Verified Account' : 'Pending Verification'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
            <Toaster />
        </div>
    );
}