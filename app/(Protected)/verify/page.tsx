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
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    rejection_reason?: string;
    created_at: string;
};

export default function AdminVerifyPage() {
    console.log("AdminVerifyPage rendering");
    const router = useRouter();
    const supabase = createClient();
    const { sessionData, isLoading: sessionLoading } = useContext(SessionContext);
    const [applications, setApplications] = useState<DoctorApplication[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorApplication | null>(null);
    const [viewingDocs, setViewingDocs] = useState<{ type: 'license' | 'degree', url: string } | null>(null);
    const [stateLoaded, setStateLoaded] = useState(false);
    const [processingAction, setProcessingAction] = useState(false);
    const { toast } = useToast();

    // Debug state for tracking component state
    useEffect(() => {
        console.log("Component state:", {
            isAdmin,
            isLoading,
            sessionLoading,
            applicationsCount: applications.length,
            selectedDoctor: selectedDoctor?.id,
            processingAction
        });
    }, [isAdmin, isLoading, sessionLoading, applications, selectedDoctor, processingAction]);

    // Cleanup function when component unmounts
    useEffect(() => {
        return () => {
            console.log("AdminVerifyPage component unmounting - cleaning up");
            // Any cleanup needed goes here
        };
    }, []);

    // Load state from sessionStorage on initial mount
    useEffect(() => {
        try {
            const savedState = sessionStorage.getItem('verifyPageState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                if (parsedState.applications) setApplications(parsedState.applications);
                if (parsedState.selectedDoctor) setSelectedDoctor(parsedState.selectedDoctor);
                if (parsedState.viewingDocs) setViewingDocs(parsedState.viewingDocs);
                if (parsedState.isAdmin) setIsAdmin(parsedState.isAdmin);
                setStateLoaded(true);
            }
        } catch (error) {
            console.error('Error restoring state from sessionStorage:', error);
        }
    }, []);

    // Add visibility change handler to prevent refreshing when switching tabs
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Tab is now visible again, restore state from sessionStorage
                try {
                    const savedState = sessionStorage.getItem('verifyPageState');
                    if (savedState) {
                        const parsedState = JSON.parse(savedState);
                        if (parsedState.applications) setApplications(parsedState.applications);
                        if (parsedState.selectedDoctor) setSelectedDoctor(parsedState.selectedDoctor);
                        if (parsedState.viewingDocs) setViewingDocs(parsedState.viewingDocs);
                        if (parsedState.isAdmin) setIsAdmin(parsedState.isAdmin);
                    }
                } catch (error) {
                    console.error('Error restoring state on visibility change:', error);
                }
            }
        };

        // Add event listener for visibility change
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Clean up
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Save state to sessionStorage whenever important state changes
    useEffect(() => {
        if (!isLoading) {
            try {
                const stateToSave = {
                    applications,
                    selectedDoctor,
                    viewingDocs,
                    isAdmin
                };
                sessionStorage.setItem('verifyPageState', JSON.stringify(stateToSave));
            } catch (error) {
                console.error('Error saving state to sessionStorage:', error);
            }
        }
    }, [applications, selectedDoctor, viewingDocs, isAdmin, isLoading]);

    useEffect(() => {
        let mounted = true;

        const checkUserAdminStatus = async () => {
            if (!sessionData?.session?.user?.id || !sessionData?.session?.user?.email) {
                if (mounted) {
                    setIsLoading(false);
                }
                return;
            }

            try {
                const isAdminUser = await checkAdminStatus(
                    supabase,
                    sessionData.session.user.id,
                    sessionData.session.user.email
                );

                if (!mounted) return;

                if (!isAdminUser) {
                    setIsAdmin(false);
                    router.push('/Dashboard');
                    return;
                }

                setIsAdmin(true);

                // Only fetch applications if they haven't been loaded from sessionStorage
                if (applications.length === 0 && !stateLoaded) {
                    await fetchPendingApplications();
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                if (!mounted) return;
                console.error('Error in admin verification:', error);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        if (!sessionLoading && !stateLoaded) {
            checkUserAdminStatus();
        } else if (stateLoaded) {
            // If state was loaded from sessionStorage, we can skip the loading phase
            setIsLoading(false);
        }

        return () => {
            mounted = false;
        };
    }, [sessionData?.session?.user, sessionLoading, applications.length, stateLoaded]);

    const fetchPendingApplications = async () => {
        setIsLoading(true);
        try {
            // Fetch applications that need review (not verified yet)
            console.log('Fetching pending doctor applications...');
            const { data, error } = await supabase
                .from('doc_profiles')
                .select('*')
                .eq('is_verified', false)  // Only fetch non-verified applications
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Database error fetching applications:', error.message);
                toast({
                    variant: "destructive",
                    title: "Error fetching applications",
                    description: error.message,
                });
                throw error;
            }

            console.log('Fetched applications:', data?.length || 0);
            setApplications(data || []);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error fetching doctor applications:', errorMessage);
            toast({
                variant: "destructive",
                title: "Error loading applications",
                description: "There was a problem loading doctor applications. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveDoctor = async (doctorId: string) => {
        console.log(`Starting approval process for doctor ID: ${doctorId}`);

        // Confirm with the user first
        if (!window.confirm("Are you sure you want to approve this doctor? They will gain full access to doctor features.")) {
            console.log("Doctor approval cancelled by user");
            return;
        }

        try {
            setProcessingAction(true);

            // Update doctor profile to verified and approved - only using is_verified column
            console.log(`Updating doctor profile for ID: ${doctorId} to approved status`);
            const { data, error } = await supabase
                .from('doc_profiles')
                .update({
                    is_verified: true
                    // Removed is_approved since it doesn't exist in the schema
                })
                .eq('id', doctorId)
                .select();

            if (error) {
                console.error('Database error approving doctor:', error.message, error.code, error.details);
                const errorDetails = error.details ? ` (${error.details})` : '';
                toast({
                    variant: "destructive",
                    title: "Approval Failed",
                    description: `Database error: ${error.message}${errorDetails}`,
                });
                throw error;
            }

            console.log('Doctor profile updated successfully:', data);

            // Refresh the applications list
            await fetchPendingApplications();
            setSelectedDoctor(null);

            // Success notification
            toast({
                title: "Doctor Approved",
                description: "The doctor has been successfully approved and can now use the platform.",
            });

            console.log('Doctor approval process completed successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error approving doctor:', errorMessage);
            toast({
                variant: "destructive",
                title: "Approval Failed",
                description: "There was a problem approving this doctor. Please try again.",
            });
        } finally {
            setProcessingAction(false);
        }
    };

    const handleRejectDoctor = async (doctorId: string) => {
        console.log(`Starting rejection process for doctor ID: ${doctorId}`);

        // Confirm with the user first
        if (!window.confirm("Are you sure you want to reject this doctor application?")) {
            console.log("Doctor rejection cancelled by user");
            return;
        }

        try {
            setProcessingAction(true);

            // Mark the profile as rejected - only using is_verified and rejection_reason
            console.log(`Updating doctor profile for ID: ${doctorId} to rejected status`);
            const { data, error } = await supabase
                .from('doc_profiles')
                .update({
                    is_verified: false,
                    // Removed is_approved since it doesn't exist in the schema
                    rejection_reason: 'Documents or credentials did not meet our standards'
                })
                .eq('id', doctorId)
                .select();

            if (error) {
                console.error('Database error rejecting doctor:', error.message, error.code, error.details);
                const errorDetails = error.details ? ` (${error.details})` : '';
                toast({
                    variant: "destructive",
                    title: "Rejection Failed",
                    description: `Database error: ${error.message}${errorDetails}`,
                });
                throw error;
            }

            console.log('Doctor profile updated as rejected:', data);

            // Refresh the applications list
            await fetchPendingApplications();
            setSelectedDoctor(null);

            // Success notification
            toast({
                title: "Application Rejected",
                description: "The doctor application has been rejected.",
            });

            console.log('Doctor rejection process completed successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error rejecting doctor:', errorMessage);
            toast({
                variant: "destructive",
                title: "Rejection Failed",
                description: "There was a problem rejecting this application. Please try again.",
            });
        } finally {
            setProcessingAction(false);
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
                        <Link href="/Dashboard">Go to Dashboard</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <Layout>
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
                                                <span className="font-medium">{selectedDoctor.specializations}</span>
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
                                                <span className="font-medium">{selectedDoctor.registration_no}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-zinc-500 dark:text-zinc-400">Degree</span>
                                                <span className="font-medium">{selectedDoctor.description}</span>
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
                                                    onClick={() => {
                                                        // Direct approval without modal
                                                        if (selectedDoctor && !processingAction) {
                                                            console.log("Direct approval for doctor:", selectedDoctor.id);
                                                            handleApproveDoctor(selectedDoctor.id);
                                                        }
                                                    }}
                                                    disabled={processingAction}
                                                >
                                                    {processingAction ? (
                                                        <div className="flex items-center justify-center">
                                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Processing...
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Icon icon="ph:check-bold" className="w-5 h-5 mr-2" />
                                                            Approve Doctor
                                                        </>
                                                    )}
                                                </Button>

                                                <Button
                                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                                    onClick={() => {
                                                        // Direct rejection without modal
                                                        if (selectedDoctor && !processingAction) {
                                                            console.log("Direct rejection for doctor:", selectedDoctor.id);
                                                            handleRejectDoctor(selectedDoctor.id);
                                                        }
                                                    }}
                                                    disabled={processingAction}
                                                >
                                                    {processingAction ? (
                                                        <div className="flex items-center justify-center">
                                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Processing...
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Icon icon="ph:x-bold" className="w-5 h-5 mr-2" />
                                                            Reject Application
                                                        </>
                                                    )}
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
                                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{application.specializations}</p>
                                                    </div>
                                                    <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-200 rounded-full">
                                                        {application.is_verified ? "Verified" : "Pending"}
                                                    </span>
                                                </div>

                                                <div className="space-y-2 mb-5">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-zinc-500 dark:text-zinc-400">License</span>
                                                        <span>{application.registration_no}</span>
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
            <Toaster />
        </Layout>
    );
}