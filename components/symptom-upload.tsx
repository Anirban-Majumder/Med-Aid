"use client";

import { useState, useContext } from "react";
import { Icon } from "@iconify/react";
import { createClient } from "@/lib/supabase/client";
import { SessionContext } from "@/lib/supabase/usercontext";
import { Input } from "@/components/ui/input";
import { Profile, Symptom } from '@/lib/db_types';

export default function addSymptomModal() {
  const supabase = createClient();
  const { sessionData, setSessionData } = useContext(SessionContext);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState<Symptom>({
    name: "",
    startDate: "",
    endDate: null,
    isActive: true,
  });

  const handleSave = async () => {
    const user_id = sessionData.session?.user.id
    if (!user_id) {
      console.error("User session not found.");
      return;
    }

    const currentSymptoms = sessionData.profile?.symptoms ?? [];
    const newSymptoms = [input, ...currentSymptoms];

    const { data: updateData, error: updateError } = await supabase
      .from("profiles")
      .update({ symptoms: newSymptoms })
      .eq("user_id", user_id);

    if (updateError) {
      console.error("Error updating profile data:", updateError);
      return;
    }
    else {
      setIsOpen(false)
      setInput({ name: "", startDate: "", endDate: null, isActive: true })
      console.log("Symptoms added successfully");
      setSessionData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          symptoms: newSymptoms
        } as Profile, // Explicitly cast to Profile to satisfy TypeScript
      }));
    };
  }
  return (
    <>
      <div>
        {/* Button to Open Modal */}
        <button
          onClick={() => setIsOpen(true)}
          className="bg-cyan-500 text-white hover:bg-cyan-600 rounded-full p-4 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50 group"
        >
          <Icon icon="mdi:plus" className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Modal */}
        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-xl font-bold mb-4 text-zinc-600 dark:text-zinc-200">
                Enter Symptoms
              </h2>

              {/* Symptoms Input */}
              <div className="flex space-x-2">
                <Input
                  type="text"
                  value={input.name}
                  onChange={(e) =>
                    setInput((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter symptom"
                  className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 p-2 flex-grow rounded text-gray-800 dark:text-white focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <h2 className="text-xl font-bold mb-4 text-zinc-600 dark:text-zinc-200">
                Start Date:
              </h2>

              {/* Date Picker */}
              <Input
                type="date"
                value={input.startDate}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 p-2 mt-4 w-full rounded text-gray-800 dark:text-white focus:ring-2 focus:ring-cyan-500"
              />

              {/* Buttons */}
              <div className="mt-4 flex justify-between">
                <button
                  onClick={() => setIsOpen(false)}
                  className="bg-gray-400 dark:bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-cyan-600 dark:bg-cyan-700 text-white px-4 py-2 rounded hover:bg-cyan-700 dark:hover:bg-cyan-800"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
