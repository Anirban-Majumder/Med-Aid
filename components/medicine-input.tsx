"use client";

import { useState, useEffect, KeyboardEvent, ChangeEvent, useContext } from "react";
import { createClient } from "@/lib/supabase/client";
import { SessionContext } from "@/lib/supabase/usercontext";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react"; // Import for delete icon
import { Medicine, Profile } from "@/lib/db_types";

interface OCRItem {
  symptom: string; // Comma separated symptoms
  meds: Medicine[]; // Array of medicine objects
}

interface MedicineModalProps {
  imgFile?: File; // Change from imgUrl to imgFile
}

const calculateEndDate = (duration: string): string => {
  if (!duration.match(/^\d+d$/)) return duration; // Return as-is if not in "Xd" format
  
  const days = parseInt(duration);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  return endDate.toISOString().split('T')[0];
};

export default function OCRModal({ imgFile }: MedicineModalProps) {
  const supabase = createClient();
  const { sessionData, setSessionData } = useContext(SessionContext);

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [symptomInput, setSymptomInput] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // When an image URL is provided, process it with the OCR endpoint
  useEffect(() => {
    console.log("Image file changed:", imgFile);
    async function fetchOCR() {
      try {
        if (!imgFile) {
          setLoading(false);
          return;
        }
        
        // Create FormData and append the file
        const formData = new FormData();
        formData.append("file", imgFile);
        
        const response = await fetch("/api/doOCR", {
          method: "POST",
          body: formData, // Send the file as FormData
        });

        if (response.ok) {
          const data = await response.json();
          
          // Process the symptoms and medicines from the response
          const symptomsSet = new Set<string>();
          const medicinesList: Medicine[] = [];

          if (data.symptoms) {
            data.symptoms.forEach((symptom: any) => {
              if (symptom.name) {
                symptomsSet.add(symptom.name.trim());
              }
            });
          }

          if (data.meds && Array.isArray(data.meds)) {
            data.meds.forEach((med: any) => {
              medicinesList.push({
                name: med.name || "",
                description: med.description || "",
                eat_upto: med.eat_for || new Date().toISOString().split('T')[0],
                m_id: Date.now().toString(),
                times_to_eat: Array.isArray(med.times_to_eat) ? med.times_to_eat : ["0800"],
                side_effect: Array.isArray(med.side_effect) ? med.side_effect : [],
                uses: med.uses || "",
              });
            });
          }

          setSymptoms(Array.from(symptomsSet));

          // If no medicines were found, provide a default template
          if (medicinesList.length === 0) {
            setMedicines([{
              name: "",
              description: "",
              eat_upto: new Date().toISOString().split('T')[0],
              times_to_eat: ["0800"],
              side_effect: [],
              uses: "",
            }]);
          } else {
            setMedicines(medicinesList);
          }

          setLoading(false);
          setIsOpen(true);
        } else {
          console.error("OCR endpoint returned an error.");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching OCR:", error);
        setLoading(false);
      }
    }
    
    if (imgFile) {
      fetchOCR();
    }
  }, [imgFile]);

  const handleMedicineChange = (index: number, field: string, value: string) => {
    const updatedMedicines = [...medicines];
    if (field === "eat_upto" && value.match(/^\d+d$/)) {
      // Convert "Xd" format to actual date
      value = calculateEndDate(value);
    }
    updatedMedicines[index] = { ...updatedMedicines[index], [field]: value };
    setMedicines(updatedMedicines);
  };

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: "", eat_upto: "", times_to_eat: [], description: "", side_effect: [], uses: "" }]);  
  };

  const handleAddSymptom = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && symptomInput.trim() !== "") {
      setSymptoms([...symptoms, symptomInput.trim()]);
      setSymptomInput(""); // Clear input field
      e.preventDefault();
    }
  };

  const handleAddTimeSlot = (index: number) => {
    const updatedMedicines = [...medicines];
    updatedMedicines[index] = {
      ...updatedMedicines[index],
      times_to_eat: [...(updatedMedicines[index].times_to_eat || []), ""],
    };
    setMedicines(updatedMedicines);
  };

  const handleTimeChange = (medicineIndex: number, timeIndex: number, value: string) => {
    const updatedMedicines = [...medicines];
    const timesList = [...updatedMedicines[medicineIndex].times_to_eat];
    timesList[timeIndex] = value.replace(":", ""); // Convert HH:mm to HHMM format
    updatedMedicines[medicineIndex] = {
      ...updatedMedicines[medicineIndex],
      times_to_eat: timesList,
    };
    setMedicines(updatedMedicines);
  };

  const handleRemoveTimeSlot = (medicineIndex: number, timeIndex: number) => {
    const updatedMedicines = [...medicines];
    const timesList = [...updatedMedicines[medicineIndex].times_to_eat];
    timesList.splice(timeIndex, 1);
    updatedMedicines[medicineIndex] = {
      ...updatedMedicines[medicineIndex],
      times_to_eat: timesList,
    };
    setMedicines(updatedMedicines);
  };

  const handleFinalSave = async (): Promise<void> => {
    setIsSaving(true);
    const user_id = sessionData.session?.user.id;
    if (!user_id) {
      console.error("User session not found.");
      return;
    }
    const currentSymptoms = sessionData.profile?.symptoms ?? [];
    const newSymptoms = [symptoms, ...currentSymptoms];

    const { data: updateData, error: updateError } = await supabase
      .from("profiles")
      .update({ symptoms: newSymptoms })
      .eq("user_id", user_id);

    if (updateError) {
      console.error("Error updating profile data:", updateError);
      return;
    } else {
      setSessionData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          symptoms: newSymptoms,
        } as Profile, // Explicitly cast to Profile to satisfy TypeScript
      }));
      console.log("Symptoms added successfully");
    }

    // Insert each medicine record into the 'medicine' table.
    for (const med of medicines) {
      const { error } = await supabase.from("medicine").insert({
        user_id: user_id,
        name: med.name,
        description: med.description,
        eat_upto: med.eat_upto,
        m_id: med.m_id,
        times_to_eat: med.times_to_eat,
      });

      if (error) {
        console.error("Error inserting medicine:", error);
        return;
      } else {
        setSessionData((prev) => ({
          ...prev,
          medicines: [...prev.medicines, med],
        }));
        console.log("Medicine inserted:", med);
      }
      setIsSaving(false);
    }

    setShowWarning(false);
    setIsOpen(false); // Close the modal before proceeding
    setIsSaving(false);
    window.location.reload();
  };

  const handleRemoveSymptom = (index: number): void => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  // This save now triggers a warning/confirmation modal.
  const handleSave = (): void => {
    setShowWarning(true);
  };

  const handleManualMedicine = () => {
    setMedicines([{
      name: "",
      description: "",
      eat_upto: new Date().toISOString().split('T')[0],
      times_to_eat: ["0800"],
      m_id: Date.now().toString(),
      side_effect:[],
      uses: "",
    }]);
    setIsOpen(true);
  };

  return (
    <>
      {/* OCR and Form Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Edit Details</DialogTitle>

          <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Confirm your symptoms:</h4>
          <div className="mt-2">
            <Input
              placeholder="Type a symptom and press Enter"
              value={symptomInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSymptomInput(e.target.value)}
              onKeyDown={handleAddSymptom}
            />
            <div className="flex flex-wrap gap-1">
              {symptoms.map((symptom, index) => (
                <span
                  key={index}
                  className="-mt-12 px-2 py-1 bg-cyan-500 text-white rounded-full flex items-center space-x-2"
                >
                  <span>{symptom}</span>
                  <button onClick={() => handleRemoveSymptom(index)} className="ml-2">
                    <X className="h-4 w-4 text-white hover:text-gray-200" />
                  </button>
                </span>
              ))}
            </div>

            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Confirm your medicine details:
            </h4>
            {medicines.map((medicine, index) => (
              <div key={index} className="flex flex-wrap gap-2 mb-4">
                <Input
                  placeholder="Medicine Name"
                  value={medicine.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleMedicineChange(index, "name", e.target.value)
                  }
                  className="flex-1"
                />
                <Input
                  placeholder="Description"
                  value={medicine.description}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleMedicineChange(index, "description", e.target.value)
                  }
                  className="w-full"
                />

                <div className="flex flex-col gap-2 w-full">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Times to take medicine (24-hour format):
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTimeSlot(index)}
                      className="h-8 px-2"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Add Time
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {medicine.times_to_eat.map((time, timeIndex) => (
                      <div key={timeIndex} className="flex items-center">
                        <Input
                          type="time"
                          value={time ? `${time.slice(0, 2)}:${time.slice(2, 4)}` : ""}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleTimeChange(index, timeIndex, e.target.value)
                          }
                          className="w-32"
                        />
                        <button
                          onClick={() => handleRemoveTimeSlot(index, timeIndex)}
                          className="ml-1 text-gray-500 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {medicine.times_to_eat.length === 0 && (
                      <span className="text-sm text-gray-500 italic">No times added yet</span>
                    )}
                  </div>
                </div>

                <Input
                  placeholder="Duration (e.g. 5d)"
                  type="text"
                  value={medicine.eat_upto}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleMedicineChange(index, "eat_upto", e.target.value)
                  }
                  className="w-full"
                />
              </div>
            ))}

            <Button variant="outline" className="w-full rounded-lg" onClick={handleAddMedicine}>
              + Add Another Medicine
            </Button>
          </div>

          <Button
            onClick={handleSave}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition mt-6"
          >
            Save
          </Button>
        </DialogContent>

        {showWarning && (
          <Dialog open={showWarning} onOpenChange={setShowWarning}>
            <DialogContent className="max-w-md p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Confirm Your Changes
              </DialogTitle>
              <p className="mb-4">
                Please be very sure before you proceed. OCR processing may introduce inaccuracies.
                Kindly double-check your inputs.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowWarning(false)}>
                  Cancel
                </Button>
                <Button onClick={handleFinalSave}>Confirm</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </Dialog>

      {/* Manual Entry Button */}
      <Button
        onClick={handleManualMedicine}
        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg shadow hover:shadow-lg transition-all"
      >
        Add Medicine Manually
      </Button>

      {/* Loading Popup Modal */}
      {loading && (
        <Dialog open={true} onOpenChange={() => { }}>
          <DialogContent className="max-w-md p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
            <DialogTitle className="sr-only">Loading</DialogTitle>
            <div className="flex flex-col items-center">
              <svg
                className="animate-spin h-10 w-10 text-gray-900 dark:text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              <span className="mt-4 text-gray-900 dark:text-white">Loading...</span>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Saving Popup Modal */}
      {isSaving && (
        <Dialog open={isSaving} onOpenChange={() => { }}>
          <DialogContent className="max-w-md p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg flex flex-col items-center">
            <DialogTitle className="sr-only">Saving</DialogTitle>
            <svg
              className="animate-spin h-10 w-10 text-gray-900 dark:text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
            <span className="mt-4 text-gray-900 dark:text-white">Saving...</span>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
