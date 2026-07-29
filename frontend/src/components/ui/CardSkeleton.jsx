/*
 * A loading card mirrors the shape of the card it stands in for, so the
 * layout does not jump when data arrives.
 */
export default function CardSkeleton({ count = 3, className = "" }) {
  return (
    <div className={`grid gap-5 ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`card-skeleton-${index}`} className="tf-card-base p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="tf-skeleton h-4 w-1/3" />
            <div className="tf-skeleton h-8 w-8 rounded-[var(--tf-r-md)]" />
          </div>

          <div className="mt-4 space-y-2.5">
            <div className="tf-skeleton h-7 w-2/3" />
            <div className="tf-skeleton h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
