import { NextRequest, NextResponse } from "next/server";
import { getLeads } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const minScore = searchParams.get("minScore") ? parseInt(searchParams.get("minScore")!) : undefined;

    const leads = getLeads({ status, minScore, limit: 10000 });

    // Build CSV
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

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export leads" }, { status: 500 });
  }
}
