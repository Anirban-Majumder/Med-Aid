"use client";

import { useState, useContext, useEffect } from "react";
import { Layout } from "@/components/layout";
import { SessionContext } from "@/lib/supabase/usercontext";
import ImageUpload from "@/components/img-upload";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
export default function Dashboard() {
  const { sessionData } = useContext(SessionContext);
  const [openMedicine, setOpenMedicine] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Record<string, Date[]>>({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!sessionData.profile) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full w-full p-4">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-slate-200 dark:bg-slate-700 h-12 w-12"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const handleDateChange = (medicineName: string, date: Date) => {
    setSelectedDates((prevDates) => {
      const isSelected = prevDates[medicineName]?.some(
        (d) => d.toDateString() === date.toDateString()
      );

      return {
        ...prevDates,
        [medicineName]: isSelected
          ? prevDates[medicineName]?.filter((d) => d.toDateString() !== date.toDateString()) || []
          : [...(prevDates[medicineName] || []), date],
      };
    });
  };

  // Function to get medicine icon based on name/description
  const getMedicineIcon = (medicine: any) => {
    const name = medicine.name.toLowerCase();

    // Replace emoji icons with SVG icons
    if (name.includes('pill') || name.includes('tablet'))
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.7071 4.29289C18.5332 3.11895 16.8668 3.11895 15.6929 4.29289L4.29289 15.6929C3.11895 16.8668 3.11895 18.5332 4.29289 19.7071C5.46683 20.8811 7.13317 20.8811 8.30711 19.7071L19.7071 8.30711C20.8811 7.13317 20.8811 5.46683 19.7071 4.29289Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 12L16.5 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    if (name.includes('injection') || name.includes('shot'))
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 2L22 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M6 18L2 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M14 6L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M10 14L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 8L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 6C16 4.89543 15.1046 4 14 4C12.8954 4 12 4.89543 12 6C12 7.10457 12.8954 8 14 8C15.1046 8 16 7.10457 16 6Z" stroke="currentColor" strokeWidth="2" />
        </svg>
      );

    if (name.includes('syrup') || name.includes('liquid'))
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 10V19C6 19.5523 6.44772 20 7 20H17C17.5523 20 18 19.5523 18 19V10H6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M6 10L18 10C18 7 16.5 5 12 5C7.5 5 6 7 6 10Z" stroke="currentColor" strokeWidth="2" />
          <path d="M12 5V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M10 14H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    if (name.includes('cream') || name.includes('ointment'))
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 21H17C18.1046 21 19 20.1046 19 19V11C19 9.89543 18.1046 9 17 9H7C5.89543 9 5 9.89543 5 11V19C5 20.1046 5.89543 21 7 21Z" stroke="currentColor" strokeWidth="2" />
          <path d="M10 9V5C10 3.89543 10.8954 3 12 3C13.1046 3 14 3.89543 14 5V9" stroke="currentColor" strokeWidth="2" />
          <path d="M9 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    if (name.includes('drop'))
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21C15.3137 21 18 18.3137 18 15C18 12.6 16.8 9.9 13.5 6C12.9 5.3 11.1 5.3 10.5 6C7.2 9.9 6 12.6 6 15C6 18.3137 8.68629 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M10 14L14 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M14 14L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    // Default icon
    return (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.7071 4.29289C18.5332 3.11895 16.8668 3.11895 15.6929 4.29289L4.29289 15.6929C3.11895 16.8668 3.11895 18.5332 4.29289 19.7071C5.46683 20.8811 7.13317 20.8811 8.30711 19.7071L19.7071 8.30711C20.8811 7.13317 20.8811 5.46683 19.7071 4.29289Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 12L16.5 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </  svg>
    );
  };

  // Update medicine modal with animations
  const medicineModal = showUploadModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white dark:bg-gray-900 p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700"
      >
        <button
          onClick={() => setShowUploadModal(false)}
          className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition bg-gray-100 dark:bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">
          Add New Medication
        </h2>

        <div className="mb-6 flex flex-col items-center">
          <ImageUpload />
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Upload a clear image of your medication or prescription
          </p>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setShowUploadModal(false)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => setShowUploadModal(false)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
          >
            Upload
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen w-full p-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        {/* Theme Toggle & User Profile Bar */}
        <div className="w-full max-w-5xl mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold mr-3">
              {sessionData.profile.first_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {sessionData.profile.first_name} {sessionData.profile.last_name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back!</p>
            </div>
          </div>

          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Dashboard Header */}
        <div className="w-full max-w-5xl mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
            <span className="bg-gradient-to-r from-cyan-500 to-blue-700 bg-clip-text text-transparent">
              Your Medication Dashboard
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Track and manage your medications easily
          </p>
        </div>

        {/* Dashboard Stats Cards */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 002-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Medications</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {sessionData.medicines.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-400 to-cyan-600 text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Doses</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {Object.values(selectedDates).flat().length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-purple-600 text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Today's Doses</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {Object.values(selectedDates)
                    .flat()
                    .filter(date => date.toDateString() === new Date().toDateString())
                    .length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Medicine Reminder List */}
        <div className="w-full max-w-5xl mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-md flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white mr-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Your Medications</h2>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <span className="flex items-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </span>
              <span>Add Medicine</span>
            </button>
          </div>

          {sessionData.medicines.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center border border-gray-100 dark:border-gray-700">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">No medications added yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Start tracking your medications by adding your first medicine.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg shadow hover:shadow-lg transition-all"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Your First Medicine
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sessionData.medicines.map((medicine) => (
                <div
                  key={medicine.m_id || medicine.name}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 cursor-pointer"
                  onClick={() => setOpenMedicine(medicine.name)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-200 dark:from-cyan-800 dark:to-blue-900 flex items-center justify-center text-cyan-700 dark:text-cyan-300">
                        {getMedicineIcon(medicine)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate">
                          {medicine.name}
                        </h3>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200">
                          Daily
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {medicine.description || "No description available"}
                      </p>

                      <div className="mt-3 flex items-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-cyan-500 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Next: Today</span>
                        </div>
                        <div className="flex items-center ml-4">
                          <svg className="w-4 h-4 mr-1 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{selectedDates[medicine.name]?.length || 0} reminders</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <AnimatePresence>
          {medicineModal}
        </AnimatePresence>

        {/* Medicine-Specific Calendar Modal */}
        {openMedicine && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-50 p-4">
            <div className="relative bg-white dark:bg-gray-900 p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 animate-fadeIn">
              <button
                onClick={() => setOpenMedicine(null)}
                className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition bg-gray-100 dark:bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center justify-center mb-6 space-x-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white">
                  {getMedicineIcon({ name: openMedicine })}
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {openMedicine}
                </h2>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6 border border-gray-100 dark:border-gray-700">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-cyan-500 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Set Reminder Schedule
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Select dates when you need to take this medication
                </p>
                <Calendar
                  onClickDay={(date) => handleDateChange(openMedicine, date)}
                  tileContent={({ date }) =>
                    selectedDates[openMedicine]?.some(
                      (d) => d.toDateString() === date.toDateString()
                    ) ? (
                      <div className="w-6 h-6 mx-auto rounded-full bg-cyan-500 dark:bg-cyan-600 flex items-center justify-center text-white dark:text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : null
                  }
                  className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md w-full text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                />
              </div>

              <div className="flex justify-between mt-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{selectedDates[openMedicine]?.length || 0}</span> reminders set
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setOpenMedicine(null)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setOpenMedicine(null)}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    Save Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
