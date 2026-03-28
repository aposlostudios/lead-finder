import { ScoredLead } from "./scoring";

const STORAGE_KEY = "lead-finder-leads";

export interface SavedLead extends ScoredLead {
  status: string;
  notes: string;
  saved_at: string;
  contacted_at?: string;
}

function getAll(): SavedLead[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveAll(leads: SavedLead[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

export function saveLeadsToStorage(newLeads: ScoredLead[]): void {
  const existing = getAll();
  const existingIds = new Set(existing.map((l) => l.place_id));

  const toAdd: SavedLead[] = newLeads
    .filter((l) => !existingIds.has(l.place_id))
    .map((l) => ({
      ...l,
      status: "new",
      notes: "",
      saved_at: new Date().toISOString(),
    }));

  saveAll([...existing, ...toAdd]);
}

export function getSavedLeads(options?: {
  status?: string;
  minScore?: number;
}): SavedLead[] {
  let leads = getAll();

  if (options?.status && options.status !== "all") {
    leads = leads.filter((l) => l.status === options.status);
  }
  if (options?.minScore !== undefined) {
    leads = leads.filter((l) => l.score.total >= options.minScore!);
  }

  return leads.sort((a, b) => b.score.total - a.score.total);
}

export function updateLeadStatus(placeId: string, status: string, notes?: string): void {
  const leads = getAll();
  const idx = leads.findIndex((l) => l.place_id === placeId);
  if (idx >= 0) {
    leads[idx].status = status;
    if (notes !== undefined) leads[idx].notes = notes;
    if (status === "contacted") leads[idx].contacted_at = new Date().toISOString();
    saveAll(leads);
  }
}

export function deleteSavedLead(placeId: string): void {
  const leads = getAll().filter((l) => l.place_id !== placeId);
  saveAll(leads);
}

export function getLeadStats(): {
  total: number;
  new: number;
  contacted: number;
  converted: number;
  avgScore: number;
} {
  const leads = getAll();
  return {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    converted: leads.filter((l) => l.status === "converted").length,
    avgScore: leads.length > 0
      ? Math.round(leads.reduce((sum, l) => sum + l.score.total, 0) / leads.length)
      : 0,
  };
}

export function exportLeadsCSV(): string {
  const leads = getAll();
  const headers = [
    "Name", "Address", "Phone", "Website", "Rating", "Reviews",
    "Business Type", "Score", "Website Status", "Has Social Media",
    "Google Maps", "Status", "Notes", "Saved At",
  ];

  const rows = leads.map((lead) => [
    `"${(lead.name || "").replace(/"/g, '""')}"`,
    `"${(lead.address || "").replace(/"/g, '""')}"`,
    lead.phone || "",
    lead.website || "",
    lead.rating || "",
    lead.review_count || "",
    lead.business_type || "",
    lead.score.total,
    lead.has_website,
    lead.social_media.has_any ? "Yes" : "No",
    lead.google_maps_url || "",
    lead.status || "new",
    `"${(lead.notes || "").replace(/"/g, '""')}"`,
    lead.saved_at || "",
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function isLeadSaved(placeId: string): boolean {
  return getAll().some((l) => l.place_id === placeId);
}
