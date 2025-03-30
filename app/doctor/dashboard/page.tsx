"use client"
import { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SessionContext } from "@/lib/supabase/usercontext";
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  Clock,
  User,
  FileText,
  Bell,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { Switch } from "@/components/ui/switch";

type DoctorProfile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  specializations: string;
  registration_no: string;
  years_of_experience: number;
  phone: string;
  address: string;
  bio: string;
  is_verified: boolean;
  is_available: boolean;
  created_at: string;
};

type Appointment = {
  id: string;
  patient_name: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  reason: string;
};

export default function DoctorDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const { sessionData, isLoading: sessionLoading } = useContext(SessionContext);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);

  // Dummy data for development - replace with real data in production
  const dummyAppointments: Appointment[] = [
    {
      id: '1',
      patient_name: 'Michael Johnson',
      date: '2023-11-20',
      time: '09:30',
      status: 'upcoming',
      reason: 'Annual check-up',
    },
    {
      id: '2',
      patient_name: 'Sarah Williams',
      date: '2023-11-20',
      time: '11:00',
      status: 'upcoming',
      reason: 'Follow-up consultation',
    }
  ];

  const handleAvailabilityChange = async (newStatus: boolean) => {
    try {
      if (!sessionData?.session?.user?.id) {
        console.error('No user ID found in session');
        return;
      }

      console.log('Updating availability status to:', newStatus);
      console.log('For user ID:', sessionData.session.user.id);

      const { data, error } = await supabase
        .from('doc_profiles')
        .update({
          is_available: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', sessionData.session.user.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating availability:', error.message, error.code);
        throw error;
      }

      console.log('Successfully updated availability:', data);
      setIsAvailable(newStatus);
      setDoctorProfile(prev => prev ? { ...prev, is_available: newStatus } : null);

    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      console.error('Error updating availability:', {
        message: errorMessage,
        error: error
      });
      // You might want to show a toast or alert here to inform the user
      setIsAvailable(prev => prev); // Revert the switch to previous state
    }
  };

  useEffect(() => {
    if (!sessionLoading && !sessionData?.session) {
      router.push('/SignIn');
      return;
    }

    const fetchDoctorData = async () => {
      if (sessionData?.session?.user?.id) {
        try {
          setIsLoading(true);
          const userId = sessionData.session.user.id;
          console.log('Fetching doctor profile for user ID:', userId);

          // Fetch doctor profile
          const { data, error } = await supabase
            .from('doc_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error) {
            console.error('Error fetching doctor profile:', error.message);

            // If no profile found, doctor needs to complete setup
            if (error.code === 'PGRST116') {
              console.log('No doctor profile found, redirecting to setup page');
              router.push('/doctor/setup');
              return;
            }

            throw error;
          }

          console.log('Doctor profile found:', data);

          // If doctor is not verified, redirect to verification page
          if (!data.is_verified) {
            console.log('Doctor is not verified, redirecting to verify page');
            router.push('/doctor/verify');
            return;
          }

          setDoctorProfile(data as DoctorProfile);
          setIsAvailable(data.is_available || false);

          // In a real app, fetch real appointments here
          // For now, using dummy data
          setAppointments(dummyAppointments);

        } catch (error) {
          console.error('Error fetching doctor data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (sessionData?.session) {
      fetchDoctorData();
    }
  }, [sessionData, sessionLoading, router]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get upcoming appointments
  const upcomingAppointments = appointments.filter(app => app.status === 'upcoming');

  if (isLoading || sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-100 via-blue-50 to-zinc-200 dark:from-zinc-900 dark:via-blue-900/10 dark:to-zinc-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-blue-50 to-zinc-200 dark:from-zinc-900 dark:via-blue-900/10 dark:to-zinc-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Card */}
        <Card className="p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-md mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold mr-4">
                {doctorProfile?.first_name.charAt(0)}{doctorProfile?.last_name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold">Dr. {doctorProfile?.first_name} {doctorProfile?.last_name}</h1>
                <p className="text-zinc-600 dark:text-zinc-400">{doctorProfile?.specializations}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/doctor/medverify">
                  <FileText className="w-4 h-4 mr-2" />
                  Med Verify
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/doctor/profile">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </Button>
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-700/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {isAvailable ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 mr-2" />
                )}
                <span className="font-medium">
                  {isAvailable ? 'Available for Appointments' : 'Not Available'}
                </span>
              </div>
              <Switch
                checked={isAvailable}
                onCheckedChange={handleAvailabilityChange}
              />
            </div>
          </div>

          {/* Upcoming Appointments (only shown when available) */}
          {isAvailable && upcomingAppointments.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Upcoming Appointments</h2>
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 bg-zinc-50 dark:bg-zinc-700/30 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-medium">{appointment.patient_name}</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{appointment.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatDate(appointment.date)}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{appointment.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}