
export default function CardSkeleton({ count = 3, className = "" }) {
  return (
    <div className={`grid gap-5 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`card-skeleton-${idx}`}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="mt-4 space-y-2.5">
            <div className="h-7 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
