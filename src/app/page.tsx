"use client";

import { useState } from "react";
import SearchForm from "./components/SearchForm";
import LeadCard from "./components/LeadCard";
import StatsBar from "./components/StatsBar";
import SavedLeads from "./components/SavedLeads";
import { ScoredLead } from "@/lib/scoring";
import { saveLeadsToStorage } from "@/lib/client-db";

type Tab = "search" | "saved";

export default function Home() {
  const [tab, setTab] = useState<Tab>("search");
  const [leads, setLeads] = useState<ScoredLead[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInfo, setSearchInfo] = useState<{ location: string; count: number } | null>(null);

  const handleSearch = async (params: { location: string; businessType: string; radius: number }) => {
    setIsLoading(true);
    setError(null);
    setLeads([]);
    setSearchInfo(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Search failed");
        return;
      }

      setLeads(data.leads || []);
      setSearchInfo({
        location: data.location?.formatted || params.location,
        count: data.leads?.length || 0,
      });
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = (lead: ScoredLead) => {
    saveLeadsToStorage([lead]);
    setSavedIds((prev) => new Set(prev).add(lead.place_id));
  };

  const handleSaveAll = () => {
    const unsaved = leads.filter((l) => !savedIds.has(l.place_id));
    if (unsaved.length === 0) return;
    saveLeadsToStorage(unsaved);
    setSavedIds((prev) => {
      const next = new Set(prev);
      unsaved.forEach((l) => next.add(l.place_id));
      return next;
    });
  };

  const stats = {
    total: leads.length,
    noWebsite: leads.filter((l) => l.has_website === "none").length,
    basicWebsite: leads.filter((l) => l.has_website === "basic").length,
    fullWebsite: leads.filter((l) => l.has_website === "full").length,
    avgScore: leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + l.score.total, 0) / leads.length) : 0,
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">
              LF
            </div>
            <h1 className="text-lg font-bold text-white">Lead Finder</h1>
          </div>

          <nav className="flex gap-1 bg-gray-900 rounded-lg p-1">
            <button
              onClick={() => setTab("search")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === "search" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Search
            </button>
            <button
              onClick={() => setTab("saved")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === "saved" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Saved Leads
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {tab === "search" && (
          <>
            <SearchForm onSearch={handleSearch} isLoading={isLoading} />

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                {error}
              </div>
            )}

            {searchInfo && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">
                    Found <span className="text-white font-semibold">{searchInfo.count}</span> businesses near{" "}
                    <span className="text-white">{searchInfo.location}</span>
                  </p>
                  {leads.length > 0 && (
                    <button
                      onClick={handleSaveAll}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors"
                    >
                      Save All ({leads.filter((l) => !savedIds.has(l.place_id)).length})
                    </button>
                  )}
                </div>

                <StatsBar stats={stats} />
              </>
            )}

            {leads.length > 0 && (
              <div className="space-y-3">
                {leads.map((lead) => (
                  <LeadCard
                    key={lead.place_id}
                    lead={lead}
                    onSave={handleSave}
                    isSaved={savedIds.has(lead.place_id)}
                  />
                ))}
              </div>
            )}

            {!isLoading && leads.length === 0 && !error && !searchInfo && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-xl font-semibold text-white mb-2">Find Your Next Client</h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Search for businesses by location and type. We&apos;ll check which ones don&apos;t have websites
                  and score them as potential leads for your web design services.
                </p>
              </div>
            )}
          </>
        )}

        {tab === "saved" && <SavedLeads />}
      </main>
    </div>
  );
}
