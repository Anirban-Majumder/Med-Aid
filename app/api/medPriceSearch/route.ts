import { NextRequest, NextResponse } from 'next/server';
import { Agent } from 'https';
import nodeFetch from 'node-fetch';

// Create the HTTPS agent once outside the handler
const httpsAgent = new Agent({ rejectUnauthorized: false });

export async function GET(req: NextRequest) {
  // Get the medicine name from query parameters
  const name = req.nextUrl.searchParams.get("name");
  
  // Validate required parameter
  if (!name) {
    return NextResponse.json(
      { error: "Missing name" }, 
      { status: 400 }
    );
  }
  
  try {
    // Construct the URL with proper encoding
    const url = new URL('https://medicomp.in/medicineName');
    url.searchParams.set('q', name);
    
    // Fetch medicine data
    const medResponse = await nodeFetch(url.toString(), {
      method: "GET",
      agent: httpsAgent
    });
    
    // Handle response errors
    if (!medResponse.ok) {
      const text = await medResponse.text();
      console.error("Response error:", text);
      throw new Error(`Failed to fetch medicine data: ${medResponse.status}`);
    }
    
    console.log(`Data fetched successfully for: ${name}`);
    
    // Parse and validate the response
    const medicines = await medResponse.json() as any[];
    
    if (!medicines.length) {
      return NextResponse.json(
        { error: "No medicine found" }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(medicines, { 
      status: 200,
      headers: {
        'Cache-Control': 'max-age=300, s-maxage=600'
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error fetching medicine data:", errorMessage);
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}