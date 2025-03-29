// @ts-nocheck

import {
    CopilotRuntime,
    GroqAdapter,
    copilotRuntimeNextJSAppRouterEndpoint,
} from '@copilotkit/runtime';
import { Action } from "@copilotkit/shared";
import { NextRequest } from 'next/server';
//import { createClient } from '@/lib/supabase/server';

const myactions: Action<any>[] = [];
myactions.push({
    name: "fetchMedDetailsforidmed",
    description: "Fetches medicine details for a given medicine ID.",
    parameters: [
        {
            name: "m_id",
            type: "string",
            description: "The ID of the user to fetch data for.",
            required: true,
        },
    ],
    handler: async ({ m_id }: { m_id: string }) => {
        console.log("AI Fetching medicine details for ID:", m_id);
        const Response = await fetch(
            `https://crm.frankrosspharmacy.com/api/v8/customer/cities/13/web/variants/${m_id}`
        );
        if (!Response.ok) {
            return;
        }
        const Data = await Response.json();
        return Data;
    },
});



const serviceAdapter = new GroqAdapter({ model: "llama-3.3-70b-versatile", disableParallelToolCalls: true });
const runtime = new CopilotRuntime({
    actions: myactions,
});

export const POST = async (req: NextRequest) => {

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
        runtime,
        serviceAdapter,
        endpoint: '/api/copilotkit',
    });

    return handleRequest(req);
};