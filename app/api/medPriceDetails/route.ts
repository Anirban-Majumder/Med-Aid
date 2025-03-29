import { NextRequest, NextResponse } from 'next/server';
import { Agent } from 'https';
import nodeFetch from 'node-fetch';

// Increased timeout and added buffering for slow responses
const TIMEOUT_MS = 60000; // 1 minute timeout
const BUFFER_INTERVAL = 5000; // Send buffer every 5 seconds

function nodeStreamToWebStream(nodeStream: NodeJS.ReadableStream): ReadableStream {
  return new ReadableStream({
    start(controller) {
      let buffer = '';
      let timeout: NodeJS.Timeout;
      let bufferInterval: NodeJS.Timeout;

      const resetTimeout = () => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          cleanup();
          controller.error(new Error('Stream timeout'));
        }, TIMEOUT_MS);
      };

      const cleanup = () => {
        if (timeout) clearTimeout(timeout);
        if (bufferInterval) clearInterval(bufferInterval);
        nodeStream.removeAllListeners();
      };

      // Periodically flush buffer even if no new data
      bufferInterval = setInterval(() => {
        if (buffer.length > 0) {
          controller.enqueue(new TextEncoder().encode(buffer));
          buffer = '';
        }
      }, BUFFER_INTERVAL);

      resetTimeout();

      nodeStream.on('data', (chunk) => {
        resetTimeout();
        buffer += chunk;

        // If we have complete lines, process them
        if (buffer.includes('\n')) {
          const chunks = buffer.split('\n');
          buffer = chunks.pop() || ''; // Keep incomplete line in buffer

          const data = chunks.join('\n');
          if (data) {
            controller.enqueue(new TextEncoder().encode(data + '\n'));
          }
        }
      });

      nodeStream.on('end', () => {
        // Send any remaining data
        if (buffer.length > 0) {
          controller.enqueue(new TextEncoder().encode(buffer));
        }
        cleanup();
        controller.close();
      });

      nodeStream.on('error', (error) => {
        cleanup();
        controller.error(error);
      });
    },
    cancel() {
      nodeStream.emit('end');
      nodeStream.removeAllListeners();
    }
  });
}

// Create the HTTPS agent with increased timeouts
const httpsAgent = new Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  timeout: TIMEOUT_MS,
  keepAliveMsecs: 30000
});

async function fetchWithRetry(url: string, maxRetries = 3): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await nodeFetch(url, {
        agent: httpsAgent,
        signal: controller.signal,
        headers: {
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept': 'text/event-stream',
          'Connection': 'keep-alive'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retrying after ${delay}ms...`);
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

export async function GET(req: NextRequest) {
  // Destructure all required params at once
  const { name, pack, pin } = Object.fromEntries(req.nextUrl.searchParams);

  // Validate all required parameters
  if (!name || !pack || !pin) {
    return NextResponse.json(
      { error: "Missing name, pack, or pin" },
      { status: 400 }
    );
  }

  try {
    // Build URL with proper encoding
    const compUrl = new URL('https://medicomp.in/scrape-data');
    compUrl.searchParams.set('medname', name);
    compUrl.searchParams.set('packSize', pack);
    compUrl.searchParams.set('pincode', pin);

    console.log("Comparison URL:", compUrl.toString());

    // Use fetchWithRetry instead of direct fetch
    const compResponse = await fetchWithRetry(compUrl.toString());

    if (!compResponse.body) {
      throw new Error("Failed to get response body");
    }

    // Convert and return the stream
    const stream = nodeStreamToWebStream(compResponse.body);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive"
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error fetching data:", errorMessage);

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}