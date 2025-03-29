"use client";

import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "sonner"; // Add this import
import { Phone } from "lucide-react";

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  specializations: string;
  description: string;
  years_of_experience: number;
  email: string;
  phone: string;
}

export default function DoctorsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookedDoctor, setBookedDoctor] = useState<Doctor | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data, error } = await supabase.from("doc_profiles").select("*");
      if (error) {
        console.error("Error fetching doctors:", error);
      } else {
        setDoctors(data || []);
      }
    };
    fetchDoctors();
  }, []);

  const handleDoctorClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsDialogOpen(true);
  };

  const DocSelected = (doctor: Doctor) => {
    setBookedDoctor(doctor);
    setIsDialogOpen(false);
    toast.success(
        `Your appointment with Dr. ${doctor.first_name} ${doctor.last_name} is under review. The doctor will contact you regarding the timings soon.`,
        {
          duration: 4000,
          position: "bottom-right",
        }
      );
  };

  return (
    <Layout>
        <Toaster/>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8 p-4 w-[95%] max-w-7xl">
          {doctors.map((doctor) => (
            <Card
              key={doctor.id}
              onClick={() => handleDoctorClick(doctor)}
              className="w-full min-h-32 p-4 bg-white dark:bg-gray-800 shadow-md rounded-2xl transition-all hover:shadow-lg cursor-pointer"
            >
              <CardContent className="flex flex-col items-start gap-3 p-4">
                {/* Doctor's Name */}
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{doctor.first_name} {doctor.last_name}</h2>

                {/* Specializations */}
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(selectedDoctor?.specializations)
                    ? selectedDoctor?.specializations
                    : selectedDoctor?.specializations?.split(",") || []
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
              <Button variant="outline" color="danger" onClick={() => setIsDialogOpen(false)}
                    className="px-6 py-2 text-lg font-semibold rounded-lg">
                Close
              </Button>
              <Button
                onClick={() => selectedDoctor && DocSelected(selectedDoctor)}
                className="px-6 py-2 text-lg font-semibold rounded-lg"
              >
                Book Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </Layout>
  );
}
