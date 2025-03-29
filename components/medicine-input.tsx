"use client";

import { useState, useEffect, KeyboardEvent, ChangeEvent, useContext } from "react";
import { createClient } from "@/lib/supabase/client";
import { SessionContext } from "@/lib/supabase/usercontext";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Clock, Calendar, PenLine, Pill, FileText, Upload, Check, AlertCircle } from "lucide-react";
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
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function OCRModal({ imgFile }: MedicineModalProps) {
  const supabase = createClient();
  const { sessionData, setSessionData } = useContext(SessionContext);

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false); // Changed initial state to false
  const [symptomInput, setSymptomInput] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // When an image URL is provided, process it with the OCR endpoint
  useEffect(() => {
    async function fetchOCR() {
      if (!imgFile) return;

      setLoading(true); // Set loading only when we have a file and are about to process

      try {
        const formData = new FormData();
        formData.append("file", imgFile);

        const response = await fetch("/api/doOCR", {
          method: "POST",
          body: formData,
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
              //fix mid
              medicinesList.push({
                name: med.name || "",
                description: med.description || "",
                eat_upto: med.eat_for !== "null" ? calculateEndDate(med.eat_for + "d") : new Date().toISOString().split('T')[0],
                m_id: generateUUID(),
                times_to_eat: Array.isArray(med.times_to_eat) ? med.times_to_eat : ["0800"],
                side_effect: Array.isArray(med.side_effect) ? med.side_effect : [],
                uses: med.uses || "",
              });
            });
          }

          setSymptoms(Array.from(symptomsSet));
          setMedicines(medicinesList);

          setIsOpen(true);
        } else {
          console.error("OCR endpoint returned an error.");
        }
      } catch (error) {
        console.error("Error fetching OCR:", error);
      } finally {
        setLoading(false); // Always set loading to false after processing
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

    // Save symptoms with their start dates
    const formattedSymptoms = symptoms.map(symptom => ({
      name: symptom,
      startDate: new Date().toISOString().split('T')[0]
    }));

    const currentSymptoms = sessionData.profile?.symptoms ?? [];
    const newSymptoms = [...formattedSymptoms, ...currentSymptoms];

    const { data: updateData, error: updateError } = await supabase
      .from("profiles")
      .update({ symptoms: newSymptoms })
      .eq("user_id", user_id);

    if (updateError) {
      console.error("Error updating profile data:", updateError);
      setIsSaving(false);
      return;
    }

    setSessionData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        symptoms: newSymptoms,
      } as Profile,
    }));

    // Insert each medicine record into the 'medicine' table
    for (const med of medicines) {
      const { error } = await supabase.from("medicines").insert({
        user_id: user_id,
        name: med.name,
        description: med.description,
        eat_upto: med.eat_upto,
        m_id: med.m_id,
        times_to_eat: med.times_to_eat,
        side_effect: med.side_effect || [], // Changed from side_effects to side_effect
        uses: med.uses || "",
      });

      if (error) {
        console.error("Error inserting medicine:", error);
        return;
      }

      setSessionData((prev) => ({
        ...prev,
        medicines: [...prev.medicines, med],
      }));
    }

    setShowWarning(false);
    setIsOpen(false);
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
      side_effect: [],
      uses: "",
    }]);
    setIsOpen(true);
  };

  return (
    <>
      {/* Only show loading dialog when processing OCR */}
      {loading && (
        <Dialog open={true} onOpenChange={() => { }}>
          <DialogContent className="max-w-md p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
            <DialogTitle className="sr-only">Loading</DialogTitle>
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 relative">
                <div className="absolute inset-0">
                  <div className="animate-spin h-16 w-16 rounded-full border-4 border-cyan-100 border-t-cyan-500"></div>
                </div>
                <Pill className="h-8 w-8 text-cyan-500 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <span className="mt-4 text-lg text-gray-700 dark:text-gray-300">Processing Prescription...</span>
              <p className="text-sm text-gray-500 text-center mt-2">This might take a moment</p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Main Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0 bg-white dark:bg-gray-900 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Header with decorative gradient */}
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 rounded-t-xl">
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Medicine Details
            </DialogTitle>
            <p className="text-blue-100 mt-2 text-sm">
              Review and confirm your medication information below
            </p>
          </div>

          <div className="p-6">
            {/* Symptoms Section */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <PenLine className="h-5 w-5 text-cyan-500" />
                Symptoms
              </h4>
              <div className="mb-2">
                <Input
                  placeholder="Type a symptom and press Enter"
                  value={symptomInput}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSymptomInput(e.target.value)}
                  onKeyDown={handleAddSymptom}
                  className="focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {symptoms.map((symptom, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full flex items-center gap-2 shadow-sm transition-all hover:shadow-md group"
                  >
                    <span>{symptom}</span>
                    <button
                      onClick={() => handleRemoveSymptom(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600/50 rounded-full p-1"
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                  </span>
                ))}
                {symptoms.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">No symptoms added yet</p>
                )}
              </div>
            </div>

            {/* Medicines Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Pill className="h-5 w-5 text-cyan-500" />
                Medications
              </h4>

              <div className="space-y-6">
                {medicines.map((medicine, index) => (
                  <Card
                    key={index}
                    className="shadow-md hover:shadow-lg transition-all border-0 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-gray-800/50 dark:to-gray-800 overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-600"></div>
                    <CardContent className="p-6">
                      {/* Medicine Name and Duration Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Pill className="h-4 w-4 text-cyan-500" />
                            Medicine Name
                          </label>
                          <Input
                            placeholder="Enter medicine name"
                            value={medicine.name}
                            onChange={(e) => handleMedicineChange(index, "name", e.target.value)}
                            className="border-gray-200 bg-white dark:bg-gray-900 focus:border-cyan-500 focus:ring-cyan-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-cyan-500" />
                            Duration
                          </label>
                          <div className="relative">
                            <Input
                              placeholder="Duration (e.g. 5d)"
                              type="text"
                              value={medicine.eat_upto}
                              onChange={(e) => handleMedicineChange(index, "eat_upto", e.target.value)}
                              className="pl-9 border-gray-200 bg-white dark:bg-gray-900 focus:border-cyan-500 focus:ring-cyan-500"
                            />
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {/* Description and Uses Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-cyan-500" />
                            Description
                          </label>
                          <Input
                            placeholder="Enter medicine description"
                            value={medicine.description}
                            onChange={(e) => handleMedicineChange(index, "description", e.target.value)}
                            className="border-gray-200 bg-white dark:bg-gray-900 focus:border-cyan-500 focus:ring-cyan-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-cyan-500" />
                            Uses
                          </label>
                          <Input
                            placeholder="Uses (e.g. Hypertension/Angina)"
                            value={medicine.uses}
                            onChange={(e) => handleMedicineChange(index, "uses", e.target.value)}
                            className="border-gray-200 bg-white dark:bg-gray-900 focus:border-cyan-500 focus:ring-cyan-500"
                          />
                        </div>
                      </div>

                      {/* Side Effects Section */}
                      <div className="space-y-2 mb-6">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-cyan-500" />
                          Side Effects
                        </label>
                        <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                          {medicine.side_effect?.map((effect, effectIndex) => (
                            <span
                              key={effectIndex}
                              className="px-2 py-1 bg-red-50 text-red-400 dark:bg-red-900/30 dark:text-red-300 rounded-full text-sm border border-red-100 dark:border-red-800"
                            >
                              {effect}
                            </span>
                          ))}
                          {(!medicine.side_effect || medicine.side_effect.length === 0) && (
                            <span className="text-sm text-gray-500 italic">No side effects listed</span>
                          )}
                        </div>
                      </div>

                      {/* Dosage Times Section */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-cyan-500" />
                            Dosage Times
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddTimeSlot(index)}
                            className="h-8 px-3 text-xs border-cyan-500 text-cyan-600 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-gray-800 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Time
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                          {medicine.times_to_eat.map((time, timeIndex) => (
                            <div
                              key={timeIndex}
                              className="group relative flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                            >
                              <Clock className="absolute left-2 text-cyan-500 h-4 w-4" />
                              <Input
                                type="time"
                                value={time ? `${time.slice(0, 2)}:${time.slice(2, 4)}` : ""}
                                onChange={(e) => handleTimeChange(index, timeIndex, e.target.value)}
                                className="pl-8 pr-8 border-0 focus:ring-0 bg-transparent"
                              />
                              <button
                                onClick={() => handleRemoveTimeSlot(index, timeIndex)}
                                className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                              >
                                <X className="h-3.5 w-3.5 text-gray-500 hover:text-red-500" />
                              </button>
                            </div>
                          ))}
                          {medicine.times_to_eat.length === 0 && (
                            <span className="text-sm text-gray-500 italic col-span-full">No times added yet</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full mt-6 border-dashed border-2 border-cyan-400 text-cyan-600 hover:bg-cyan-50 dark:border-cyan-700 dark:text-cyan-400 dark:hover:bg-gray-800/50 py-6 rounded-lg group transition-all duration-200"
                onClick={handleAddMedicine}
              >
                <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                Add Another Medication
              </Button>
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 bg-gray-50 dark:bg-gray-800/50">
            <Button
              onClick={handleSave}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Check className="h-5 w-5" />
              Save Medication Details
            </Button>
          </DialogFooter>
        </DialogContent>

        {showWarning && (
          <Dialog open={showWarning} onOpenChange={setShowWarning}>
            <DialogContent className="max-w-md p-0 bg-white dark:bg-gray-900 rounded-lg shadow-xl">
              <div className="bg-amber-50 dark:bg-amber-900/30 p-5 rounded-t-lg border-b border-amber-100 dark:border-amber-900/50">
                <DialogTitle className="text-xl font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Confirm Your Changes
                </DialogTitle>
              </div>

              <div className="p-6">
                <p className="mb-6 text-gray-700 dark:text-gray-300">
                  Please be very sure before you proceed. OCR processing may introduce inaccuracies.
                  Kindly double-check your inputs before confirming.
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowWarning(false)} className="px-4">
                    Go Back
                  </Button>
                  <Button
                    onClick={handleFinalSave}
                    className="px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Confirm
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </Dialog>

      {/* Manual Entry Button */}
      <Button
        onClick={handleManualMedicine}
        className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg shadow hover:shadow-lg transition-all flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        Add Medicine Manually
      </Button>

      {/* Saving Popup Modal */}
      {isSaving && (
        <Dialog open={isSaving} onOpenChange={() => { }}>
          <DialogContent className="max-w-md p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg flex flex-col items-center">
            <DialogTitle className="sr-only">Saving</DialogTitle>
            <div className="h-16 w-16 relative">
              <div className="animate-spin h-16 w-16 rounded-full border-4 border-cyan-100 border-t-cyan-500"></div>
              <Check className="h-8 w-8 text-cyan-500 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <span className="mt-4 text-lg text-gray-700 dark:text-gray-300">Saving your information...</span>
            <p className="text-sm text-gray-500 text-center mt-2">Please wait while we update your records</p>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
