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
import { Layout } from "@/components/layout";
import {
  Calendar,
  Clock,
  Users,
  FileText,
  Settings,
  User,
  BarChart4,
  MessageSquare,
  Bell,
  ChevronRight,
  Plus,
  Loader2
} from 'lucide-react';

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
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    upcomingAppointments: 0,
  });

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
    },
    {
      id: '3',
      patient_name: 'David Chen',
      date: '2023-11-19',
      time: '14:15',
      status: 'completed',
      reason: 'Blood pressure monitoring',
    },
    {
      id: '4',
      patient_name: 'Emma Thompson',
      date: '2023-11-18',
      time: '10:45',
      status: 'completed',
      reason: 'Chronic pain management',
    },
  ];

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

          // In a real app, fetch real appointments here
          // For now, using dummy data
          setAppointments(dummyAppointments);

          // Set dummy stats (replace with real data in production)
          setStats({
            totalPatients: 24,
            totalAppointments: 67,
            upcomingAppointments: 2,
          });

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

  // Get today's appointments
  const todaysAppointments = appointments.filter(app => {
    const today = new Date().toISOString().split('T')[0];
    return app.date === today && app.status === 'upcoming';
  });

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
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-blue-50 to-zinc-200 dark:from-zinc-900 dark:via-blue-900/10 dark:to-zinc-900">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

          {/* Dashboard Header */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Dr. {doctorProfile?.first_name} {doctorProfile?.last_name}'s Dashboard
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                {doctorProfile?.specializations} • {doctorProfile?.years_of_experience} years of experience
              </p>
            </motion.div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl mr-4">
                    <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">Total Patients</p>
                    <h3 className="text-2xl font-bold">{stats.totalPatients}</h3>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl mr-4">
                    <Calendar className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">Total Appointments</p>
                    <h3 className="text-2xl font-bold">{stats.totalAppointments}</h3>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl mr-4">
                    <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">Upcoming Appointments</p>
                    <h3 className="text-2xl font-bold">{stats.upcomingAppointments}</h3>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Today's Appointments */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Today's Appointments</h2>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/doctor/appointments">
                      View All <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {todaysAppointments.length > 0 ? (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {todaysAppointments.map((appointment) => (
                      <div key={appointment.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{appointment.patient_name}</h3>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                            {appointment.time}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">{appointment.reason}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1">No Appointments Today</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                      You don't have any scheduled appointments for today.
                    </p>
                    <Button className="mt-4" asChild>
                      <Link href="/doctor/appointments/schedule">
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule Appointment
                      </Link>
                    </Button>
                  </div>
                )}
              </Card>

              {/* Recent Appointments */}
              <Card className="p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-md mt-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Recent Appointments</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-zinc-500 dark:text-zinc-400 text-sm border-b border-zinc-200 dark:border-zinc-700">
                        <th className="pb-2 font-medium">Patient</th>
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.slice(0, 4).map((appointment) => (
                        <tr key={appointment.id} className="border-b border-zinc-200 dark:border-zinc-700 last:border-0">
                          <td className="py-3">
                            <div className="font-medium">{appointment.patient_name}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">{appointment.reason}</div>
                          </td>
                          <td className="py-3">
                            <div>{formatDate(appointment.date)}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">{appointment.time}</div>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${appointment.status === 'upcoming'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : appointment.status === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }`}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/doctor/appointments/${appointment.id}`}>
                                View
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>

            {/* Right Column - Quick Actions & Profile Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {/* Doctor Profile Summary */}
              <Card className="p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-md mb-6">
                <div className="text-center mb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold mx-auto">
                    {doctorProfile?.first_name.charAt(0)}{doctorProfile?.last_name.charAt(0)}
                  </div>
                  <h2 className="text-xl font-bold mt-4">Dr. {doctorProfile?.first_name} {doctorProfile?.last_name}</h2>
                  <p className="text-zinc-600 dark:text-zinc-400">{doctorProfile?.specializations}</p>

                  <div className="flex justify-center gap-2 mt-3">
                    <div className="bg-zinc-100 dark:bg-zinc-700/50 px-2 py-1 rounded-full text-xs">
                      {doctorProfile?.years_of_experience} years exp.
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full text-xs text-green-800 dark:text-green-300">
                      Verified
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center">
                    <div className="w-6 text-zinc-400"><User className="h-4 w-4" /></div>
                    <span className="text-zinc-600 dark:text-zinc-400 flex-1">ID:</span>
                    <span className="font-medium">{doctorProfile?.registration_no}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 text-zinc-400"><Bell className="h-4 w-4" /></div>
                    <span className="text-zinc-600 dark:text-zinc-400 flex-1">Phone:</span>
                    <span className="font-medium">{doctorProfile?.phone}</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 text-zinc-400 mt-1"><FileText className="h-4 w-4" /></div>
                    <div className="flex-1">
                      <span className="text-zinc-600 dark:text-zinc-400 block">Address:</span>
                      <span className="font-medium">{doctorProfile?.address}</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-6" variant="outline" asChild>
                  <Link href="/doctor/profile">Edit Profile</Link>
                </Button>
              </Card>

              {/* Quick Actions */}
              <Card className="p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-md">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/doctor/appointments/schedule">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Appointment
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/doctor/patients">
                      <Users className="h-4 w-4 mr-2" />
                      View Patients
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/doctor/messages">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Messages
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/doctor/reports">
                      <BarChart4 className="h-4 w-4 mr-2" />
                      View Reports
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/doctor/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}