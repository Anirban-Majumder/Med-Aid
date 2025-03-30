'use client';
import React, { useContext, useEffect, useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { FloatingDock } from "@/components/ui/floating-dock";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  IconHome,
  IconPill,
  IconLogin,
  IconUser,
  IconStethoscope,
  IconLogout,
  IconMicroscope,
  IconCertificate,
} from "@tabler/icons-react";
import { SessionContext } from "@/lib/supabase/usercontext";
import { CopilotManager } from "@/components/copilot";
import { subscribeUser, unsubscribeUser } from '@/app/actions'
import { createClient } from "@/lib/supabase/client";
import { checkAdminStatus } from "@/lib/supabase/admin"; // Import the admin checking function
import { Toaster } from "@/components/ui/toaster";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { sessionData, setSessionData } = useContext(SessionContext);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  )
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])

  useEffect(() => {
    if (sessionData?.session) {
      setIsLoggedIn(true);
      // Check if user is an admin
      checkIfAdmin();
    } else {
      setIsLoggedIn(false);
      setIsAdmin(false);
    }
  }, [sessionData]);

  const checkIfAdmin = async () => {
    if (sessionData?.session?.user?.id && sessionData?.session?.user?.email) {
      try {
        // Use the checkAdminStatus function from admin.ts
        const isAdminUser = await checkAdminStatus(
          supabase,
          sessionData.session.user.id,
          sessionData.session.user.email
        );

        setIsAdmin(isAdminUser);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    }
  };

  useEffect(() => {
    if (sessionData?.session && !subscription) {
      // Automatically subscribe the logged-in user
      subscribeToPush(sessionData.session.user.id);
    }
  }, [sessionData, subscription]);

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
    const sub = await registration.pushManager.getSubscription()
    setSubscription(sub)
  }

  async function subscribeToPush(userId: string) {
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    })
    setSubscription(sub)
    const serializedSub = JSON.parse(JSON.stringify(sub))
    await subscribeUser(serializedSub, userId)
  }
  async function unsubscribeFromPush() {
    await subscription?.unsubscribe()
    setSubscription(null)
    await unsubscribeUser()
  }

  const dockItems = useMemo(
    () => {
      const items = [
        {
          title: "Dashboard",
          icon: (
            <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />
          ),
          href: "/Dashboard"
        },
        {
          title: "Medicine",
          icon: (
            <IconPill className="h-full w-full text-neutral-500 dark:text-neutral-300" />
          ),
          href: "/Medicine"
        },
        {
          title: "Lab Tests",
          icon: (
            <IconMicroscope className="h-full w-full text-neutral-500 dark:text-neutral-300" />
          ),
          href: "/Labs"
        },
        {
          title: "Appointment",
          icon: (
            <IconStethoscope className="h-full w-full text-neutral-500 dark:text-neutral-300" />
          ),
          href: "/Appointment"
        }
      ];

      // Add admin-only navigation items
      if (isAdmin) {
        items.push({
          title: "Doctor Verification",
          icon: (
            <IconCertificate className="h-full w-full text-neutral-500 dark:text-neutral-300" />
          ),
          href: "/verify" // Changed from "/Protected/verify" to "/verify"
        });
      }

      // Add the sign in/out and profile items
      items.push(
        !isLoggedIn
          ? {
            title: "Sign In",
            icon: (
              <IconLogin className="h-full w-full text-neutral-500 dark:text-neutral-300" />
            ),
            href: "/SignIn"
          }
          : {
            title: "Sign Out",
            icon: (
              <IconLogout className="h-full w-full text-neutral-500 dark:text-neutral-300" />
            ),
            href: "/SignOut"
          },
        {
          title: "Profile",
          icon: (
            <IconUser className="h-full w-full text-neutral-500 dark:text-neutral-300" />
          ),
          href: "/Profile"
        }
      );

      return items;
    },
    [isLoggedIn, isAdmin]
  );

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm">
        {/* Logo section stays the same */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="">
              <img src="/icon.svg" alt="icon" className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
              Med-Aid
            </h1>
          </div>
        </div>

        {/* Replace the nav items with dockItems mapping */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {dockItems.map((item) => (
            <NavLink
              key={item.title}
              href={item.href}
              icon={item.icon}
              isActive={pathname === item.href}
            >
              {item.title}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile Navigation Bar - Adjusted z-index and padding */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden">
        <div className="flex justify-around items-center p-3 pb-6"> {/* Added more bottom padding */}
          {dockItems.map((item) => (
            <MobileNavButton
              key={item.title}
              href={item.href}
              active={pathname === item.href}
            >
              {item.icon}
            </MobileNavButton>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pb-24"> {/* Added bottom padding for mobile */}
        {children}
        <CopilotManager
          sessionData={sessionData}
          setSessionData={setSessionData}
        />
        <Toaster />
      </main>
    </div>
  );
}

// Helper components for navigation
function NavLink({
  href,
  icon,
  children,
  isActive
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
}) {
  return (
    <a
      href={href}
      className={`flex items-center px-4 py-2.5 rounded-lg transition-colors ${isActive
        ? 'bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 text-cyan-700 dark:text-cyan-400'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
    >
      <span className="mr-3">{icon}</span>
      <span className="font-medium">{children}</span>
    </a>
  );
}

function MobileNavButton({ href, children, active = false }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <a
      href={href}
      className={`p-2 rounded-lg ${active
        ? 'bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 text-cyan-700 dark:text-cyan-400'
        : 'text-gray-700 dark:text-gray-300'
        }`}
    >
      {children}
    </a>
  );
}