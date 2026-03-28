import { NextRequest, NextResponse } from "next/server";
import { searchPlaces, geocodeLocation } from "@/lib/google-places";
import { scoreLead } from "@/lib/scoring";
import { batchCheckWebsites } from "@/lib/website-checker";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, businessType, radius = 10, pageToken } = body;

    if (!location || !businessType) {
      return NextResponse.json(
        { error: "Location and business type are required" },
        { status: 400 }
      );
    }

    // Geocode the location
    const geo = await geocodeLocation(location);
    if (!geo) {
      return NextResponse.json(
        { error: "Could not find that location. Try a postcode or city name." },
        { status: 400 }
      );
    }

    // Search for businesses
    const query = `${businessType} near ${location}`;
    const { results, nextPageToken } = await searchPlaces(
      query,
      { lat: geo.lat, lng: geo.lng },
      radius,
      pageToken
    );

    if (results.length === 0) {
      return NextResponse.json({
        leads: [],
        location: geo,
        nextPageToken: null,
        message: "No businesses found in this area. Try a wider radius or different business type.",
      });
    }

    // Check websites and social media for all results
    const websiteChecks = await batchCheckWebsites(
      results.map((r) => ({
        place_id: r.place_id,
        website: r.website,
        name: r.name,
        address: r.address,
      }))
    );

    // Calculate competitor data
    let withWebsites = 0;
    websiteChecks.forEach((check) => {
      if (check.websiteStatus === "full") withWebsites++;
    });
    const competitorData = { total: results.length, withWebsites };

    // Score all leads
    const scoredLeads = results.map((place) => {
      const check = websiteChecks.get(place.place_id) || {
        websiteStatus: "none" as const,
        social: { has_any: false },
      };

      return scoreLead(place, check.websiteStatus, check.social, competitorData);
    });

    // Sort by score (highest first)
    scoredLeads.sort((a, b) => b.score.total - a.score.total);

    return NextResponse.json({
      leads: scoredLeads,
      location: geo,
      nextPageToken: nextPageToken || null,
      competitorData,
    });
  } catch (error) {
    console.error("Search error:", error);
    const message = error instanceof Error ? error.message : "Search failed";

    if (message.includes("API_KEY")) {
      return NextResponse.json(
        { error: "Google API key is not configured. Add GOOGLE_PLACES_API_KEY to your .env.local file." },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
