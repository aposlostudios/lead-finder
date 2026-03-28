"use client";

import { useState, useEffect, useCallback } from "react";
import LeadCard from "./LeadCard";
import {
  getSavedLeads,
  updateLeadStatus,
  getLeadStats,
  exportLeadsCSV,
  SavedLead,
} from "@/lib/client-db";

export default function SavedLeads() {
  const [leads, setLeads] = useState<SavedLead[]>([]);
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, converted: 0, avgScore: 0 });
  const [filter, setFilter] = useState<string>("all");

  const refresh = useCallback(() => {
    setLeads(getSavedLeads({ status: filter !== "all" ? filter : undefined }));
    setStats(getLeadStats());
  }, [filter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleUpdateStatus = (placeId: string, status: string) => {
    updateLeadStatus(placeId, status);
    refresh();
  };

  const handleExport = () => {
    const csv = exportLeadsCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        {stats.total > 0 && (
          <button
            onClick={handleExport}
            className="ml-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors"
          >
            Export CSV
          </button>
        )}
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
            <div key={lead.place_id}>
              <LeadCard lead={lead} isSaved />
              <div className="flex gap-2 px-4 pb-3 -mt-1">
                {lead.status !== "contacted" && (
                  <button
                    onClick={() => handleUpdateStatus(lead.place_id, "contacted")}
                    className="text-xs px-2 py-1 bg-amber-600/20 text-amber-400 rounded hover:bg-amber-600/30"
                  >
                    Mark Contacted
                  </button>
                )}
                {lead.status !== "converted" && (
                  <button
                    onClick={() => handleUpdateStatus(lead.place_id, "converted")}
                    className="text-xs px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded hover:bg-emerald-600/30"
                  >
                    Mark Converted
                  </button>
                )}
                {lead.status !== "rejected" && (
                  <button
                    onClick={() => handleUpdateStatus(lead.place_id, "rejected")}
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
