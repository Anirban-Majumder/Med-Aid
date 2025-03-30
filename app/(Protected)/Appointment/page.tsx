"use client";

import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { SessionContext } from "@/lib/supabase/usercontext";
import { Calendar } from "lucide-react";

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  specializations: string;
  description: string;
  years_of_experience: number;
  email: string;
  phone: string;
  is_available: boolean;
}

export default function DoctorsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookedDoctor, setBookedDoctor] = useState<Doctor | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const { sessionData } = useContext(SessionContext);

  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoading(true);
      try {
        // Only fetch doctors who are verified and available
        const { data, error } = await supabase
          .from("doc_profiles")
          .select("*")
          .eq('is_verified', true)
          .eq('is_available', true);

        if (error) {
          console.error("Error fetching doctors:", error);
          toast.error("Failed to load doctors");
          return;
        }

        setDoctors(data || []);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load doctors");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const handleDoctorClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsDialogOpen(true);
  };

  const DocSelected = async (doctor: Doctor) => {
    if (!sessionData?.session?.user?.id) {
      toast.error("Please sign in to book an appointment");
      return;
    }

    setIsBooking(true);
    try {
      // Create the appointment record
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          doctor_id: doctor.id,
          patient_name: `${sessionData.profile?.first_name || ''} ${sessionData.profile?.last_name || ''}`.trim(),
          patient_id: sessionData.session.user.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          appointment_date: new Date().toISOString(), // You might want to add date selection
          reason: 'New Appointment', // You might want to add reason input
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Appointment booking error:', error);
        throw error;
      }

      setBookedDoctor(doctor);
      setIsDialogOpen(false);
      toast.success(
        `Your appointment with Dr. ${doctor.first_name} ${doctor.last_name} is under review. The doctor will contact you regarding the timings soon.`,
        {
          duration: 4000,
          position: "bottom-right",
        }
      );
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error("Failed to book appointment. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <Layout>
      <Toaster />
      <section className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 flex-none p-4 md:p-6 space-y-4 border-b bg-white dark:bg-gray-900"
        >
          <h1 className="text-2xl md:text-3xl font-bold">
            <span className="bg-gradient-to-r from-cyan-500 to-blue-700 bg-clip-text text-transparent">
              Book an Appointment
            </span>
          </h1>
        </motion.div>

        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : doctors.length === 0 ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Card className="p-8 max-w-md w-full text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-semibold mb-2">No Doctors Available</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  We apologize, but there are no doctors available for appointments at the moment. Please check back later.
                </p>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {doctors.map((doctor) => (
                <Card
                  key={doctor.id}
                  onClick={() => handleDoctorClick(doctor)}
                  className="w-full min-h-32 p-4 bg-white dark:bg-gray-800 shadow-md rounded-2xl transition-all hover:shadow-lg cursor-pointer"
                >
                  <CardContent className="flex flex-col items-start gap-3 p-4">
                    {/* Doctor's Name */}
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Dr. {doctor.first_name} {doctor.last_name}</h2>

                    {/* Specializations */}
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(doctor.specializations)
                        ? doctor.specializations
                        : doctor.specializations?.split(",") || []
                      ).map((spec, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 rounded-full"
                        >
                          {spec.trim()}
                        </span>
                      ))}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      <strong>Certifications:</strong> {doctor.description}
                    </p>
                  </CardContent>

                  <CardFooter className="flex justify-between w-full p-4">
                    <Button
                      variant="default"
                      className="w-full text-md font-semibold py-2 rounded-lg hover:scale-105 transition-transform duration-200 ease-in-out"
                      onClick={() => handleDoctorClick(doctor)}
                    >
                      Learn More
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Doctor Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-white dark:bg-gray-900 rounded-lg shadow-lg backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="flex flex-col gap-1 text-xl font-bold">
                {selectedDoctor?.first_name} {selectedDoctor?.last_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-md px-2">
              <p><strong>Specialty:</strong>
                <span className="ml-2">
                  {(Array.isArray(selectedDoctor?.specializations)
                    ? selectedDoctor?.specializations
                    : selectedDoctor?.specializations?.split(",") || []
                  ).map((spec, index) => (
                    <span key={index} className="px-2 py-1 text-xs font-medium bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 rounded-full mx-1">
                      {spec.trim()}
                    </span>
                  ))}
                </span>
              </p>
              <p><strong>Certifications:</strong> {selectedDoctor?.description}</p>
              <p><strong>Experience:</strong> {selectedDoctor?.years_of_experience} years</p>
              <p><strong>Contact via:</strong>
                <a
                  href={`tel:${selectedDoctor?.phone}`}
                  className="mx-2 text-gray-200 hover:text-cyan-400 dark:text-gray-200 dark:hover:text-cyan-400"
                >
                  {selectedDoctor?.phone}
                </a>
                <a
                  href={`mailto:${selectedDoctor?.email}`}
                  className="mx-2 text-gray-200 hover:text-cyan-400 dark:text-gray-200 dark:hover:text-cyan-400"
                >
                  {selectedDoctor?.email}
                </a>
              </p>
            </div>
            <DialogFooter className="flex justify-between mt-4">
              <Button
                variant="outline"
                color="danger"
                onClick={() => setIsDialogOpen(false)}
                className="px-6 py-2 text-lg font-semibold rounded-lg"
                disabled={isBooking}
              >
                Close
              </Button>
              <Button
                onClick={() => selectedDoctor && DocSelected(selectedDoctor)}
                className="px-6 py-2 text-lg font-semibold rounded-lg"
                disabled={isBooking}
              >
                {isBooking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  'Book Now'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </Layout>
  );
}
