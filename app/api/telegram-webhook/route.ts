import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN!;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Helper function to send Telegram messages
async function sendTelegramMessage(chatId: number, text: string) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Telegram API error (${response.status}):`, errorData);
            return { success: false, error: errorData };
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to send Telegram message:", error instanceof Error ? error.message : error);
        return { success: false, error };
    }
}

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
        const userId = text.split(" ")[1];

        if (!userId) {
            console.warn(`No user ID provided in command: "${text}" from chat ID ${chatId}`, {
                chatId,
                messageText: text,
                timestamp: new Date().toISOString()
            });

            // Send helpful message to user
            const msgResult = await sendTelegramMessage(
                chatId,
                `⚠️ Please use the link provided in the Med-Aid application to connect your Telegram account.`
            );

            if (!msgResult.success) {
                console.error("Failed to send missing userID instruction:", msgResult.error);
            } else {
                console.log(`Successfully sent instructions to chat ID ${chatId}`);
            }

            return NextResponse.json({
                error: "Missing user ID in start command",
                details: "No user ID parameter was provided with the /start command"
            }, { status: 400 });
        }

        console.log(`Attempting to link Telegram chat ID ${chatId} to user ${userId}`, {
            chatId,
            userId,
            messageText: text,
            timestamp: new Date().toISOString()
        });

        // Store or update the Telegram chat ID in Supabase
        const { error: supabaseError, data: updateData } = await supabase
            .from("profiles")
            .update({ telegram_id: chatId })
            .eq("user_id", userId)
            .select();

        if (supabaseError) {
            console.error(`Supabase error for user ${userId}:`, supabaseError);

            // Try to notify user about the error
            const msgResult = await sendTelegramMessage(
                chatId,
                `❌ Sorry ${firstName}, we couldn't connect your Telegram account. Please try again or contact support.`
            );

            if (!msgResult.success) {
                console.error("Failed to send Telegram error message:", msgResult.error);
            }

            throw new Error(`Supabase Error: ${supabaseError.message}, Code: ${supabaseError.code}, Details: ${JSON.stringify(supabaseError.details)}`);
        }

        if (!updateData || updateData.length === 0) {
            console.warn(`No profile found for user ID: ${userId}`);

            // Notify user
            const msgResult = await sendTelegramMessage(
                chatId,
                `❌ Sorry ${firstName}, we couldn't find your account. Please ensure you're using the correct link from Med-Aid.`
            );

            if (!msgResult.success) {
                console.error("Failed to send Telegram not found message:", msgResult.error);
            }

            return NextResponse.json({ error: "User profile not found" }, { status: 404 });
        }

        // Send confirmation message with error handling
        const msgResult = await sendTelegramMessage(
            chatId,
            `✅ Hi ${firstName}, your Telegram notifications are now enabled!`
        );

        if (!msgResult.success) {
            console.error("Failed to send Telegram confirmation:", msgResult.error);
            // Continue execution as the database was updated successfully
        } else {
            console.log(`Successfully sent confirmation to chat ID ${chatId}`);
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