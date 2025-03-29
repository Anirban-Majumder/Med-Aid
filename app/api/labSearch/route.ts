import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")
  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 })
  }

  try {
    const body = {
      requests: [
        {
          indexName: "prod_diagnostic_v4",
          params: `analyticsTags=web&clickAnalytics=true&facets=[]&highlightPostTag=__ais-highlight__&highlightPreTag=__ais-highlight__&hitsPerPage=10&page=0&query=${encodeURIComponent(
            name,
          )}&tagFilters=`,
        },
      ],
    }
    
    const labResponse = await fetch(
      "https://0z9q3se3dl-dsn.algolia.net/1/indexes/*/queries",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-algolia-api-key": "681de0728f8f570da6939eca42686614",
          "x-algolia-application-id": "0Z9Q3SE3DL",
        },
        body: JSON.stringify(body),
      },
    )
    
    if (!labResponse.ok) {
      throw new Error("Failed to fetch lab data")
    }
    
    const data = await labResponse.json()
    
    if (!data.results || data.results.length === 0) {
      throw new Error("No lab found")
    }
    
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}