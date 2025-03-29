'use client';
import React from "react";
import { useRouter } from "next/navigation";
import {
  useCopilotReadable,
  useCopilotAction,
} from "@copilotkit/react-core";
import { CopilotPopup } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { createClient } from "@/lib/supabase/client";
import { Profile } from '@/lib/db_types';
import { motion, AnimatePresence } from "framer-motion";

interface CopilotManagerProps {
  sessionData: {
    session?: any;
    profile?: any;
    medicines?: any;
  };
  setSessionData: (data: any) => void;
}

export function CopilotManager({ sessionData, setSessionData }: CopilotManagerProps) {
  const router = useRouter();
  const supabase = createClient();
  const { session, profile, medicines } = sessionData || {};

  useCopilotReadable({
    description: "Current date for reference.",
    value: new Date().toDateString(),
  });

  useCopilotReadable({
    description: "User session, medicines, and profile details for personalization.",
    value: {
      isSignedIn: !!session,
      medicines,
      profile,
    },
  });

  useCopilotAction({
    name: "redirectToSignIn",
    description: "Redirect the user to the sign in page",
    available: "enabled",
    parameters: [],
    handler: async () => {
      router.push("/SignIn");
    },
  });

  useCopilotAction({
    name: "addSymptom",
    description: "Adds a symptom for a the current user.",
    available: "enabled",
    parameters: [
      {
        name: "symptom",
        type: "string",
        description: "The symptom description.",
        required: true,
      },
      {
        name: "startDate",
        type: "string",
        description: "The start date of the symptom(in YYYY-MM-DD).",
        required: true,
      },
    ],
    handler: async ({ symptom, startDate }: { symptom: string, startDate: string }) => {
      const user_id = sessionData?.profile?.user_id;
      console.log("Adding symptom:", symptom, "for patient:", user_id, "with start date:", startDate);
      if (!user_id) {
        console.error("User session not found.");
        return "The user is not signed in";
      }
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("symptoms")
        .eq("user_id", user_id)
        .single();

      if (profileError) {
        console.log("Error fetching profile data:", profileError);
        return "Error fetching profile data";
      }

      const currentSymptoms = profileData?.symptoms ?? [];
      const newSymptoms = [
        {
          name: symptom,
          startDate: startDate,
          endDate: null,
          isActive: true,
        },
        ...currentSymptoms,
      ];

      const { data: updateData, error: updateError } = await supabase
        .from("profiles")
        .update({ symptoms: newSymptoms })
        .eq("user_id", user_id);

      if (updateError) {
        console.log("Error updating profile data:", updateError);
        return "Error updating profile data";
      } else {
        console.log("Symptoms added successfully");

        router.push("/Profile");
        setSessionData((prev: { profile: Profile }) => ({
          ...prev,
          profile: {
            ...prev.profile,
            symptoms: newSymptoms,
          } as Profile, // Explicitly cast to Profile to satisfy TypeScript
        }));
        return "The Symptom added successfully.";
      }
    },
  });

  useCopilotAction({
    name: "fetchMedDetailsforidmed",
    description: "Fetch detailed information about a specific medicine using its medicine ID",
    available: "enabled",
    parameters: [
      {
        name: "m_id",
        type: "string",
        description: "The ID of the medicine to fetch details for",
        required: true,
      },
    ],
    handler: async ({ m_id }: { m_id: string }) => {
      try {
        const response = await fetch(`/api/getMedDetailsbyId?id=${m_id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch medicine details');
        }
        const data = await response.json();
        return JSON.stringify(data);
      } catch (error) {
        console.error("Error fetching medicine details:", error);
        return "Sorry, I couldn't fetch the medicine details at this time.";
      }
    },
  });

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <CopilotPopup
        instructions={`
You are Pharma Assist AI, a specialized digital assistant designed exclusively to help users with questions and guidance related to health, wellbeing, medication, prescriptions, and related topics.
Key Responsibilities:
- Answer queries about health, wellness, medications, and prescriptions with accurate, personalized, and helpful information.
- Use the provided session data to personalize responses:
   - "User's unique identifier" for integrating with specific tools.
   - "User profile details" for tailoring experiences and suggestions.
   - "User medication information" for providing detailed and relevant medication guidance.
Available Actions:
1. redirectToSignIn:
   - Description: Redirect the user to the sign in page when authentication is required.
2. fetchMedDetailsforidmed:
   - Description: Fetch detailed information about a specific medicine using its medicine ID.
   - Parameters: 
        - m_id (string): The ID of the medicine.
   - Usage: Use this action to retrieve up-to-date medicine details to support user queries.
3. addSymptom:
   - Description: Add a symptom for the current user to support their health tracking and personalized guidance.
   - Parameters:
        - symptom (string): A description of the symptom.
Guidelines:
- if the user is not signed in use redirecttosigntool
- Provide clear, concise, accurate, and helpful responses based on the available session data.
- Do not expose to user and of the internal fields like id , user_id, etc.
- If a query is not related to health, wellbeing, medication, prescriptions, or other health-related matters, politely inform the user that your expertise is focused solely on these areas.
- When appropriate, use the available actions to fetch additional information or to record user symptoms.
- Always maintain user confidentiality and adhere to data protection standards.
- If a user query falls outside your scope, gently guide them to ask about health, medication, or wellness topics.
Your sole purpose is to assist users with health-related inquiries using the tools and data provided. Stay within these boundaries and deliver responses that are both supportive and informative.
`}
        labels={{
          title: "Pharma Assist AI",
          initial: `Hello ${sessionData?.profile?.first_name || "there"}, How can I help you today?`,
        }}
        className="rounded-full overflow-visible bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300"
      />
    </motion.div>
  );
}