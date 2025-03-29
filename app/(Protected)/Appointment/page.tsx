"use client";

import {Layout} from "@/components/layout";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Card, CardBody, CardFooter } from "@nextui-org/react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface Doctor {
  id: number;
  first_name: string;
  last_name:string;
  specializations: string;
  description: string;
  years_of_experience: number;
}

export default function DoctorsPage() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
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
    onOpen();
  };

  const DocSelected = (doctor: Doctor) => {
    setBookedDoctor(doctor);
    onOpen();
  };

  return (
    <Layout>
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
      isPressable 
      onPress={() => handleDoctorClick(doctor)}
      className="w-full min-h-32 p-4 bg-white dark:bg-gray-800 shadow-md rounded-2xl transition-all hover:shadow-lg"
    >
      <CardBody className="flex flex-col items-start gap-3">
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
      </CardBody>

      <CardFooter className="flex justify-between w-full">
        <Button 
          color="primary" 
          className="w-full text-md font-semibold py-2 rounded-lg hover:scale-105 transition-transform duration-200 ease-in-out"
          onPress={() => handleDoctorClick(doctor)}
        >
          Learn More
        </Button>
      </CardFooter>
    </Card>
  ))}
</div>

{/* Doctor Details Modal */}
<Modal 
  isOpen={isOpen} 
  onOpenChange={onOpenChange}
  hideCloseButton
  placement="center"  
  className="bg-white dark:bg-gray-900 rounded-lg shadow-lg backdrop-blur-sm"
>
  <ModalContent>
    {(onClose) => (
      <>
        <ModalHeader className="flex flex-col gap-1 text-xl font-bold">
          {selectedDoctor?.first_name} {selectedDoctor?.last_name}
        </ModalHeader>
        <ModalBody className="space-y-3 text-md">
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
        </ModalBody>
        <ModalFooter className="flex justify-between">
          <Button color="danger" variant="light" onPress={onClose}>
            Close
          </Button>
          <Button onClick={() => selectedDoctor && DocSelected(selectedDoctor)} color="primary" className="px-6 py-2 text-lg font-semibold rounded-lg">
            Book Now
          </Button>
        </ModalFooter>
      </>
    )}
  </ModalContent>
</Modal>
        </section>
    </Layout>
  );
}
