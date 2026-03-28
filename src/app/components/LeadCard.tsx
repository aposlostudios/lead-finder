"use client";

import { useState } from "react";
import { ScoredLead } from "@/lib/scoring";
import ScoreBadge from "./ScoreBadge";
import ScoreBreakdown from "./ScoreBreakdown";

interface LeadCardProps {
  lead: ScoredLead;
  onSave?: (lead: ScoredLead) => void;
  isSaved?: boolean;
}

export default function LeadCard({ lead, onSave, isSaved }: LeadCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`bg-gray-800 rounded-xl border transition-all ${
        lead.score.total >= 70
          ? "border-emerald-500/30 shadow-emerald-500/10 shadow-lg"
          : lead.score.total >= 50
          ? "border-amber-500/20"
          : "border-gray-700"
      }`}
    >
      <div
        className="p-4 cursor-pointer flex items-center gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <ScoreBadge score={lead.score.total} />

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{lead.name}</h3>
          <p className="text-sm text-gray-400 truncate">{lead.address}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="text-xs text-blue-400 hover:text-blue-300"
                onClick={(e) => e.stopPropagation()}
              >
                {lead.phone}
              </a>
            )}
            {lead.rating && (
              <span className="text-xs text-yellow-400">
                {"★".repeat(Math.round(lead.rating))} {lead.rating}
              </span>
            )}
            {lead.review_count !== undefined && (
              <span className="text-xs text-gray-500">({lead.review_count} reviews)</span>
            )}
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                lead.has_website === "none"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : lead.has_website === "basic"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {lead.has_website === "none"
                ? "No Website"
                : lead.has_website === "basic"
                ? "Basic Site"
                : "Has Website"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end shrink-0">
          {onSave && !isSaved && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave(lead);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
            >
              Save Lead
            </button>
          )}
          {isSaved && (
            <span className="text-xs text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded">
              Saved
            </span>
          )}
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-700 pt-4 space-y-4">
          <ScoreBreakdown score={lead.score} />

          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href={lead.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-sm rounded-lg text-gray-300 transition-colors"
            >
              View on Google Maps
            </a>
            {lead.website && (
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-sm rounded-lg text-gray-300 transition-colors"
              >
                Visit Website
              </a>
            )}
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-sm rounded-lg text-white transition-colors"
              >
                Call Now
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
