"use client";

interface StatsBarProps {
  stats: {
    total: number;
    noWebsite: number;
    basicWebsite: number;
    fullWebsite: number;
    avgScore: number;
  };
}

export default function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div className="bg-gray-800 rounded-lg p-3 text-center">
        <p className="text-2xl font-bold text-white">{stats.total}</p>
        <p className="text-xs text-gray-400">Total Found</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-3 text-center">
        <p className="text-2xl font-bold text-emerald-400">{stats.noWebsite}</p>
        <p className="text-xs text-gray-400">No Website</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-3 text-center">
        <p className="text-2xl font-bold text-amber-400">{stats.basicWebsite}</p>
        <p className="text-xs text-gray-400">Basic Site</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-3 text-center">
        <p className="text-2xl font-bold text-red-400">{stats.fullWebsite}</p>
        <p className="text-xs text-gray-400">Has Website</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-3 text-center col-span-2 md:col-span-1">
        <p className="text-2xl font-bold text-blue-400">{stats.avgScore}</p>
        <p className="text-xs text-gray-400">Avg Score</p>
      </div>
    </div>
  );
}
