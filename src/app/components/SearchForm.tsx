"use client";

import { useState } from "react";
import { BUSINESS_TYPES } from "@/lib/google-places";

interface SearchFormProps {
  onSearch: (params: { location: string; businessType: string; radius: number }) => void;
  isLoading: boolean;
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [location, setLocation] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [customType, setCustomType] = useState("");
  const [radius, setRadius] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const type = businessType === "custom" ? customType : businessType;
    if (location && type) {
      onSearch({ location, businessType: type, radius });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. SW1A 1AA or London"
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Business Type
          </label>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
            required
          >
            <option value="">Select a type...</option>
            {BUSINESS_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
            <option value="custom">Custom...</option>
          </select>
        </div>
      </div>

      {businessType === "custom" && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Custom Business Type
          </label>
          <input
            type="text"
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            placeholder="e.g. dog walker, personal trainer"
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
            required
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Search Radius: <span className="text-blue-400">{radius} km</span>
        </label>
        <input
          type="range"
          min={1}
          max={50}
          value={radius}
          onChange={(e) => setRadius(parseInt(e.target.value))}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1 km</span>
          <span>25 km</span>
          <span>50 km</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !location || (!businessType || (businessType === "custom" && !customType))}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Searching & Scoring Leads...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Find Leads
          </>
        )}
      </button>
    </form>
  );
}
