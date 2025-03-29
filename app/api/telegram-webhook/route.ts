import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN!;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: Request) {
    try {
        // Parse request body with specific error handling
        let body;
        try {
            body = await request.json();
        } catch (parseError) {
            console.error("Failed to parse request body:", parseError);
            return NextResponse.json({
                error: 'Invalid JSON in request body',
                details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
            }, { status: 400 });
        }

        // Destructure both possible update types
        const { message, my_chat_member } = body;

        // Handle non-message updates separately
        if (!message && my_chat_member) {
            console.log("Received my_chat_member update:", my_chat_member);
            // You can add additional logic here if needed.
            return NextResponse.json({ success: true, message: "my_chat_member update received" });
        }

        // Validate webhook data for message updates
        if (!message) {
            console.error("Missing message field in webhook data:", body);
            return NextResponse.json({ error: 'Invalid webhook: missing message field' }, { status: 400 });
        }

        if (!message.chat) {
            console.error("Missing chat field in message:", message);
            return NextResponse.json({ error: 'Invalid webhook: missing chat field' }, { status: 400 });
        }

        const chatId = message.chat.id;
        if (!chatId) {
            console.error("Missing chat ID in message.chat:", message.chat);
            return NextResponse.json({ error: 'Invalid webhook: missing chat ID' }, { status: 400 });
        }

        const text = message.text || "";
        const firstName = message.from?.first_name || "User";

        console.log(`Received message: "${text}" from ${firstName} (chat ID: ${chatId})`);

        // Extract the user ID from the /start command
        const match = text.match(/^\/start (.+)$/);
        const userId = match ? match[1] : null;

        if (!userId) {
            console.warn(`No user ID provided in command: "${text}" from chat ID ${chatId}`);

            // Send helpful message to user
            try {
                await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: `⚠️ Please use the link provided in the Med-Aid application to connect your Telegram account.`,
                    }),
                });
            } catch (telegramError) {
                console.error("Failed to send Telegram error message:", telegramError);
            }

            return NextResponse.json({ error: "Missing user ID in start command" }, { status: 400 });
        }

        console.log(`Attempting to link Telegram chat ID ${chatId} to user ${userId}`);

        // Store or update the Telegram chat ID in Supabase
        const { error: supabaseError, data: updateData } = await supabase
            .from("profiles")
            .update({ telegram_id: chatId })
            .eq("user_id", userId)
            .select();

        if (supabaseError) {
            console.error(`Supabase error for user ${userId}:`, supabaseError);

            // Try to notify user about the error
            try {
                await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: `❌ Sorry ${firstName}, we couldn't connect your Telegram account. Please try again or contact support.`,
                    }),
                });
            } catch (telegramError) {
                console.error("Failed to send Telegram error message:", telegramError);
            }

            throw new Error(`Supabase Error: ${supabaseError.message}, Code: ${supabaseError.code}, Details: ${JSON.stringify(supabaseError.details)}`);
        }

        if (!updateData || updateData.length === 0) {
            console.warn(`No profile found for user ID: ${userId}`);

            // Notify user
            try {
                await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: `❌ Sorry ${firstName}, we couldn't find your account. Please ensure you're using the correct link from Med-Aid.`,
                    }),
                });
            } catch (telegramError) {
                console.error("Failed to send Telegram not found message:", telegramError);
            }

            return NextResponse.json({ error: "User profile not found" }, { status: 404 });
        }

        // Send confirmation message with error handling
        try {
            const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: `✅ Hi ${firstName}, your Telegram notifications are now enabled!`,
                }),
            });

            if (!telegramResponse.ok) {
                const telegramErrorData = await telegramResponse.json();
                console.error("Telegram API error:", telegramErrorData);
                // Continue execution as the database was updated successfully
            }
        } catch (telegramError) {
            console.error("Failed to send Telegram confirmation:", telegramError);
            // Continue execution as the database was updated successfully
        }

        console.log(`Successfully linked Telegram chat ID ${chatId} to user ${userId}`);
        return NextResponse.json({
            success: true,
            message: "Telegram ID linked successfully",
            userId,
            chatId
        });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const errorStack = err instanceof Error ? err.stack : undefined;

        console.error("Error handling Telegram webhook:", {
            message: errorMessage,
            stack: errorStack,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({
            error: "Internal Server Error",
            message: errorMessage,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}