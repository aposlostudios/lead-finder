import { NextRequest, NextResponse } from "next/server";
import { saveLeads, getLeads, updateLeadStatus, deleteLead, getLeadStats } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const minScore = searchParams.get("minScore") ? parseInt(searchParams.get("minScore")!) : undefined;
    const businessType = searchParams.get("businessType") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 100;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;

    const leads = getLeads({ status, minScore, businessType, limit, offset });
    const stats = getLeadStats();

    return NextResponse.json({ leads, stats });
  } catch (error) {
    console.error("Get leads error:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leads } = body;

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: "Leads array is required" }, { status: 400 });
    }

    saveLeads(leads);
    return NextResponse.json({ success: true, count: leads.length });
  } catch (error) {
    console.error("Save leads error:", error);
    return NextResponse.json({ error: "Failed to save leads" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { placeId, status, notes } = body;

    if (!placeId || !status) {
      return NextResponse.json({ error: "placeId and status are required" }, { status: 400 });
    }

    updateLeadStatus(placeId, status, notes);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update lead error:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get("placeId");

    if (!placeId) {
      return NextResponse.json({ error: "placeId is required" }, { status: 400 });
    }

    deleteLead(placeId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete lead error:", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
