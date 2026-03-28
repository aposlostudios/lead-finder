"use client";

import { useState, useEffect, useCallback } from "react";
import LeadCard from "./LeadCard";
import { ScoredLead } from "@/lib/scoring";

export default function SavedLeads() {
  const [leads, setLeads] = useState<Array<ScoredLead & { status: string }>>([]);
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, converted: 0, avgScore: 0 });
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setStats(data.stats || { total: 0, new: 0, contacted: 0, converted: 0, avgScore: 0 });
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateStatus = async (placeId: string, status: string) => {
    await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId, status }),
    });
    fetchLeads();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-gray-400">Total Saved</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-blue-400">{stats.new}</p>
          <p className="text-xs text-gray-400">New</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-amber-400">{stats.contacted}</p>
          <p className="text-xs text-gray-400">Contacted</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-emerald-400">{stats.converted}</p>
          <p className="text-xs text-gray-400">Converted</p>
        </div>
      </div>

      {/* Filters + Export */}
      <div className="flex flex-wrap items-center gap-2">
        {["all", "new", "contacted", "converted", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
              filter === s
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {s}
          </button>
        ))}
        <a
          href="/api/export"
          className="ml-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors"
        >
          Export CSV
        </a>
      </div>

      {/* Lead List */}
      {leads.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No saved leads yet</p>
          <p className="text-sm mt-1">Search for businesses and save the best ones here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.place_id} className="relative">
              <LeadCard lead={lead} isSaved />
              <div className="flex gap-2 px-4 pb-3 -mt-1">
                {lead.status !== "contacted" && (
                  <button
                    onClick={() => updateStatus(lead.place_id, "contacted")}
                    className="text-xs px-2 py-1 bg-amber-600/20 text-amber-400 rounded hover:bg-amber-600/30"
                  >
                    Mark Contacted
                  </button>
                )}
                {lead.status !== "converted" && (
                  <button
                    onClick={() => updateStatus(lead.place_id, "converted")}
                    className="text-xs px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded hover:bg-emerald-600/30"
                  >
                    Mark Converted
                  </button>
                )}
                {lead.status !== "rejected" && (
                  <button
                    onClick={() => updateStatus(lead.place_id, "rejected")}
                    className="text-xs px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
