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
import { Loader2, ArrowRight, Upload } from 'lucide-react';

interface FormData {
    firstName: string;
    lastName: string;
    specialty: string;
    licenseNumber: string;
    yearsOfExperience: string;
    description: string;  // This is for certifications
    phone: string;
    address: string;
    bio: string;
}

const formatSpecialties = (specialtyString: string): string[] => {
    return specialtyString
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
};

export default function DoctorSetup() {
    const router = useRouter();
    const supabase = createClient();
    const { sessionData, isLoading: sessionLoading } = useContext(SessionContext);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        specialty: '',
        licenseNumber: '',
        yearsOfExperience: '',
        description: '',
        phone: '',
        address: '',
        bio: ''
    });
    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [degreeFile, setDegreeFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        // Redirect to sign in if not authenticated
        if (!sessionLoading && !sessionData?.session) {
            router.push('/doctor/docsignup');
            return;
        }

        const checkExistingProfile = async () => {
            if (sessionData?.session?.user?.id) {
                try {
                    const { data: profile, error } = await supabase
                        .from('doctor_profiles') // Changed from doc_profiles to doctor_profiles
                        .select('*')
                        .eq('user_id', sessionData.session.user.id)
                        .single();

                    if (!error && profile) {
                        // If profile exists, redirect to verify page
                        router.push('/doctor/verify');
                        return;
                    }
                } catch (error) {
                    console.error('Error checking existing profile:', error);
                }
            }
        };

        if (sessionData?.session) {
            checkExistingProfile();
        }
    }, [sessionData, sessionLoading, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear the error for this field when user starts typing
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'license' | 'degree') => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (fileType === 'license') {
                setLicenseFile(file);
                if (formErrors['licenseFile']) {
                    setFormErrors(prev => ({ ...prev, licenseFile: '' }));
                }
            } else {
                setDegreeFile(file);
                if (formErrors['degreeFile']) {
                    setFormErrors(prev => ({ ...prev, degreeFile: '' }));
                }
            }
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        // Required fields validation
        if (!formData.firstName.trim()) errors.firstName = 'First name is required';
        if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
        if (!formData.specialty.trim()) errors.specialty = 'Specialty is required';
        if (!formData.licenseNumber.trim()) errors.licenseNumber = 'License number is required';
        if (!formData.yearsOfExperience.trim()) errors.yearsOfExperience = 'Years of experience is required';
        if (!formData.phone.trim()) errors.phone = 'Phone number is required';
        if (!formData.address.trim()) errors.address = 'Office address is required';
        if (!formData.bio.trim()) errors.bio = 'Bio is required';
        if (!formData.description.trim()) errors.description = 'Certifications are required';

        // File validation
        if (!licenseFile) errors.licenseFile = 'License document is required';
        if (!degreeFile) errors.degreeFile = 'Medical degree is required';

        // Update form errors
        setFormErrors(errors);

        // Return true if no errors
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            setError('Please fill in all required fields.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            if (!sessionData?.session?.user?.id) {
                throw new Error('Not authenticated');
            }

            const userId = sessionData.session.user.id;
            const userEmail = sessionData.session.user.email;

            // Upload license file to prescriptions bucket
            let licenseUrl = '';
            if (licenseFile) {
                const licenseFileName = `${userId}/doctor_license_${Date.now()}.${licenseFile.name.split('.').pop()}`;
                const { error: licenseError, data: licenseData } = await supabase.storage
                    .from('prescription') // Store in prescriptions bucket
                    .upload(licenseFileName, licenseFile, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (licenseError) throw licenseError;

                const licensePath = licenseData?.path;
                if (licensePath) {
                    const { data } = supabase.storage.from('prescription').getPublicUrl(licensePath);
                    licenseUrl = data.publicUrl;
                }
            }

            // Upload degree file to prescriptions bucket
            let degreeUrl = '';
            if (degreeFile) {
                const degreeFileName = `${userId}/doctor_degree_${Date.now()}.${degreeFile.name.split('.').pop()}`;
                const { error: degreeError, data: degreeData } = await supabase.storage
                    .from('prescription') // Store in prescriptions bucket
                    .upload(degreeFileName, degreeFile, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (degreeError) throw degreeError;

                const degreePath = degreeData?.path;
                if (degreePath) {
                    const { data } = supabase.storage.from('prescription').getPublicUrl(degreePath);
                    degreeUrl = data.publicUrl;
                }
            }

            // Create doctor profile in Supabase
            const { error: profileError } = await supabase
                .from('doctor_profiles') // Changed from doc_profiles to doctor_profiles
                .insert({
                    created_at: new Date().toISOString(),
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    phone: formData.phone,
                    description: formData.description,
                    email: userEmail,
                    registration_no: formData.licenseNumber,
                    specializations: formatSpecialties(formData.specialty), // Convert to array
                    years_of_experience: parseInt(formData.yearsOfExperience) || 0,
                    address: formData.address,
                    bio: formData.bio,
                    license_url: licenseUrl,
                    degree_url: degreeUrl,
                    is_verified: false
                });

            if (profileError) throw profileError;

            // Redirect to verification page
            router.push('/doctor/verify');

        } catch (error: any) {
            // Enhanced error logging with detailed information
            console.error('Error submitting doctor profile:', error);

            // Extract meaningful error message with fallbacks
            let errorMessage = 'Please try again';

            if (error) {
                if (typeof error === 'string') {
                    errorMessage = error;
                } else if (error.message) {
                    errorMessage = error.message;
                } else if (error.error_description) {
                    errorMessage = error.error_description;
                } else if (error.details) {
                    errorMessage = error.details;
                } else {
                    // If we can't extract a specific message, provide more information about error type
                    errorMessage = `Error type: ${typeof error}. Please try again or contact support.`;
                }
            }

            // Set a user-friendly error message
            setError(`Failed to submit your profile: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (sessionLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-blue-50 to-zinc-200 dark:from-zinc-900 dark:via-blue-900/10 dark:to-zinc-900 p-4 py-10">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block">
                            <Image src="/icon.svg" alt="PharmaAI" width={50} height={50} className="mx-auto mb-4" />
                        </Link>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                            Complete Your Doctor Profile
                        </h1>
                        <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                            Please provide your professional details to complete the verification process.
                            All information will be reviewed by our team.
                        </p>
                    </div>

                    <Card className="p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm shadow-xl rounded-xl border border-zinc-200/50 dark:border-zinc-700/50">
                        {error && (
                            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Personal Information */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className={formErrors.firstName ? "border-red-500" : ""}
                                    />
                                    {formErrors.firstName && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className={formErrors.lastName ? "border-red-500" : ""}
                                    />
                                    {formErrors.lastName && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
                                    )}
                                </div>

                                {/* Professional Information */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        Medical Specialties <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        name="specialty"
                                        value={formData.specialty}
                                        onChange={handleChange}
                                        className={formErrors.specialty ? "border-red-500" : ""}
                                        placeholder="e.g., Cardiology, Pediatrics, Internal Medicine"
                                    />
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                        Separate multiple specialties with commas
                                    </span>
                                    {formErrors.specialty && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.specialty}</p>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        Registration Number <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        name="licenseNumber"
                                        value={formData.licenseNumber}
                                        onChange={handleChange}
                                        className={formErrors.licenseNumber ? "border-red-500" : ""}
                                    />
                                    {formErrors.licenseNumber && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.licenseNumber}</p>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        Years of Experience <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="number"
                                        name="yearsOfExperience"
                                        value={formData.yearsOfExperience}
                                        onChange={handleChange}
                                        className={formErrors.yearsOfExperience ? "border-red-500" : ""}
                                        min="0"
                                    />
                                    {formErrors.yearsOfExperience && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.yearsOfExperience}</p>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        Certifications (comma separated)<span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="e.g., MBBS, MD, DNB"
                                        className={formErrors.description ? "border-red-500" : ""}
                                    />
                                    {formErrors.description && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
                                    )}
                                </div>

                                {/* Contact Information */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className={formErrors.phone ? "border-red-500" : ""}
                                    />
                                    {formErrors.phone && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        Office Address
                                    </label>
                                    <Input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    Professional Bio
                                </label> <span className="text-red-500">*</span>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800/50"
                                    placeholder="Tell us about your professional experience, specializations, and approach to patient care."
                                ></textarea>
                            </div>

                            {/* Document Uploads */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-200">
                                    Required Documents
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                            Medical License <span className="text-red-500">*</span>
                                        </label>
                                        <div className={`border-2 border-dashed rounded-lg p-4 text-center ${formErrors.licenseFile ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"}`}>
                                            <input
                                                type="file"
                                                id="licenseFile"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => handleFileChange(e, 'license')}
                                                className="hidden"
                                            />
                                            <label htmlFor="licenseFile" className="cursor-pointer block">
                                                <Upload className="mx-auto h-8 w-8 text-zinc-500 dark:text-zinc-400 mb-2" />
                                                <span className="text-sm text-zinc-500 dark:text-zinc-400 block">
                                                    {licenseFile ? licenseFile.name : "Click to upload medical license"}
                                                </span>
                                                <span className="text-xs text-zinc-400 dark:text-zinc-500 block mt-1">
                                                    PDF, JPG or PNG up to 5MB
                                                </span>
                                            </label>
                                        </div>
                                        {formErrors.licenseFile && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.licenseFile}</p>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                            Medical Degree <span className="text-red-500">*</span>
                                        </label>
                                        <div className={`border-2 border-dashed rounded-lg p-4 text-center ${formErrors.degreeFile ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"}`}>
                                            <input
                                                type="file"
                                                id="degreeFile"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => handleFileChange(e, 'degree')}
                                                className="hidden"
                                            />
                                            <label htmlFor="degreeFile" className="cursor-pointer block">
                                                <Upload className="mx-auto h-8 w-8 text-zinc-500 dark:text-zinc-400 mb-2" />
                                                <span className="text-sm text-zinc-500 dark:text-zinc-400 block">
                                                    {degreeFile ? degreeFile.name : "Click to upload medical degree"}
                                                </span>
                                                <span className="text-xs text-zinc-400 dark:text-zinc-500 block mt-1">
                                                    PDF, JPG or PNG up to 5MB
                                                </span>
                                            </label>
                                        </div>
                                        {formErrors.degreeFile && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.degreeFile}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center justify-center">
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            <span>Submitting...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center">
                                            <span>Submit for Verification</span>
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </div>
                                    )}
                                </Button>
                                <div className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                                    Your profile will be reviewed by our team within 1-3 business days.
                                </div>
                            </div>
                        </form>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}