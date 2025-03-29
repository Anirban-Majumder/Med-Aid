"use client";

import { useState, useRef, useContext, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { SessionContext } from "@/lib/supabase/usercontext";
import { Input } from "@/components/ui/input";
import OCRModal from "./medicine-input";
import { Profile, Medicine } from "@/lib/db_types";

export default function ImageUpload() {
  const supabase = createClient();
  const { sessionData, setSessionData } = useContext(SessionContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrImgUrl, setOcrImgUrl] = useState<string | null>(null);
  const [medicineName, setMedicineName] = useState("");
  const [input, setInput] = useState<Medicine>({
    name: "",
    description: "",
    eat_upto: "",
    m_id: "",
    times_to_eat: [],
  });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const skipFetchSuggestions = useRef(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  async function uploadToPrescriptionBucket(file: File): Promise<string | undefined> {
    const user_id = sessionData.session?.user.id;
    if (!user_id) {
      console.error("User session not found.");
      return;
    }
    const { data: existingFileData, error: existingFileError } = await supabase.storage
      .from("prescription")
      .list(`${user_id}`, { search: file.name });

    if (existingFileError) {
      console.error("Error checking existing files:", existingFileError);
      return;
    }

    if (existingFileData && existingFileData.length > 0) {
      console.log("File already exists in the storage bucket.");
      return `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/${existingFileData[0].id}`;
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("prescription")
      .upload(`${user_id}/${file.name}`, file);

    if (uploadError) {
      console.error("Error uploading file to storage:", uploadError);
      return;
    }
    const fullUrl = `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/${uploadData?.fullPath}`;

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("prescription_url")
      .eq("user_id", user_id)
      .single();

    if (profileError) {
      console.error("Error fetching profile data:", profileError);
      return;
    }

    const currentPrescriptions = profileData?.prescription_url ?? [];
    const newPrescriptions = [fullUrl, ...currentPrescriptions];

    const { data: updateData, error: updateError } = await supabase
      .from("profiles")
      .update({ prescription_url: newPrescriptions })
      .eq("user_id", user_id);

    if (updateError) {
      console.error("Error updating profile with new prescription:", updateError);
    } else {
      setSessionData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          prescription_url: newPrescriptions,
        } as Profile,
      }));
      console.log("File uploaded and profile updated successfully");
      setImage(null);
      setSelectedFile(null);
      setIsOpen(false);
      setIsManualOpen(false);
      return fullUrl;
    }
  }

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);

      const capturedImage = canvas.toDataURL("image/jpeg");
      setImage(capturedImage);
      const blob = await fetch(capturedImage).then((res) => res.blob());
      setSelectedFile(new File([blob], "captured-image.jpg", { type: "image/jpeg" }));

      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const fetchSuggestions = useCallback(async (search: string) => {
    if (!search) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/getMedinfo?name=${encodeURIComponent(search)}`);
      const data = await response.json();
      setSuggestions(data.hits);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (skipFetchSuggestions.current) {
      skipFetchSuggestions.current = false;
      return;
    }
    const debounceTimer = setTimeout(() => {
      fetchSuggestions(medicineName);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [medicineName, fetchSuggestions]);

  const handleDataSave = async () => {
    if (!medicineName || !input.m_id) return;
    const user_id = sessionData.session?.user.id;
    if (!user_id) {
      console.error("User session not found.");
      return;
    }
    const { data: updateData, error: updateError } = await supabase
      .from("medicines")
      .insert({
        user_id: user_id,
        name: medicineName,
        description: input.description,
        times_to_eat: input.times_to_eat,
        eat_upto: input.eat_upto,
        m_id: input.m_id,
      })
      .eq("user_id", user_id);

    if (updateError) {
      console.error("Error updating meds:", updateError);
    } else {
      console.log("Updated meds successfully:", updateData);
    }
    setIsManualOpen(false);
    setIsOpen(false);
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    const uploadedUrl = await uploadToPrescriptionBucket(selectedFile);
    if (uploadedUrl) {
      setOcrImgUrl(uploadedUrl);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-cyan-500 text-white hover:bg-cyan-600 rounded-full p-4 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50 group"
      >
        <Icon icon="mdi:plus" className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-xl transform transition-all duration-300 scale-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">Add Medicine</h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setImage(null);
                  setSelectedFile(null);
                }}
                className="text-gray-500 hover:text-cyan-600 transition-colors duration-300"
              >
                <Icon icon="mdi:close" className="w-6 h-6" />
              </button>
            </div>

            {!image ? (
              <div className="flex flex-col space-y-4">
                <button
                  onClick={handleCameraCapture}
                  className="bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-800 rounded-xl px-6 py-4 flex items-center justify-center space-x-3 transition-all duration-300 ease-in-out transform hover:scale-102 group"
                >
                  <Icon icon="mdi:camera" className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  <span className="font-medium">Capture with Camera</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-cyan-50 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-800/50 rounded-xl px-6 py-4 flex items-center justify-center space-x-3 transition-all duration-300 ease-in-out group"
                >
                  <Icon icon="mdi:file-upload" className="w-6 h-6 group-hover:translate-y-[-2px] transition-transform" />
                  <span className="font-medium">Upload Prescription</span>
                </button>

                <button
                  onClick={() => setIsManualOpen(true)}
                  className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 rounded-xl px-6 py-4 flex items-center justify-center space-x-3 transition-all duration-300 ease-in-out shadow-lg hover:shadow-cyan-300/30"
                >
                  <Icon icon="mdi:pencil" className="w-6 h-6" />
                  <span className="font-medium">Manual Entry</span>
                </button>

                <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
              </div>
            ) : (
              <div className="animate-fade-in space-y-6">
                <div className="relative w-full h-72 rounded-xl overflow-hidden shadow-lg mb-4 ring-2 ring-cyan-200 dark:ring-cyan-800">
                  <Image
                    src={image || "/placeholder.svg"}
                    alt="Uploaded"
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform hover:scale-105 duration-300"
                  />
                </div>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-cyan-500 text-white hover:bg-cyan-600 rounded-xl px-6 py-3 transition-all duration-300 ease-in-out transform hover:scale-102 shadow-lg hover:shadow-cyan-300/30 font-medium"
                  >
                    Save Prescription
                  </button>
                  <button
                    onClick={() => {
                      setImage(null);
                      setSelectedFile(null);
                    }}
                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl px-6 py-3 transition-all duration-300 ease-in-out font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isManualOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">Medicine Details</h2>
              <button
                onClick={() => setIsManualOpen(false)}
                className="text-gray-500 hover:text-cyan-600 transition-colors duration-300"
              >
                <Icon icon="mdi:close" className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col space-y-5">
              <div className="relative flex-1" ref={searchRef}>
                <Input
                  type="text"
                  placeholder="Search Medicine Name"
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="border-2 border-cyan-200 dark:border-cyan-800 focus:border-cyan-500 rounded-xl px-4 py-3 bg-white dark:bg-zinc-800"
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-800 border-2 border-cyan-200 dark:border-cyan-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion) => (
                        <div
                          key={suggestion.name}
                          className="px-4 py-3 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 cursor-pointer transition-colors"
                          onClick={() => {
                            skipFetchSuggestions.current = true;
                            setMedicineName(suggestion.name);
                            setShowSuggestions(false);
                            setInput((prev) => ({
                              ...prev,
                              name: suggestion.name,
                              m_id: suggestion.id,
                            }));
                          }}
                        >
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{suggestion.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Input
                type="text"
                placeholder="Times to eat (e.g. Morning, Afternoon, Night)"
                value={input.times_to_eat.join(", ")}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    times_to_eat: e.target.value.split(",").map((t) => t.trim()),
                  }))
                }
                className="border-2 border-cyan-200 dark:border-cyan-800 focus:border-cyan-500 rounded-xl px-4 py-3"
              />

              <Input
                type="date"
                value={input.eat_upto}
                onChange={(e) => setInput((prev) => ({ ...prev, eat_upto: e.target.value }))}
                className="border-2 border-cyan-200 dark:border-cyan-800 focus:border-cyan-500 rounded-xl px-4 py-3"
              />

              <Input
                type="text"
                placeholder="Instructions (How to take)"
                value={input.description}
                onChange={(e) => setInput((prev) => ({ ...prev, description: e.target.value }))}
                className="border-2 border-cyan-200 dark:border-cyan-800 focus:border-cyan-500 rounded-xl px-4 py-3"
              />

              <button
                onClick={handleDataSave}
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 rounded-xl px-6 py-3.5 transition-all duration-300 ease-in-out shadow-lg hover:shadow-cyan-300/30 font-medium mt-4"
              >
                Save Medicine
              </button>
            </div>
          </div>
        </div>
      )}

      {ocrImgUrl && <OCRModal imgUrl={ocrImgUrl} />}
    </>
  );
}