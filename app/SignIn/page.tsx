"use client"
import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Icon } from '@iconify/react';
import { SessionContext } from "@/lib/supabase/usercontext";
import { motion } from 'framer-motion';

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();
  const { sessionData } = useContext(SessionContext);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.protocol}//${window.location.host}/api/auth/confirm`
      },
    });
    if (error) alert(error.message);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-zinc-100 via-pink-50 to-zinc-200 dark:from-zinc-900 dark:via-pink-900/10 dark:to-zinc-900"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          delay: 0.2,
          duration: 0.5,
          type: "spring",
          stiffness: 100
        }}
        className="w-full max-w-md p-8 space-y-8 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl dark:bg-zinc-800/90 border border-zinc-200/50 dark:border-zinc-700/50"
      >
        <motion.div
          className="text-center space-y-6"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.div
            className="flex justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon icon="medical-icon:i-pharmacy" className="w-20 h-20 text-pink-500 drop-shadow-lg" />
          </motion.div>
          <motion.h1
            className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Welcome to PharmaAI
          </motion.h1>
          <motion.p
            className="text-lg text-zinc-600 dark:text-zinc-400"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Your personal medicine assistant
          </motion.p>
        </motion.div>

        <motion.button
          onClick={handleGoogleLogin}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.6,
            duration: 0.5,
            type: "spring",
            stiffness: 100
          }}
          className="flex items-center justify-center w-full px-6 py-4 text-lg font-medium transition-all duration-300 bg-white border-2 border-zinc-200 rounded-2xl hover:bg-zinc-50 hover:border-pink-200 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:border-pink-500/50 dark:hover:bg-zinc-700/80 group shadow-lg hover:shadow-xl dark:shadow-zinc-900/30"
        >
          <Icon icon="flat-color-icons:google" width={28} className="mr-3" />
          <span className="text-zinc-700 dark:text-zinc-300 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
            Continue with Google
          </span>
        </motion.button>

        <motion.div
          className="text-center text-sm text-zinc-500 dark:text-zinc-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          By continuing, you agree to our
          <motion.a
            href="/terms"
            className="text-pink-500 hover:text-pink-600 dark:hover:text-pink-400 hover:underline mx-1 inline-block"
            whileHover={{ scale: 1.05 }}
          >
            Terms of Service
          </motion.a>
          and
          <motion.a
            href="/privacypolicy"
            className="text-pink-500 hover:text-pink-600 dark:hover:text-pink-400 hover:underline mx-1 inline-block"
            whileHover={{ scale: 1.05 }}
          >
            Privacy Policy
          </motion.a>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}