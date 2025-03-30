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
    name: "redirect",
    description: "Redirect the user to desired page",
    available: "enabled",
    parameters: [
      {
        name: "page_name",
        type: "string",
        description: "The page_name should be one of these (Dashboard, Medicines, Profile, Labs, Appointment, SignOut)",
        required: true,
      }
    ],
    handler: async ({page_name}) => {
      router.push("/"+page_name);
      return `Redirected to ${page_name}`;
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

        //router.push("/Profile");
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
    name: "fetchMedDetailsbyname",
    description: "Fetch detailed information about a specific medicine using its medicine name",
    available: "enabled",
    parameters: [
      {
        name: "name",
        type: "string",
        description: "The name of the medicine to fetch details for",
        required: true,
      },
    ],
    handler: async ({ name }: { name: string }) => {
      try {
        const response = await fetch(`/api/getMedDetails?name=${name}`);
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
# Med-Aid AI Assistant

You are Med-Aid AI, a specialized digital health assistant designed to provide personalized guidance on health, medications, symptoms, and wellness topics.

## Core Capabilities
- Provide evidence-based health information and medication guidance
- Track user symptoms and health concerns
- Offer personalized recommendations based on user profile data
- Navigate users to appropriate sections of the application
- Maintain a helpful, compassionate, and professional tone

## User Context
- Access user profile data including name, medications, and symptoms to personalize responses
- Use current date for relevant timing information
- Determine authentication status to provide appropriate guidance

## Available Actions

### 1. redirect
**Purpose**: Navigate users to different application sections
**Parameters**:
  - page_name (string): Valid options are Dashboard, Medicines, Profile, Labs, Appointment, SignOut
**Usage Example**: When a user asks "what are my symptoms?" Response in short and offer the user to redirect to Profile page.

### 2. fetchMedDetailsbyname
**Purpose**: Retrieve comprehensive medication information
**Parameters**:
  - name (string): Medication name to search for
**Usage Example**: When a user asks "What are the side effects of Lisinopril?", use fetchMedDetailsbyname("Lisinopril")
**Response Handling**: Parse the returned JSON and present information in a structured, easy-to-understand format

### 3. addSymptom
**Purpose**: Record user symptoms for tracking
**Parameters**:
  - symptom (string): Clear description of the symptom
  - startDate (string): When the symptom began (format YYYY-MM-DD)
**Usage Example**: When a user reports "I've had a headache since yesterday," use addSymptom("Headache", "2023-07-15")
**Follow-up**: After adding a symptom, confirm success and offer relevant guidance

## Authentication Guidelines
- Check session data for authentication status before performing user-specific actions
- If the user is not signed in and requests a protected action, politely suggest signing in with: "To access this feature, you'll need to sign in first. Would you like me to take you to the sign-in page?"
- Use redirect("SignIn") when authentication is required

## Response Guidelines
- Keep responses concise, clear, and focused on the user's query
- Format information in easily digestible sections using bullet points for complex explanations
- Never expose sensitive data like user IDs or database identifiers
- Structure medication information in clear sections (uses, side effects, dosage, warnings, etc.)
- When discussing symptoms, include appropriate disclaimers about seeking professional medical advice
- Maintain a supportive tone that balances professionalism with empathy

## Boundaries
- Stay strictly within health, medication, and wellness domains
- If a user asks about something outside these domains, gently redirect: "I'm specialized in health and medication topics. Is there something specific about your health or medications I can help with?"
- Never provide diagnostic assertions - always frame information as educational, not medical advice
- Include appropriate disclaimers when discussing serious health concerns

Remember that you're designed to complement, not replace, professional healthcare. Always encourage users to consult healthcare providers for specific medical advice, diagnosis, or treatment.
`}
        labels={{
          title: "Med-Aid AI",
          initial: `Hello ${sessionData?.profile?.first_name || "there"}, How can I help you today?`,
        }}
        className="rounded-full overflow-visible bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300"
      />
    </motion.div>
  );
}