import { PlaceResult } from "./google-places";

export interface ScoreBreakdown {
  total: number;
  website: { score: number; max: 30; reason: string };
  rating: { score: number; max: 10; reason: string };
  reviews: { score: number; max: 10; reason: string };
  social: { score: number; max: 15; reason: string };
  competitors: { score: number; max: 10; reason: string };
  businessType: { score: number; max: 10; reason: string };
  reviewRecency: { score: number; max: 10; reason: string };
  contact: { score: number; max: 5; reason: string };
}

export interface ScoredLead extends PlaceResult {
  score: ScoreBreakdown;
  has_website: "none" | "basic" | "full";
  social_media: {
    facebook?: string;
    instagram?: string;
    has_any: boolean;
  };
}

// High-value business types that typically pay well for websites
const HIGH_VALUE_TYPES = [
  "restaurant", "estate agent", "solicitor", "dentist",
  "accountant", "gym", "builder", "roofer",
];

const MEDIUM_VALUE_TYPES = [
  "plumber", "electrician", "hair salon", "beauty salon",
  "auto repair", "photographer", "tattoo parlor", "pub",
];

export function scoreLead(
  place: PlaceResult,
  websiteStatus: "none" | "basic" | "full",
  socialMedia: { facebook?: string; instagram?: string; has_any: boolean },
  competitorData: { total: number; withWebsites: number }
): ScoredLead {
  const breakdown: ScoreBreakdown = {
    total: 0,
    website: { score: 0, max: 30, reason: "" },
    rating: { score: 0, max: 10, reason: "" },
    reviews: { score: 0, max: 10, reason: "" },
    social: { score: 0, max: 15, reason: "" },
    competitors: { score: 0, max: 10, reason: "" },
    businessType: { score: 0, max: 10, reason: "" },
    reviewRecency: { score: 0, max: 10, reason: "" },
    contact: { score: 0, max: 5, reason: "" },
  };

  // 1. Website score (30pts) — no website = best lead
  if (websiteStatus === "none") {
    breakdown.website = { score: 30, max: 30, reason: "No website found — perfect lead" };
  } else if (websiteStatus === "basic") {
    breakdown.website = { score: 15, max: 30, reason: "Basic/parking page website — needs upgrade" };
  } else {
    breakdown.website = { score: 0, max: 30, reason: "Has a full website" };
  }

  // 2. Google rating (10pts) — higher rating = more established
  if (place.rating) {
    if (place.rating >= 4.5) {
      breakdown.rating = { score: 10, max: 10, reason: `${place.rating} stars — excellent reputation` };
    } else if (place.rating >= 4.0) {
      breakdown.rating = { score: 8, max: 10, reason: `${place.rating} stars — good reputation` };
    } else if (place.rating >= 3.5) {
      breakdown.rating = { score: 6, max: 10, reason: `${place.rating} stars — decent reputation` };
    } else if (place.rating >= 3.0) {
      breakdown.rating = { score: 4, max: 10, reason: `${place.rating} stars — average` };
    } else {
      breakdown.rating = { score: 2, max: 10, reason: `${place.rating} stars — below average` };
    }
  } else {
    breakdown.rating = { score: 3, max: 10, reason: "No rating — new or unrated" };
  }

  // 3. Review count (10pts) — more reviews = more active
  const reviews = place.review_count || 0;
  if (reviews >= 100) {
    breakdown.reviews = { score: 10, max: 10, reason: `${reviews} reviews — very active business` };
  } else if (reviews >= 50) {
    breakdown.reviews = { score: 8, max: 10, reason: `${reviews} reviews — active business` };
  } else if (reviews >= 20) {
    breakdown.reviews = { score: 6, max: 10, reason: `${reviews} reviews — moderately active` };
  } else if (reviews >= 5) {
    breakdown.reviews = { score: 4, max: 10, reason: `${reviews} reviews — some activity` };
  } else {
    breakdown.reviews = { score: 2, max: 10, reason: `${reviews} reviews — low activity` };
  }

  // 4. Social media presence (15pts) — has social but no website = understands marketing
  if (socialMedia.has_any && websiteStatus === "none") {
    breakdown.social = {
      score: 15,
      max: 15,
      reason: "Active on social media but no website — they understand marketing, easy sell",
    };
  } else if (socialMedia.has_any && websiteStatus === "basic") {
    breakdown.social = {
      score: 10,
      max: 15,
      reason: "Active on social media with basic website — ready for upgrade",
    };
  } else if (socialMedia.has_any) {
    breakdown.social = { score: 3, max: 15, reason: "Has social media and full website" };
  } else if (websiteStatus === "none") {
    breakdown.social = { score: 8, max: 15, reason: "No social media or website — needs full digital presence" };
  } else {
    breakdown.social = { score: 0, max: 15, reason: "No social media presence detected" };
  }

  // 5. Competitor density (10pts) — more competitors with websites = higher urgency
  if (competitorData.total > 0) {
    const websiteRatio = competitorData.withWebsites / competitorData.total;
    if (websiteRatio >= 0.8) {
      breakdown.competitors = {
        score: 10,
        max: 10,
        reason: `${Math.round(websiteRatio * 100)}% of competitors have websites — urgent need`,
      };
    } else if (websiteRatio >= 0.6) {
      breakdown.competitors = {
        score: 7,
        max: 10,
        reason: `${Math.round(websiteRatio * 100)}% of competitors have websites — falling behind`,
      };
    } else if (websiteRatio >= 0.4) {
      breakdown.competitors = {
        score: 5,
        max: 10,
        reason: `${Math.round(websiteRatio * 100)}% of competitors have websites — competitive`,
      };
    } else {
      breakdown.competitors = {
        score: 3,
        max: 10,
        reason: `${Math.round(websiteRatio * 100)}% of competitors have websites — low urgency`,
      };
    }
  } else {
    breakdown.competitors = { score: 5, max: 10, reason: "No competitor data available" };
  }

  // 6. Business type value (10pts)
  const typeNormalized = place.business_type.toLowerCase();
  if (HIGH_VALUE_TYPES.some((t) => typeNormalized.includes(t))) {
    breakdown.businessType = { score: 10, max: 10, reason: `${place.business_type} — high-value industry` };
  } else if (MEDIUM_VALUE_TYPES.some((t) => typeNormalized.includes(t))) {
    breakdown.businessType = { score: 7, max: 10, reason: `${place.business_type} — good-value industry` };
  } else {
    breakdown.businessType = { score: 4, max: 10, reason: `${place.business_type} — standard industry` };
  }

  // 7. Review recency (10pts) — approximated by review count + rating combo
  if (reviews >= 20 && (place.rating || 0) >= 4.0) {
    breakdown.reviewRecency = { score: 10, max: 10, reason: "High reviews + good rating — likely active" };
  } else if (reviews >= 10) {
    breakdown.reviewRecency = { score: 7, max: 10, reason: "Moderate reviews — probably active" };
  } else if (reviews >= 3) {
    breakdown.reviewRecency = { score: 4, max: 10, reason: "Few reviews — uncertain activity" };
  } else {
    breakdown.reviewRecency = { score: 2, max: 10, reason: "Very few reviews — may be inactive" };
  }

  // 8. Contact availability (5pts)
  if (place.phone) {
    breakdown.contact = { score: 5, max: 5, reason: "Phone number available — easy to contact" };
  } else {
    breakdown.contact = { score: 0, max: 5, reason: "No phone number — harder to reach" };
  }

  // Calculate total
  breakdown.total =
    breakdown.website.score +
    breakdown.rating.score +
    breakdown.reviews.score +
    breakdown.social.score +
    breakdown.competitors.score +
    breakdown.businessType.score +
    breakdown.reviewRecency.score +
    breakdown.contact.score;

  return {
    ...place,
    score: breakdown,
    has_website: websiteStatus,
    social_media: socialMedia,
  };
}
