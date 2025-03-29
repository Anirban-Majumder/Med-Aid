"use client";
import { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SessionContext } from "@/lib/supabase/usercontext";
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, CheckCircle, XCircle, Eye, Download, Clock, AlertTriangle } from 'lucide-react';
import { isHardcodedAdmin, checkAdminStatus } from '@/lib/supabase/admin';

type DoctorApplication = {
    id: string;
    user_id: string;
    email: string;
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

export default function DoctorVerifyPage() {
    const router = useRouter();
    const supabase = createClient();
    const { sessionData, isLoading: sessionLoading } = useContext(SessionContext);
    const [isAdmin, setIsAdmin] = useState(false);
    const [doctorProfile, setDoctorProfile] = useState<DoctorApplication | null>(null);
    const [pendingApplications, setPendingApplications] = useState<DoctorApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedApplication, setSelectedApplication] = useState<DoctorApplication | null>(null);
    const [viewingDocs, setViewingDocs] = useState<{ type: 'license' | 'degree'; url: string } | null>(null);

    useEffect(() => {
        // Redirect to sign in if not authenticated
        if (!sessionLoading && !sessionData?.session) {
            router.push('/SignIn');
            return;
        }

        const checkUserStatusAndLoadData = async () => {
            if (sessionData?.session?.user?.id) {
                try {
                    setIsLoading(true);
                    const userId = sessionData.session.user.id;
                    const userEmail = sessionData.session.user.email;

                    // Check if user is an admin
                    const adminStatus = await checkAdminStatus(supabase, userId, userEmail);
                    setIsAdmin(adminStatus);

                    if (adminStatus) {
                        // If admin, load all pending applications
                        await fetchPendingApplications();
                    } else {
                        // If not admin, check if user is a doctor and load their profile
                        await fetchDoctorProfile(userId);
                    }
                } catch (error) {
                    console.error('Error checking user status:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        if (sessionData?.session) {
            checkUserStatusAndLoadData();
        }
    }, [sessionData, sessionLoading, router]);

    const fetchDoctorProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('doctor_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                console.error('Error fetching doctor profile:', error);
                // If no profile, redirect to setup
                if (error.code === 'PGRST116') {
                    router.push('/doctor/setup');
                }
                return;
            }

            setDoctorProfile(data as DoctorApplication);
        } catch (error) {
            console.error('Error in fetchDoctorProfile:', error);
        }
    };

    const fetchPendingApplications = async () => {
        try {
            const { data, error } = await supabase
                .from('doctor_profiles')
                .select('*')
                .eq('is_verified', false)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            setPendingApplications(data || []);
        } catch (error) {
            console.error('Error fetching pending applications:', error);
        }
    };

    const handleApproveDoctor = async (doctorId: string) => {
        try {
            setIsLoading(true);
            // Update doctor profile to verified and approved
            const { error } = await supabase
                .from('doctor_profiles')
                .update({
                    is_verified: true,
                    is_approved: true
                })
                .eq('id', doctorId);

            if (error) throw error;

            // Also update the doctor_documents status
            const { error: docError } = await supabase
                .from('doctor_documents')
                .update({
                    status: 'approved',
                    reviewed_at: new Date().toISOString()
                })
                .eq('doctor_id', selectedApplication?.user_id);

            if (docError) {
                console.warn('Error updating document status:', docError);
                // Continue anyway since the main update was successful
            }

            // Refresh the applications list
            await fetchPendingApplications();
            setSelectedApplication(null);

            // TODO: Send notification to the doctor when implemented
            console.log('Doctor approved');
        } catch (error) {
            console.error('Error approving doctor:', error);
            alert('Error approving the doctor. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRejectDoctor = async (doctorId: string) => {
        if (!confirm('Are you sure you want to reject this application?')) return;

        try {
            setIsLoading(true);
            // Mark the doctor profile as rejected
            const { error } = await supabase
                .from('doctor_profiles')
                .update({
                    is_verified: false,
                    is_approved: false,
                    rejection_reason: 'Documents or credentials did not meet our standards'
                })
                .eq('id', doctorId);

            if (error) throw error;

            // Update the doctor_documents status
            const { error: docError } = await supabase
                .from('doctor_documents')
                .update({
                    status: 'rejected',
                    reviewed_at: new Date().toISOString()
                })
                .eq('doctor_id', selectedApplication?.user_id);

            if (docError) {
                console.warn('Error updating document status:', docError);
            }

            // Refresh the applications list
            await fetchPendingApplications();
            setSelectedApplication(null);

            // TODO: Send rejection notification to the doctor when implemented
        } catch (error) {
            console.error('Error rejecting doctor:', error);
            alert('Error rejecting the application. Please try again.');
        } finally {
            setIsLoading(false);
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
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-100 via-blue-50 to-zinc-200 dark:from-zinc-900 dark:via-blue-900/10 dark:to-zinc-900">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
                </div>
            </div>
        );
    }

    // If not admin, show doctor's verification status page
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-blue-50 to-zinc-200 dark:from-zinc-900 dark:via-blue-900/10 dark:to-zinc-900 p-4 flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-md w-full"
                >
                    <div className="text-center mb-8">
                        <Image src="/icon.svg" alt="PharmaAI" width={50} height={50} className="mx-auto mb-4" />
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                            Verification Status
                        </h1>
                    </div>

                    <Card className="p-8 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm shadow-xl rounded-xl border border-zinc-200/50 dark:border-zinc-700/50">
                        {doctorProfile ? (
                            <>
                                {doctorProfile.is_verified ? (
                                    <div className="text-center">
                                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                        <h2 className="text-2xl font-bold mb-2">Verified!</h2>
                                        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                                            Your doctor account has been verified and approved. You can now access all features.
                                        </p>
                                        <Button asChild>
                                            <Link href="/Dashboard">Go to Dashboard</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <Clock className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                                        <h2 className="text-2xl font-bold mb-2">Verification Pending</h2>
                                        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                                            Your application is currently under review. This typically takes 1-3 business days.
                                        </p>
                                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg text-sm text-amber-800 dark:text-amber-300 mb-6">
                                            <div className="flex items-start">
                                                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                                <p>
                                                    Please don't submit another application. We'll notify you once the review is complete.
                                                </p>
                                            </div>
                                        </div>
                                        <Button asChild variant="outline">
                                            <Link href="/">Return to Home</Link>
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center">
                                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold mb-2">No Application Found</h2>
                                <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                                    We couldn't find a doctor verification application for your account.
                                </p>
                                <Button asChild>
                                    <Link href="/doctor/setup">Complete Your Application</Link>
                                </Button>
                            </div>
                        )}
                    </Card>
                </motion.div>
            </div>
        );
    }

    // Admin verification interface
    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-blue-50 to-zinc-200 dark:from-zinc-900 dark:via-blue-900/10 dark:to-zinc-900 p-6">
            <div className="max-w-7xl mx-auto">
                {viewingDocs ? (
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">
                                {viewingDocs.type === 'license' ? 'Medical License' : 'Medical Degree'}
                            </h2>
                            <div className="flex space-x-3">
                                <Button variant="outline" asChild>
                                    <a href={viewingDocs.url} target="_blank" rel="noopener noreferrer" download>
                                        <Download className="w-5 h-5 mr-2" />
                                        Download
                                    </a>
                                </Button>
                                <Button variant="outline" onClick={() => setViewingDocs(null)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                        <div className="bg-zinc-100 dark:bg-zinc-700 rounded-xl p-2">
                            <div className="aspect-auto w-full overflow-hidden flex justify-center">
                                {viewingDocs.url.toLowerCase().endsWith('.pdf') ? (
                                    <iframe
                                        src={viewingDocs.url}
                                        className="w-full h-[70vh]"
                                        title={viewingDocs.type === 'license' ? 'Medical License' : 'Medical Degree'}
                                    />
                                ) : (
                                    <img
                                        src={viewingDocs.url}
                                        alt={viewingDocs.type === 'license' ? 'Medical License' : 'Medical Degree'}
                                        className="max-w-full h-auto object-contain"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                ) : selectedApplication ? (
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Doctor Application Details</h2>
                            <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                                Back to Applications
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                                            <p className="font-medium">{selectedApplication.first_name} {selectedApplication.last_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                            <p className="font-medium">{selectedApplication.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                                            <p className="font-medium">{selectedApplication.phone}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                                            <p className="font-medium">{selectedApplication.address || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Specialty</p>
                                            <p className="font-medium">{selectedApplication.specialty}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">License Number</p>
                                            <p className="font-medium">{selectedApplication.license_number}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Experience</p>
                                            <p className="font-medium">{selectedApplication.years_of_experience} years</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Hospital Affiliation</p>
                                            <p className="font-medium">{selectedApplication.hospital_affiliation || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>

                                {selectedApplication.bio && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Professional Bio</h3>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                            {selectedApplication.bio}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Application Info</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Submitted On</p>
                                            <p className="font-medium">{formatDate(selectedApplication.created_at)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                            <p className="font-medium">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                                    Pending Review
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Verification Documents</h3>
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Medical License</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Verification document</p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => setViewingDocs({ type: 'license', url: selectedApplication.license_url })}>
                                                <Eye className="w-4 h-4 mr-2" />
                                                View
                                            </Button>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Medical Degree</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Education credential</p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => setViewingDocs({ type: 'degree', url: selectedApplication.degree_url })}>
                                                <Eye className="w-4 h-4 mr-2" />
                                                View
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold mb-4">Decision</h3>
                                    <div className="space-y-4">
                                        <Button
                                            onClick={() => handleApproveDoctor(selectedApplication.id)}
                                            disabled={isLoading}
                                            className="w-full bg-green-600 hover:bg-green-700"
                                        >
                                            {isLoading ? (
                                                <div className="flex items-center">
                                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                    <span>Processing...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center">
                                                    <CheckCircle className="w-5 h-5 mr-2" />
                                                    <span>Approve Doctor</span>
                                                </div>
                                            )}
                                        </Button>

                                        <Button
                                            onClick={() => handleRejectDoctor(selectedApplication.id)}
                                            disabled={isLoading}
                                            variant="outline"
                                            className="w-full border-red-300 text-red-600 hover:border-red-400 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                                        >
                                            {isLoading ? (
                                                <div className="flex items-center">
                                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                    <span>Processing...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center">
                                                    <XCircle className="w-5 h-5 mr-2" />
                                                    <span>Reject Application</span>
                                                </div>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-bold">Doctor Verification Dashboard</h1>
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    Review and approve doctor applications
                                </p>
                            </div>
                            <Button asChild>
                                <Link href="/Dashboard">Return to Dashboard</Link>
                            </Button>
                        </div>

                        {pendingApplications.length === 0 ? (
                            <Card className="p-8 text-center">
                                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                                <h2 className="text-2xl font-bold mb-2">All Caught Up!</h2>
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    There are no pending doctor applications to review at this time.
                                </p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pendingApplications.map((application) => (
                                    <Card key={application.id} className="overflow-hidden bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md hover:shadow-lg transition-shadow">
                                        <div className="p-6">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-xl font-semibold">
                                                        Dr. {application.first_name} {application.last_name}
                                                    </h3>
                                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                                                        {application.specialty}
                                                    </p>
                                                </div>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                                    Pending
                                                </span>
                                            </div>

                                            <div className="mt-4 space-y-2 text-sm">
                                                <div className="flex items-center">
                                                    <span className="text-zinc-500 dark:text-zinc-400 w-24">License:</span>
                                                    <span className="font-medium">{application.license_number}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-zinc-500 dark:text-zinc-400 w-24">Experience:</span>
                                                    <span className="font-medium">{application.years_of_experience} years</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-zinc-500 dark:text-zinc-400 w-24">Submitted:</span>
                                                    <span className="font-medium">{formatDate(application.created_at)}</span>
                                                </div>
                                            </div>

                                            <div className="mt-6">
                                                <Button
                                                    onClick={() => setSelectedApplication(application)}
                                                    className="w-full"
                                                >
                                                    Review Application
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}