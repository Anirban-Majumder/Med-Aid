'use client';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, ShieldCheck, UserCircle, Server, Key } from 'lucide-react';

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

const iconVariants = {
  hidden: { scale: 0 },
  visible: {
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200
    }
  }
};

type Section = {
  icon: any;
  title: string;
} & (
    | {
      content: Array<{
        subtitle: string;
        details: string;
      }>;
    }
    | {
      items: string[];
    }
  );

export default function PrivacyPolicy() {
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

  const sections: Section[] = [
    {
      icon: UserCircle,
      title: "Information We Collect",
      content: [
        {
          subtitle: "Personal Information",
          details: "Name, email address, phone number, and health-related information."
        },
        {
          subtitle: "Non-Personal Information",
          details: "Browser type, operating system, and website usage patterns."
        }
      ]
    },
    {
      icon: Server,
      title: "How We Use Your Information",
      items: [
        "To provide and improve our healthcare services",
        "To personalize your experience on our platform",
        "To communicate important updates about your medications",
        "To analyze usage patterns and enhance our service",
        "To comply with legal obligations"
      ]
    },
    {
      icon: ShieldCheck,
      title: "Data Security",
      items: [
        "End-to-end encryption for sensitive data",
        "Regular security audits and updates",
        "Strict access controls and monitoring",
        "Secure data storage and transmission protocols"
      ]
    },
    {
      icon: Key,
      title: "Your Rights",
      items: [
        "Request a copy of your personal data",
        "Update or correct your information",
        "Delete your account and associated data",
        "Opt-out of marketing communications"
      ]
    }
  ];

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
            variants={iconVariants}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg"
          >
            <Lock className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            We take your privacy seriously. Learn how we protect and manage your data.
          </p>
        </motion.div>

        <motion.div variants={containerVariants} className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <motion.div
                    variants={iconVariants}
                    className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center"
                  >
                    {<section.icon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />}
                  </motion.div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    {section.title}
                  </h2>
                  {'content' in section ? (
                    <div className="space-y-6">
                      {section.content.map((item, i) => (
                        <div key={i} className="space-y-2">
                          <h3 className="font-semibold text-gray-700 dark:text-gray-300">{item.subtitle}</h3>
                          <p className="text-gray-600 dark:text-gray-400">{item.details}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start space-x-3">
                          <span className="w-2 h-2 mt-2 rounded-full bg-cyan-500 dark:bg-cyan-400 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Contact section */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl shadow-xl p-8 text-center"
          >
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Contact Us</h2>
            <p className="text-gray-600 dark:text-gray-400">
              If you have any questions about our Privacy Policy, please contact us at:
              <a
                href="mailto:privacy@Med-Aid.com"
                className="block mt-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
              >
                privacy@Med-Aid.com
              </a>
            </p>
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