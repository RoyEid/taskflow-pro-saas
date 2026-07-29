/*
 * Matches the real table's header band, row height and column count, so a
 * loading table occupies the same space as the loaded one.
 */
export default function TableSkeleton({ rows = 5, cols = 4, className = "" }) {
  return (
    <div className={`tf-table-wrap ${className}`} aria-hidden="true">
      <div className="tf-bd tf-bg-2 flex gap-4 border-b px-4 py-3">
        {Array.from({ length: cols }).map((_, index) => (
          <div key={`thead-${index}`} className="tf-skeleton h-3 flex-1" />
        ))}
      </div>

      <div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`trow-${rowIndex}`}
            className="flex gap-4 border-b px-4 py-4 last:border-b-0"
            style={{ borderColor: "var(--tf-border-subtle)" }}
          >
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div key={`tcol-${colIndex}`} className="tf-skeleton h-3.5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
