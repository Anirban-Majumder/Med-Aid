"use client"

import { useContext, useState } from "react";
import { motion } from "framer-motion";
import ImageUpload from "@/components/img-upload";
import Symptom from "@/components/symptom-upload";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SessionContext } from "@/lib/supabase/usercontext";
import { ImageIcon, Loader2 } from "lucide-react";

export default function Profile() {
  const { sessionData, setSessionData } = useContext(SessionContext);
  const isLoading = false;
  const symptoms = sessionData.profile?.symptoms;
  const [isEditing, setIsEditing] = useState(false);
  const [loadingMedicineId, setLoadingMedicineId] = useState<string | null>(null);
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);

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

  // Function to handle buying medicine
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

  return (
    <Layout>
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
          {/* Profile Header */}
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
          </motion.div>

          {/* Main Content */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 p-4 sm:p-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-4 lg:space-y-6 lg:border-r lg:border-gray-200 lg:dark:border-gray-700 lg:pr-6">
                {/* Contact Information */}
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

                {/* Medicines Section */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-semibold">Medicines</h2>
                    <ImageUpload />
                  </div>
                  {isLoading ? (
                    // Loading skeletons
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
                      <div className="flex gap-4 pb-2 min-w-full">
                        {sessionData.medicines.map((medicine) => {
                          const medicineId = medicine.m_id || medicine.name;
                          const isBuyLoading = loadingMedicineId === medicineId;
                          const isViewLoading = loadingDetailsId === medicineId;

                          return (
                            <div
                              key={medicineId}
                              className="flex-shrink-0 w-[280px] p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                            >
                              <h3 className="text-base sm:text-lg font-semibold truncate">
                                {medicine.name}
                              </h3>
                              <p className="mt-2 text-gray-600 dark:text-gray-300">
                                <span className="font-medium">Dosage:</span> {medicine.description}
                              </p>
                              <p className="mt-1 text-gray-600 dark:text-gray-300">
                                <span className="font-medium">Duration:</span> {medicine.eat_upto}
                              </p>
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
                                      // Will be automatically redirected by Link component
                                      // But still set loading state for visual feedback
                                      setTimeout(() => setLoadingDetailsId(null), 500);
                                    }}
                                  >
                                    <Link href={`/MedDetails?id=${medicine.m_id}`}>View Details</Link>
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

                {/* Prescriptions Section */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <h2 className="text-lg sm:text-xl font-semibold">Prescriptions</h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {(sessionData.profile?.prescription_url?.length || 0) > 0 ? (
                      sessionData.profile?.prescription_url
                        .filter((imageUrl: any) => imageUrl !== " ")
                        .map((imageUrl: any, index: any) => (
                          <div
                            key={index}
                            className="w-40 h-60 border-2 border-gray-300 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                          >
                            <img src={imageUrl} alt={`Prescription ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))
                    ) : (
                      // Fallback UI if no images are available
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

              {/* Right Column - Symptoms */}
              <motion.div variants={itemVariants} className="space-y-3 lg:pl-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold">Symptoms</h2>
                  <Symptom />
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <ul className="list-disc list-inside">
                    {symptoms?.length === 0 ? (
                      <p className="text-gray-600 dark:text-gray-300">
                        You have not added any symptoms.
                      </p>
                    ) : (
                      symptoms?.map((symptom: any, index: any) => (
                        <li key={index} className="text-gray-800 dark:text-gray-100">
                          {symptom.name} (from {symptom.startDate.split("-").reverse().join("-")}
                          {symptom.isActive ? null : ` to ${symptom.endDate?.split("-").reverse().join("-")}`})
                        </li>
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
