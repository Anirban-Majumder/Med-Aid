"use client"

import { useContext, useState } from "react";
import { motion } from "framer-motion";
import ImageUpload from "@/components/img-upload";
import Symptom from "@/components/symptom-upload";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { SessionContext } from "@/lib/supabase/usercontext";
import { ImageIcon, Loader2, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";

export default function Profile() {
  const { sessionData, setSessionData } = useContext(SessionContext);
  const router = useRouter();
  const isLoading = false;
  const supabase = createClient();
  const symptoms = sessionData.profile?.symptoms;
  const [isEditing, setIsEditing] = useState(false);
  const [loadingMedicineId, setLoadingMedicineId] = useState<string | null>(null);
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);
  const [isEditProfileLoading, setIsEditProfileLoading] = useState(false);
  const [isDeletingPrescription, setIsDeletingPrescription] = useState<number | null>(null);
  const [isDeletingSymptom, setIsDeletingSymptom] = useState<string | null>(null);
  const [isDeletingMedicine, setIsDeletingMedicine] = useState<string | null>(null);

  const getRelatedSymptoms = (medicineName: string) => {
    if (!sessionData.profile?.symptoms || sessionData.profile.symptoms.length === 0) {
      return [];
    }

    return sessionData.profile.symptoms.filter(symptom =>
      medicineName.toLowerCase().includes(symptom.name.toLowerCase()) ||
      symptom.name.toLowerCase().includes(medicineName.toLowerCase())
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  const handleActive = async (symptom: any) => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const updatedSymptom = {
        ...symptom,
        isActive: false,
        endDate: currentDate,
      };

      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('symptoms')
        .eq('user_id', sessionData?.profile?.user_id)
        .single();

      if (fetchError) throw fetchError;

      const updatedSymptoms = profileData.symptoms.map((s: any) =>
        s.name === symptom.name ? updatedSymptom : s
      );

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          symptoms: updatedSymptoms
        })
        .eq('user_id', sessionData?.profile?.user_id);

      if (updateError) throw updateError;

      setSessionData((prev: any) => ({
        ...prev,
        profile: {
          ...prev.profile,
          symptoms: updatedSymptoms
        }
      }));
    } catch (error) {
      console.error('Error updating symptom:', error);
    }
  };

  const handleBuyMedicine = async (medicine: any) => {
    try {
      setLoadingMedicineId(medicine.m_id || medicine.name);
      const response = await fetch(`/api/medPriceSearch?name=${encodeURIComponent(medicine.name)}`);
      if (!response.ok) throw new Error("Failed to search medicine");

      const data = await response.json();
      if (data && data.length > 0) {
        const firstMedicine = data[0];
        window.location.href = `/Medicine?name=${encodeURIComponent(firstMedicine.medicineName)}&pack=${encodeURIComponent(firstMedicine.packSize)}`;
      } else {
        console.error("No medicine found in search results");
      }
    } catch (error) {
      console.error("Error searching medicine:", error);
    } finally {
      setLoadingMedicineId(null);
    }
  };

  const handleEditProfileClick = () => {
    setIsEditProfileLoading(true);
    router.push("/SetUp");
  };

  const handleDeletePrescription = async (index: number, imageUrl: string) => {
    try {
      setIsDeletingPrescription(index);

      // Delete from Supabase Storage bucket
      const filePath = imageUrl.split('/').pop(); // Get filename from URL
      if (filePath) {
        const { error: storageError } = await supabase
          .storage
          .from('prescriptions')
          .remove([filePath]);

        if (storageError) {
          console.error('Error deleting from storage:', storageError);
          return;
        }
      }

      // Update the database
      const updatedPrescriptions = [...(sessionData.profile?.prescription_url || [])];
      updatedPrescriptions.splice(index, 1);

      const { error } = await supabase
        .from('profiles')
        .update({
          prescription_url: updatedPrescriptions
        })
        .eq('user_id', sessionData?.profile?.user_id);

      if (error) throw error;

      setSessionData((prev: any) => ({
        ...prev,
        profile: {
          ...prev.profile,
          prescription_url: updatedPrescriptions
        }
      }));
    } catch (error) {
      console.error('Error deleting prescription:', error);
    } finally {
      setIsDeletingPrescription(null);
    }
  };

  const handleDeleteSymptom = async (symptomName: string) => {
    try {
      setIsDeletingSymptom(symptomName);
      const updatedSymptoms = symptoms?.filter((s: any) => s.name !== symptomName) || [];

      const { error } = await supabase
        .from('profiles')
        .update({
          symptoms: updatedSymptoms
        })
        .eq('user_id', sessionData?.profile?.user_id);

      if (error) throw error;

      setSessionData((prev: any) => ({
        ...prev,
        profile: {
          ...prev.profile,
          symptoms: updatedSymptoms
        }
      }));
    } catch (error) {
      console.error('Error deleting symptom:', error);
    } finally {
      setIsDeletingSymptom(null);
    }
  };

  const handleDeleteMedicine = async (medicineId: string) => {
    try {
      setIsDeletingMedicine(medicineId);

      if (!sessionData?.profile?.user_id) {
        throw new Error('User ID not found');
      }

      // Delete from medicines table
      const { error: deleteError } = await supabase
        .from('medicines')
        .delete()
        .eq('user_id', sessionData.profile.user_id)
        .eq('m_id', medicineId);

      if (deleteError) throw deleteError;

      // Update local state
      setSessionData((prev: any) => ({
        ...prev,
        medicines: prev.medicines.filter((m: any) => (m.m_id || m.name) !== medicineId)
      }));

      toast.success('Medicine deleted successfully');

    } catch (error: any) {
      console.error('Error deleting medicine:', error.message);
      toast.error('Failed to delete medicine');
    } finally {
      setIsDeletingMedicine(null);
    }
  };

  return (
    <Layout>
      <Toaster />
      <motion.div
        className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto px-4 py-6 space-y-4 sm:space-y-6 max-w-7xl"
        >
          <motion.div variants={itemVariants} className="flex flex-col items-center mb-4 sm:mb-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 17 }}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center"
            >
              <span className="text-4xl sm:text-6xl text-white font-bold">
                {sessionData.profile?.first_name.charAt(0)}
              </span>
            </motion.div>
            <motion.h1 className="text-2xl sm:text-3xl font-bold mt-2 text-center bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
              {sessionData.profile?.first_name + " " + sessionData.profile?.last_name}
            </motion.h1>

            <motion.div
              variants={itemVariants}
              className="mt-3"
              whileHover={{ scale: 1.05 }}
            >
              <Button
                variant="outline"
                className="flex items-center gap-2 px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={handleEditProfileClick}
                disabled={isEditProfileLoading}
              >
                {isEditProfileLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 p-4 sm:p-6">
              <div className="lg:col-span-2 space-y-4 lg:space-y-6 lg:border-r lg:border-gray-200 lg:dark:border-gray-700 lg:pr-6">
                <motion.div variants={itemVariants} className="space-y-3">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Contact Information
                  </h2>
                  <div className="space-y-3">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      <Label className="text-sm text-gray-600 dark:text-gray-400">Email</Label>
                      <input
                        className="w-full bg-transparent text-sm sm:text-base mt-1"
                        value={sessionData.session?.user.email || ""}
                        readOnly
                      />
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      <Label className="text-sm text-gray-600 dark:text-gray-400">Phone</Label>
                      <input
                        className="w-full bg-transparent text-sm sm:text-base mt-1"
                        value={sessionData.profile?.phone || ""}
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-semibold">Medicines</h2>
                    <ImageUpload />
                  </div>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, idx) => (
                        <div
                          key={idx}
                          className="animate-pulse flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
                        >
                          <div className="rounded-full bg-gray-300 dark:bg-gray-700 h-12 w-12"></div>
                          <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : sessionData.medicines.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-300">
                      You have not added any medicine.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <div className="flex gap-4 pb-2 min-w-full p-4">
                        {sessionData.medicines.map((medicine) => {
                          const medicineId = medicine.m_id || medicine.name;
                          const isBuyLoading = loadingMedicineId === medicineId;
                          const isViewLoading = loadingDetailsId === medicineId;
                          const isDeleting = isDeletingMedicine === medicineId;

                          return (
                            <div
                              key={medicineId}
                              className="relative flex-shrink-0 w-[280px] p-6 bg-gray-50 dark:bg-gray-900 rounded-lg group m-2"
                            >
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-2 h-8 w-8 z-10 shadow-md hover:shadow-lg"
                                onClick={() => handleDeleteMedicine(medicineId)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                              <h3 className="text-base sm:text-lg font-semibold truncate">
                                {medicine.name}
                              </h3>
                              <p className="mt-2 text-gray-600 dark:text-gray-300">
                                <span className="font-medium">Dosage:</span> {medicine.description}
                              </p>
                              <p className="mt-1 text-gray-600 dark:text-gray-300">
                                <span className="font-medium">Duration:</span> {medicine.eat_upto}
                              </p>

                              {/* Display related symptoms */}
                              {(() => {
                                const relatedSymptoms = getRelatedSymptoms(medicine.name);
                                return relatedSymptoms.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                      Related Symptoms:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {relatedSymptoms.map((symptom, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                                        >
                                          {symptom.name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Display side effects and uses */}
                              {medicine.side_effect?.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Side Effects:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {medicine.side_effect.map((effect, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900 text-grey-400 dark:text-grey-100"
                                      >
                                        {effect}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {medicine.uses && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Uses:
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {medicine.uses}
                                  </p>
                                </div>
                              )}

                              <div className="flex gap-2 mt-2">
                                <Button
                                  disabled={isBuyLoading}
                                  onClick={() => handleBuyMedicine(medicine)}
                                >
                                  {isBuyLoading ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Loading...
                                    </>
                                  ) : 'Buy now'}
                                </Button>
                                {isViewLoading ? (
                                  <Button disabled>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => {
                                      setLoadingDetailsId(medicineId);
                                      setTimeout(() => setLoadingDetailsId(null), 500);
                                    }}
                                  >
                                    <Link href={`/MedDetails?name=${medicine.name}`}>View Details</Link>
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-3">
                  <h2 className="text-lg sm:text-xl font-semibold">Prescriptions</h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {(sessionData.profile?.prescription_url?.length || 0) > 0 ? (
                      sessionData.profile?.prescription_url
                        .filter((imageUrl: any) => imageUrl !== " ")
                        .map((imageUrl: any, index: any) => (
                          <div
                            key={index}
                            className="relative w-40 h-60 border-2 border-gray-300 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden group"
                          >
                            <img src={imageUrl} alt={`Prescription ${index + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200" />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-2 h-8 w-8"
                              onClick={() => handleDeletePrescription(index, imageUrl)}
                              disabled={isDeletingPrescription === index}
                            >
                              {isDeletingPrescription === index ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))
                    ) : (
                      [...Array(5)].map((_, index) => (
                        <div
                          key={index}
                          className="w-40 h-60 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center flex-shrink-0"
                        >
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="space-y-3 lg:pl-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold">Symptoms</h2>
                  <Symptom />
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <ul className="space-y-3">
                    {symptoms?.length === 0 ? (
                      <p className="text-gray-600 dark:text-gray-300">
                        You have not added any symptoms.
                      </p>
                    ) : (
                      symptoms
                        ?.sort((a, b) => {
                          if (a.isActive && !b.isActive) return -1;
                          if (!a.isActive && b.isActive) return 1;
                          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
                        }).map((symptom: any, index: any) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-all"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {symptom.name}
                                </span>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <span>From: {symptom.startDate.split("-").reverse().join("-")}</span>
                                  {!symptom.isActive && (
                                    <>
                                      <span>•</span>
                                      <span>To: {symptom.endDate?.split("-").reverse().join("-")}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {symptom.isActive && (
                                  <Switch
                                    checked={true}
                                    onCheckedChange={() => handleActive(symptom)}
                                    className="data-[state=checked]:bg-cyan-500"
                                  />
                                )}
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="rounded-full p-2 h-8 w-8"
                                  onClick={() => handleDeleteSymptom(symptom.name)}
                                  disabled={isDeletingSymptom === symptom.name}
                                >
                                  {isDeletingSymptom === symptom.name ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </motion.li>
                        ))
                    )}
                  </ul>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
