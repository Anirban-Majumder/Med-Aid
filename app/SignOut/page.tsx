"use client";

import { useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { SessionContext } from "@/lib/supabase/usercontext";
import { createClient } from "@supabase/supabase-js";
import { Layout } from "@/components/layout";
import type { SessionData } from "@/lib/supabase/usercontext";

export default function SignOut() {
  const router = useRouter();
  const { setSessionData } = useContext(SessionContext);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setSessionData({ session: null, profile: null, medicines: [] } as SessionData);
      router.push("/SignIn");
    } catch (error) {
      console.error("Error signing out:", error);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/Dashboard");
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <Layout>
      <motion.div
        className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div variants={itemVariants} className="text-center mb-8">
              <motion.div
                className="mx-auto w-16 h-16 mb-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </motion.div>
              <motion.h2 variants={itemVariants} className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Sign Out
              </motion.h2>
              <motion.p variants={itemVariants} className="text-gray-600 dark:text-gray-400">
                Are you sure you want to sign out of your account?
              </motion.p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <motion.button
                whileHover={{ scale: isLoading ? 1 : 1.03, boxShadow: isLoading ? "none" : "0 5px 15px rgba(0,0,0,0.1)" }}
                whileTap={{ scale: isLoading ? 1 : 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={handleSignOut}
                disabled={isLoading}
                className={`w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg shadow-md transition-all duration-200 flex items-center justify-center ${isLoading ? 'opacity-80 cursor-not-allowed' : 'hover:shadow-lg'}`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing out...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign Out
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: "#f3f4f6" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={handleCancel}
                disabled={isLoading}
                className={`w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 flex items-center justify-center ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
                  />
                </svg>
                Cancel
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
