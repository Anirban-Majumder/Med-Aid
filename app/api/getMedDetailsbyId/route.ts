import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) { 
  const searchParams = req.nextUrl.searchParams 
  const id = searchParams.get('id')

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: 'Query parameter "id" is required and must be a string.' },
      { status: 400 }
    );
  }

  try {
    const crmResponse = await fetch(
      `https://crm.frankrosspharmacy.com/api/v8/customer/cities/13/web/variants/${id}`
    );

    if (!crmResponse.ok) {
      return NextResponse.json(
        { error: `Error fetching variant details from CRM: ${crmResponse.statusText}` },
        { status: crmResponse.status }
      );
    }

    const crmData = await crmResponse.json();
    return NextResponse.json(crmData, { status: 200 });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}