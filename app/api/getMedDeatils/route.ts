import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) { 
  const searchParams = req.nextUrl.searchParams
  
  const name = searchParams.get('name')

  if (!name || typeof name !== "string") {
    return NextResponse.json(
      { error: 'Query parameter "name" is required and must be a string.' },
      { status: 400 }
    );
  }

  try {
    const algoliaResponse = await fetch(
      "https://t63qhgrw33-dsn.algolia.net/1/indexes/Variant_Mobile_production/query?x-algolia-agent=Algolia%20for%20vanilla%20JavaScript%203.22.1&x-algolia-application-id=T63QHGRW33&x-algolia-api-key=8c5890a0d819b0043c688f23db75b573",
      {
        method: "POST",
        referrer: "https://frankrosspharmacy.com/",
        body: JSON.stringify({
          params: `query=${encodeURIComponent(
            name
          )}&filters=cities_mapping.city_13.active%3D1&hitsPerPage=20&page=0&clickAnalytics=true`,
        }),
      }
    );

    if (!algoliaResponse.ok) {
      return NextResponse.json(
        { error: `Error fetching data from Algolia: ${algoliaResponse.statusText}` },
        { status: algoliaResponse.status }
      );
    }

    const algoliaData = await algoliaResponse.json();

    if (!algoliaData.hits || algoliaData.hits.length === 0) {
      return NextResponse.json({ error: "No matching variant found" }, { status: 404 });
    }

    const variantId = algoliaData.hits[0].id;
    const crmResponse = await fetch(
      `https://crm.frankrosspharmacy.com/api/v8/customer/cities/13/web/variants/${variantId}`
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}