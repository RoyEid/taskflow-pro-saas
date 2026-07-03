import React from "react";

export default function TableSkeleton({ rows = 5, cols = 4, className = "" }) {
  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900 ${className}`}>
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 py-4 dark:border-slate-800/60 dark:bg-slate-900/50">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={`thead-${cIdx}`}
              className="h-4 flex-1 rounded bg-slate-200 dark:bg-slate-800 mr-4 last:mr-0"
            />
          ))}
        </div>
        {/* Rows skeleton */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {Array.from({ length: rows }).map((_, rIdx) => (
            <div key={`trow-${rIdx}`} className="flex px-6 py-5">
              {Array.from({ length: cols }).map((_, cIdx) => (
                <div
                  key={`tcol-${cIdx}`}
                  className="h-4 flex-1 rounded bg-slate-200/60 dark:bg-slate-800/60 mr-4 last:mr-0"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
