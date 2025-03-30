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
  Loader2,
  LogOut,
  Users,
  Activity,
  CalendarClock
} from 'lucide-react';
import { Switch } from "@/components/ui/switch";

type DoctorProfile = {
  id: number;
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

type DatabaseAppointment = {
  id: string;
  patient_id: string;
  doctor_id: number;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  appointment_date: string;
  reason: string;
  created_at: string;
  users: {
    email: string;
    'user_metadata->>full_name': string;
  } | null;
};

type Appointment = Omit<DatabaseAppointment, 'users'> & {
  patient_name: string;
  patient_email: string;
};

export default function DoctorDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const { sessionData, isLoading: sessionLoading } = useContext(SessionContext);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);

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

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/doctor/docsignup');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    if (!sessionLoading && !sessionData?.session) {
      router.push('/doctor/docsignup');
      return;
    }

    const fetchDoctorData = async () => {
      if (sessionData?.session?.user?.id) {
        try {
          setIsLoading(true);
          const userId = sessionData.session.user.id;
          console.log('Fetching doctor profile for user ID:', userId);

          const { data, error } = await supabase
            .from('doc_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error) {
            console.error('Error fetching doctor profile:', error.message);

            if (error.code === 'PGRST116') {
              console.log('No doctor profile found, redirecting to setup page');
              router.push('/doctor/setup');
              return;
            }

            throw error;
          }

          console.log('Doctor profile found:', data);

          if (!data.is_verified) {
            console.log('Doctor is not verified, redirecting to verify page');
            router.push('/doctor/verify');
            return;
          }

          setDoctorProfile(data as DoctorProfile);
          setIsAvailable(data.is_available || false);

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

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!sessionData?.session?.user?.id || !doctorProfile?.id) return;

      try {
        setIsLoadingAppointments(true);
        console.log('Fetching appointments for doctor ID:', doctorProfile.id);

        // Fetch appointments with user metadata
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            *,
            users (
              email,
              raw_user_meta_data
            )
          `)
          .eq('doctor_id', doctorProfile.id)
          .order('created_at', { ascending: false });

        if (appointmentsError) {
          console.error('Error fetching appointments:', appointmentsError.message);
          throw appointmentsError;
        }

        console.log('Raw appointments data:', appointmentsData);

        if (!appointmentsData || appointmentsData.length === 0) {
          console.log('No appointments found');
          setAppointments([]);
          return;
        }

        // Format appointments
        const formattedAppointments = appointmentsData.map(apt => ({
          id: apt.id,
          patient_id: apt.patient_id,
          doctor_id: apt.doctor_id,
          status: apt.status,
          appointment_date: apt.appointment_date,
          reason: apt.reason,
          created_at: apt.created_at,
          patient_name: apt.users?.raw_user_meta_data?.full_name || apt.users?.email?.split('@')[0] || 'Unknown Patient',
          patient_email: apt.users?.email || 'No email provided'
        }));

        console.log('Formatted appointments:', formattedAppointments);
        setAppointments(formattedAppointments);

      } catch (error: any) {
        console.error('Error in appointments fetch:', {
          message: error?.message || 'Unknown error',
          details: error?.details || '',
          hint: error?.hint || ''
        });
        setAppointments([]);
      } finally {
        setIsLoadingAppointments(false);
      }
    };

    if (doctorProfile?.id) {
      fetchAppointments();
    }
  }, [sessionData?.session?.user?.id, doctorProfile?.id]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatistics = () => {
    const today = new Date().toISOString().split('T')[0];
    return {
      totalPatients: new Set(appointments.map(apt => apt.patient_id)).size,
      appointmentsToday: appointments.filter(apt => apt.appointment_date.startsWith(today)).length,
      upcomingTotal: appointments.filter(apt => apt.status === 'pending' || apt.status === 'approved').length
    };
  };

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

  const stats = getStatistics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-blue-50 to-zinc-200 dark:from-zinc-900 dark:via-blue-900/10 dark:to-zinc-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-xl rounded-xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold mr-4 shadow-lg"
              >
                {doctorProfile?.first_name.charAt(0)}{doctorProfile?.last_name.charAt(0)}
              </motion.div>
              <div>
                <motion.h1
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="text-2xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent"
                >
                  Dr. {doctorProfile?.first_name} {doctorProfile?.last_name}
                </motion.h1>
                <motion.p
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="text-zinc-600 dark:text-zinc-400"
                >
                  {doctorProfile?.specializations}
                </motion.p>
              </div>
            </div>
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="flex items-center space-x-3"
            >
              <Button variant="outline" asChild className="bg-white dark:bg-zinc-800">
                <Link href="/doctor/medverify">
                  <FileText className="w-4 h-4 mr-2" />
                  Med Verify
                </Link>
              </Button>
              <Button variant="outline" asChild className="bg-white dark:bg-zinc-800">
                <Link href="/doctor/profile">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-white dark:bg-zinc-800 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4 mr-2" />
                )}
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </motion.div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-lg rounded-xl hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Patients</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.totalPatients}</h3>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Card className="p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-lg rounded-xl hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Today's Appointments</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.appointmentsToday}</h3>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <Card className="p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-lg rounded-xl hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Upcoming Total</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.upcomingTotal}</h3>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <CalendarClock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            className="lg:col-span-1"
          >
            <Card className="p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-lg rounded-xl">
              <h2 className="text-lg font-semibold mb-4">Availability Status</h2>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-700/30 rounded-lg">
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
            </Card>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.8 }}
            className="lg:col-span-2"
          >
            <Card className="p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-lg rounded-xl">
              <h2 className="text-lg font-semibold mb-4">Recent Appointments</h2>
              {isLoadingAppointments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              ) : appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.slice(0, 5).map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-4 bg-zinc-50 dark:bg-zinc-700/30 rounded-lg flex justify-between items-center hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-medium">{appointment.patient_name}</h3>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {appointment.reason || 'No reason provided'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatDate(appointment.appointment_date)}</p>
                        <p className="text-sm">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                            appointment.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                              appointment.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                            }`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No appointments yet</p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}