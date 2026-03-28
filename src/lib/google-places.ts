export interface PlaceResult {
  place_id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  review_count?: number;
  business_type: string;
  lat: number;
  lng: number;
  photos?: string[];
  opening_hours?: boolean;
  google_maps_url: string;
}

interface GooglePlaceResponse {
  places: Array<{
    id: string;
    displayName: { text: string };
    formattedAddress: string;
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    websiteUri?: string;
    rating?: number;
    userRatingCount?: number;
    primaryType?: string;
    location: { latitude: number; longitude: number };
    photos?: Array<{ name: string }>;
    regularOpeningHours?: { openNow?: boolean };
    googleMapsUri?: string;
  }>;
  nextPageToken?: string;
}

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";

export async function searchPlaces(
  query: string,
  location: { lat: number; lng: number },
  radius: number,
  pageToken?: string
): Promise<{ results: PlaceResult[]; nextPageToken?: string }> {
  if (!API_KEY) {
    throw new Error("GOOGLE_PLACES_API_KEY is not set");
  }

  const url = "https://places.googleapis.com/v1/places:searchText";

  const body: Record<string, unknown> = {
    textQuery: query,
    locationBias: {
      circle: {
        center: { latitude: location.lat, longitude: location.lng },
        radius: radius * 1000, // Convert km to meters
      },
    },
    maxResultCount: 20,
    languageCode: "en",
  };

  if (pageToken) {
    body.pageToken = pageToken;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.primaryType,places.location,places.photos,places.regularOpeningHours,places.googleMapsUri,nextPageToken",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Places API error: ${response.status} - ${error}`);
  }

  const data: GooglePlaceResponse = await response.json();

  const results: PlaceResult[] = (data.places || []).map((place) => ({
    place_id: place.id,
    name: place.displayName?.text || "Unknown",
    address: place.formattedAddress || "",
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber,
    website: place.websiteUri,
    rating: place.rating,
    review_count: place.userRatingCount,
    business_type: place.primaryType || query,
    lat: place.location.latitude,
    lng: place.location.longitude,
    photos: place.photos?.map((p) => p.name),
    opening_hours: place.regularOpeningHours?.openNow,
    google_maps_url: place.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${place.id}`,
  }));

  return { results, nextPageToken: data.nextPageToken };
}

export async function geocodeLocation(
  query: string
): Promise<{ lat: number; lng: number; formatted: string } | null> {
  if (!API_KEY) throw new Error("GOOGLE_PLACES_API_KEY is not set");

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.results && data.results.length > 0) {
    const result = data.results[0];
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formatted: result.formatted_address,
    };
  }

  return null;
}

export const BUSINESS_TYPES = [
  { value: "plumber", label: "Plumber" },
  { value: "electrician", label: "Electrician" },
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Cafe / Coffee Shop" },
  { value: "hair salon", label: "Hair Salon / Barber" },
  { value: "beauty salon", label: "Beauty Salon" },
  { value: "auto repair", label: "Auto Repair / Mechanic" },
  { value: "dentist", label: "Dentist" },
  { value: "accountant", label: "Accountant" },
  { value: "solicitor", label: "Solicitor / Lawyer" },
  { value: "estate agent", label: "Estate Agent" },
  { value: "gym", label: "Gym / Fitness" },
  { value: "cleaning service", label: "Cleaning Service" },
  { value: "landscaper", label: "Landscaper / Gardener" },
  { value: "painter decorator", label: "Painter & Decorator" },
  { value: "roofer", label: "Roofer" },
  { value: "builder", label: "Builder / Construction" },
  { value: "florist", label: "Florist" },
  { value: "pet groomer", label: "Pet Groomer" },
  { value: "photographer", label: "Photographer" },
  { value: "tattoo parlor", label: "Tattoo Parlor" },
  { value: "takeaway", label: "Takeaway / Fast Food" },
  { value: "pub", label: "Pub / Bar" },
];
