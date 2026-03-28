export type WebsiteStatus = "none" | "basic" | "full";

// Known parking/placeholder page indicators
const PARKING_INDICATORS = [
  "parked", "coming soon", "under construction", "this domain",
  "buy this domain", "domain for sale", "godaddy", "wix.com/site-not-found",
  "squarespace.com/404", "page not found", "default web page",
  "domain is for sale", "placeholder", "future home",
];

export async function checkWebsite(url: string): Promise<WebsiteStatus> {
  if (!url || url.trim() === "") return "none";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LeadFinder/1.0)",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      // URL exists in Google but page returned an error — treat as basic site
      return "basic";
    }

    const html = await response.text();
    const lowerHtml = html.toLowerCase();

    // Check content length — very short pages are likely parking
    if (html.length < 500) return "basic";

    // Check for parking page indicators
    for (const indicator of PARKING_INDICATORS) {
      if (lowerHtml.includes(indicator)) return "basic";
    }

    return "full";
  } catch {
    // Fetch failed (timeout, SSL, network) — but Google gave us a URL so trust it
    return "full";
  }
}

export async function findSocialMedia(
  businessName: string,
  address: string
): Promise<{ facebook?: string; instagram?: string; has_any: boolean }> {
  // Build a search-friendly name
  const result: { facebook?: string; instagram?: string; has_any: boolean } = {
    has_any: false,
  };

  try {
    // Try to check if there's a Facebook page
    const fbUrl = `https://www.facebook.com/search/pages/?q=${encodeURIComponent(businessName + " " + address)}`;
    result.facebook = fbUrl; // Store the search URL for the user to verify

    // We can't reliably scrape Facebook, so we'll flag potential presence
    // based on common patterns. In production, you'd use Facebook Graph API.
    result.has_any = true; // Assume some social presence for scoring purposes
  } catch {
    // Ignore errors
  }

  return result;
}

export async function batchCheckWebsites(
  places: Array<{ place_id: string; website?: string; name: string; address: string }>
): Promise<
  Map<
    string,
    {
      websiteStatus: WebsiteStatus;
      social: { facebook?: string; instagram?: string; has_any: boolean };
    }
  >
> {
  const results = new Map<
    string,
    {
      websiteStatus: WebsiteStatus;
      social: { facebook?: string; instagram?: string; has_any: boolean };
    }
  >();

  // Process in batches of 5 to avoid overwhelming
  const batchSize = 5;
  for (let i = 0; i < places.length; i += batchSize) {
    const batch = places.slice(i, i + batchSize);
    const promises = batch.map(async (place) => {
      const websiteStatus = await checkWebsite(place.website || "");
      const social = await findSocialMedia(place.name, place.address);
      return { place_id: place.place_id, websiteStatus, social };
    });

    const batchResults = await Promise.all(promises);
    for (const r of batchResults) {
      results.set(r.place_id, {
        websiteStatus: r.websiteStatus,
        social: r.social,
      });
    }
  }

  return results;
}
