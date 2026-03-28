"use client";

export default function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const color =
    score >= 70 ? "bg-emerald-500" :
    score >= 50 ? "bg-amber-500" :
    score >= 30 ? "bg-orange-500" :
    "bg-red-500";

  const textColor =
    score >= 70 ? "text-emerald-500" :
    score >= 50 ? "text-amber-500" :
    score >= 30 ? "text-orange-500" :
    "text-red-500";

  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-lg",
    lg: "w-20 h-20 text-2xl",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white ${color} shadow-lg`}
      >
        {score}
      </div>
      <span className={`text-xs font-medium ${textColor}`}>
        {score >= 70 ? "Hot Lead" : score >= 50 ? "Good Lead" : score >= 30 ? "Warm" : "Cold"}
      </span>
    </div>
  );
}
