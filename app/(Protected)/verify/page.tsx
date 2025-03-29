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

type DoctorApplication = {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    specialty: string;
    license_number: string;
    years_of_experience: number;
    hospital_affiliation: string;
    phone: string;
    address: string;
    bio: string;
    license_url: string;
    degree_url: string;
    is_verified: boolean;
    is_approved: boolean;
    created_at: string;
};

export default function AdminVerifyPage() {
    const router = useRouter();
    const supabase = createClient();
    const { sessionData, isLoading: sessionLoading } = useContext(SessionContext);
    const [applications, setApplications] = useState<DoctorApplication[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorApplication | null>(null);
    const [viewingDocs, setViewingDocs] = useState<{ type: 'license' | 'degree', url: string } | null>(null);

    useEffect(() => {
        // Redirect to sign in if not authenticated
        if (!sessionLoading && !sessionData?.session) {
            router.push('/SignIn');
            return;
        }

        const checkUserAdminStatus = async () => {
            if (sessionData?.session?.user?.id && sessionData?.session?.user?.email) {
                try {
                    // Use the checkAdminStatus function from admin.ts
                    const isAdminUser = await checkAdminStatus(
                        supabase,
                        sessionData.session.user.id,
                        sessionData.session.user.email
                    );

                    // If not admin, redirect to dashboard
                    if (!isAdminUser) {
                        setIsAdmin(false);
                        router.push('/Protected/Dashboard');
                        return;
                    }

                    setIsAdmin(true);
                    // Fetch pending doctor applications
                    await fetchPendingApplications();
                } catch (error) {
                    console.error('Error in admin verification:', error);
                    router.push('/SignIn');
                } finally {
                    setIsLoading(false);
                }
            }
        };

        if (sessionData?.session) {
            checkUserAdminStatus();
        }
    }, [sessionData, sessionLoading, router]);

    const fetchPendingApplications = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('doctor_profiles')
                .select('*')
                .eq('is_verified', false)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            setApplications(data || []);
        } catch (error) {
            console.error('Error fetching doctor applications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveDoctor = async (doctorId: string) => {
        try {
            // Update doctor profile to verified and approved
            const { error } = await supabase
                .from('doctor_profiles')
                .update({
                    is_verified: true,
                    is_approved: true
                })
                .eq('id', doctorId);

            if (error) throw error;

            // Refresh the applications list
            await fetchPendingApplications();
            setSelectedDoctor(null);

            // Send notification to the doctor (if you have a notification system)
            // This is a placeholder for when you implement notifications
            console.log('Doctor approved and notification will be sent');
        } catch (error) {
            console.error('Error approving doctor:', error);
            alert('Error approving the doctor. Please try again.');
        }
    };

    const handleRejectDoctor = async (doctorId: string) => {
        if (!confirm('Are you sure you want to reject this application?')) return;

        try {
            // Delete the doctor profile or mark it as rejected
            const { error } = await supabase
                .from('doctor_profiles')
                .delete()
                .eq('id', doctorId);

            if (error) throw error;

            // Refresh the applications list
            await fetchPendingApplications();
            setSelectedDoctor(null);
        } catch (error) {
            console.error('Error rejecting doctor:', error);
            alert('Error rejecting the application. Please try again.');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (isLoading || sessionLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <Card className="p-8 max-w-md text-center">
                    <Icon icon="ph:prohibit-bold" className="w-16 h-16 mx-auto text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="mb-6 text-zinc-600 dark:text-zinc-400">You don't have permission to access this page.</p>
                    <Button asChild>
                        <Link href="/Protected/Dashboard">Go to Dashboard</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-blue-50 to-zinc-200 dark:from-zinc-900 dark:via-blue-900/10 dark:to-zinc-900 p-6">
            <div className="max-w-7xl mx-auto">
                {viewingDocs ? (
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">
                                {viewingDocs.type === 'license' ? 'License Document' : 'Medical Degree'}
                            </h2>
                            <Button variant="outline" onClick={() => setViewingDocs(null)}>
                                <Icon icon="ph:x-bold" className="w-5 h-5 mr-2" />
                                Close
                            </Button>
                        </div>
                        <div className="bg-zinc-100 dark:bg-zinc-700 rounded-xl p-2">
                            <div className="aspect-auto w-full overflow-hidden flex justify-center">
                                <img
                                    src={viewingDocs.url}
                                    alt={viewingDocs.type === 'license' ? 'Medical License' : 'Medical Degree'}
                                    className="max-w-full h-auto object-contain"
                                />
                            </div>
                        </div>
                    </div>
                ) : selectedDoctor ? (
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Doctor Application Details</h2>
                            <Button variant="outline" onClick={() => setSelectedDoctor(null)}>
                                <Icon icon="ph:arrow-left-bold" className="w-5 h-5 mr-2" />
                                Back to Applications
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">Personal Information</h3>
                                    <div className="bg-zinc-50 dark:bg-zinc-700/40 rounded-xl p-4 space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500 dark:text-zinc-400">Full Name</span>
                                            <span className="font-medium">{selectedDoctor.first_name} {selectedDoctor.last_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500 dark:text-zinc-400">Specialty</span>
                                            <span className="font-medium">{selectedDoctor.specialty}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500 dark:text-zinc-400">Experience</span>
                                            <span className="font-medium">{selectedDoctor.years_of_experience} years</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500 dark:text-zinc-400">Phone</span>
                                            <span className="font-medium">{selectedDoctor.phone}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">Professional Details</h3>
                                    <div className="bg-zinc-50 dark:bg-zinc-700/40 rounded-xl p-4 space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500 dark:text-zinc-400">License Number</span>
                                            <span className="font-medium">{selectedDoctor.license_number}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500 dark:text-zinc-400">Hospital/Clinic</span>
                                            <span className="font-medium">{selectedDoctor.hospital_affiliation}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500 dark:text-zinc-400">Office Address</span>
                                            <span className="font-medium">{selectedDoctor.address}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500 dark:text-zinc-400">Application Date</span>
                                            <span className="font-medium">{formatDate(selectedDoctor.created_at)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">Bio</h3>
                                    <div className="bg-zinc-50 dark:bg-zinc-700/40 rounded-xl p-4">
                                        <p className="text-zinc-700 dark:text-zinc-300">{selectedDoctor.bio}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">Uploaded Documents</h3>
                                    <div className="bg-zinc-50 dark:bg-zinc-700/40 rounded-xl p-4 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">Medical License</h4>
                                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Verification document</p>
                                            </div>
                                            <Button
                                                onClick={() => setViewingDocs({ type: 'license', url: selectedDoctor.license_url })}
                                                variant="outline"
                                                className="text-blue-600 dark:text-blue-400"
                                            >
                                                <Icon icon="ph:eye-bold" className="w-4 h-4 mr-2" />
                                                View Document
                                            </Button>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">Medical Degree</h4>
                                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Educational qualification</p>
                                            </div>
                                            <Button
                                                onClick={() => setViewingDocs({ type: 'degree', url: selectedDoctor.degree_url })}
                                                variant="outline"
                                                className="text-blue-600 dark:text-blue-400"
                                            >
                                                <Icon icon="ph:eye-bold" className="w-4 h-4 mr-2" />
                                                View Document
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-6">
                                    <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">Verification Decision</h3>
                                    <div className="bg-zinc-50 dark:bg-zinc-700/40 rounded-xl p-4 space-y-4">
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                            Please review all the provided information and documents carefully before making a decision.
                                        </p>

                                        <div className="flex gap-4">
                                            <Button
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleApproveDoctor(selectedDoctor.id)}
                                            >
                                                <Icon icon="ph:check-bold" className="w-5 h-5 mr-2" />
                                                Approve Doctor
                                            </Button>

                                            <Button
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                                onClick={() => handleRejectDoctor(selectedDoctor.id)}
                                            >
                                                <Icon icon="ph:x-bold" className="w-5 h-5 mr-2" />
                                                Reject Application
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">
                                Doctor Verification
                            </h1>
                            <Button
                                onClick={fetchPendingApplications}
                                variant="outline"
                                className="text-blue-600 dark:text-blue-400"
                            >
                                <Icon icon="ph:arrows-clockwise-bold" className="w-5 h-5 mr-2" />
                                Refresh
                            </Button>
                        </div>

                        {applications.length === 0 ? (
                            <Card className="p-8 text-center">
                                <Icon icon="ph:check-circle-duotone" className="w-16 h-16 mx-auto text-green-500 mb-4" />
                                <h2 className="text-2xl font-bold mb-2">No Pending Applications</h2>
                                <p className="text-zinc-600 dark:text-zinc-400">There are no doctor applications waiting for verification.</p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {applications.map((application) => (
                                    <motion.div
                                        key={application.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="text-lg font-bold">{application.first_name} {application.last_name}</h3>
                                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{application.specialty}</p>
                                                </div>
                                                <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-200 rounded-full">
                                                    Pending
                                                </span>
                                            </div>

                                            <div className="space-y-2 mb-5">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-zinc-500 dark:text-zinc-400">License</span>
                                                    <span>{application.license_number}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-zinc-500 dark:text-zinc-400">Experience</span>
                                                    <span>{application.years_of_experience} years</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-zinc-500 dark:text-zinc-400">Applied on</span>
                                                    <span>{formatDate(application.created_at)}</span>
                                                </div>
                                            </div>

                                            <Button
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                                onClick={() => setSelectedDoctor(application)}
                                            >
                                                Review Application
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}