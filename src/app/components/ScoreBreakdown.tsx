"use client";

import { ScoreBreakdown as ScoreBreakdownType } from "@/lib/scoring";

export default function ScoreBreakdown({ score }: { score: ScoreBreakdownType }) {
  const factors = [
    { label: "Website", ...score.website, icon: "🌐" },
    { label: "Social Media", ...score.social, icon: "📱" },
    { label: "Rating", ...score.rating, icon: "⭐" },
    { label: "Reviews", ...score.reviews, icon: "💬" },
    { label: "Competitors", ...score.competitors, icon: "🏢" },
    { label: "Business Type", ...score.businessType, icon: "💼" },
    { label: "Activity", ...score.reviewRecency, icon: "📊" },
    { label: "Contact", ...score.contact, icon: "📞" },
  ];

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">Score Breakdown</h4>
      {factors.map((factor) => (
        <div key={factor.label} className="flex items-center gap-3">
          <span className="text-sm w-5">{factor.icon}</span>
          <div className="flex-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">{factor.label}</span>
              <span className="font-mono text-gray-400">
                {factor.score}/{factor.max}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  factor.score / factor.max >= 0.7
                    ? "bg-emerald-500"
                    : factor.score / factor.max >= 0.4
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${(factor.score / factor.max) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{factor.reason}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
