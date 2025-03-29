import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) { 
  const { searchParams } = req.nextUrl;
  const name = searchParams.get('name');
  const pin = searchParams.get('pin');

  if (!name || !pin) {
    return NextResponse.json(
      { error: "Missing name or pin" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://labs.netmeds.com/labtest/${encodeURIComponent(name)}?pincode=${encodeURIComponent(pin)}`
    );

    const data = await response.json();
    if (
      data.serviceStatus.status === "true" &&
      data.serviceStatus.statusCode === 200 &&
      data.serviceStatus.message === "success"
    ) {
      return NextResponse.json(data.result, { status: 200 });
    } else {
      console.log("Service Status:", data.serviceStatus);
      return NextResponse.json(
        { error: "Service did not return expected response" },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}