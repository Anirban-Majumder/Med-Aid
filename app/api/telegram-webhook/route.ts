import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN!;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);


export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message } = body;
        if (!message || !message.chat)
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

        const chatId = message.chat.id;
        const text = message.text || "";
        const firstName = message.from.first_name || "User";

        // Extract the user ID from the /start command
        const match = text.match(/^\/start (.+)$/);
        const userId = match ? match[1] : null;

        if (!userId) {
            console.warn("No user ID provided in /start command.");
            return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
        }

        // Store or update the Telegram chat ID in Supabase
        const { error } = await supabase
            .from("profiles")
            .update({ telegram_id: chatId })
            .eq("user_id", userId);

        if (error) throw new Error(`Supabase Error: ${error.message}`);

        // Send confirmation message
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: `✅ Hi ${firstName}, your Telegram notifications are now enabled!`,
            }),
        });

        return NextResponse.json({ success: true, message: "Telegram ID linked successfully" });
    } catch (err) {
        console.error("Error handling Telegram webhook:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}