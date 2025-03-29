'use client';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

export default function Terms() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-gray-50 via-gray-100 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-950">
      {/* Back to home link with improved design */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-6 left-6 z-10"
      >
        <Link
          href="/"
          className="group flex items-center space-x-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:-translate-x-1 transition-transform" />
          <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100">Back to Home</span>
        </Link>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container max-w-4xl mx-auto px-6 py-16"
      >
        {/* Header section with icon */}
        <motion.div
          variants={itemVariants}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg"
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
            Terms and Conditions
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Please read these terms carefully before using our services
          </p>
        </motion.div>

        <motion.div variants={containerVariants} className="space-y-8">
          {/* Terms sections with enhanced card design */}
          <motion.div variants={itemVariants} className="grid gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 hover:shadow-2xl transition-shadow duration-300">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <span className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center mr-3">
                  <span className="text-cyan-600 dark:text-cyan-400">1</span>
                </span>
                Introduction
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                By using this website, you agree to the following terms and conditions:
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 hover:shadow-2xl transition-shadow duration-300">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <span className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center mr-3">
                  <span className="text-cyan-600 dark:text-cyan-400">2</span>
                </span>
                Account Creation
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                To use certain features of Med-Aid, you may be required to create an account.
                You are responsible for maintaining the confidentiality of your account information and all activities under your account.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 hover:shadow-2xl transition-shadow duration-300">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <span className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center mr-3">
                  <span className="text-cyan-600 dark:text-cyan-400">3</span>
                </span>
                Data Usage
              </h2>
              <ul className="list-none space-y-4">
                <li className="flex items-start">
                  <span className="w-2 h-2 mt-2 rounded-full bg-cyan-500 dark:bg-cyan-400 mr-3"></span>
                  <p className="flex-1 text-gray-600 dark:text-gray-400">By providing us with personal and financial data, you grant Med-Aid a license to collect, process, store, and potentially share that data as part of our general operations.</p>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 mt-2 rounded-full bg-cyan-500 dark:bg-cyan-400 mr-3"></span>
                  <p className="flex-1 text-gray-600 dark:text-gray-400">The nature of data sharing, including potential third-party use, is complex and subject to a range of interpretations. Med-Aid may use your data in ways that align with evolving industry practices.</p>
                </li>
              </ul>
            </div>

            {/* Additional sections with the same enhanced design */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 hover:shadow-2xl transition-shadow duration-300">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <span className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center mr-3">
                  <span className="text-cyan-600 dark:text-cyan-400">4</span>
                </span>
                No Guarantee & Liability
              </h2>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  While Med-Aid strives to offer accurate tools and health assistance suggestions,
                  we make no guarantees regarding the results or the completeness of our advice.
                  Users are encouraged to consult with healthcare professionals for further guidance.
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Med-Aid shall not be liable for any losses, damages, or other consequences arising from the use of this website,
                  including any issues related to the accuracy of medical information or third-party services.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Enhanced Footer */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="py-8 text-center"
      >
        <div className="text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Med-Aid. All rights reserved.
        </div>
      </motion.footer>
    </div>
  );
}