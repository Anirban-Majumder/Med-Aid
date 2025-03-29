import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
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
      return NextResponse.json({ hits: [] });
    }

    return NextResponse.json(algoliaData);
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}