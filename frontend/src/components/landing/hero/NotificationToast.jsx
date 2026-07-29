import { Bell } from "lucide-react";

/* Floating live-notification chip with an unread badge. */
function NotificationToast() {
  return (
    <div className="lp-panel-shadow flex w-full items-center gap-3 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/90">
      <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
        <Bell size={16} />
        <span className="lp-tabular absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
          3
        </span>
      </span>

      <div className="min-w-0">
        <p className="truncate text-[12px] font-bold tf-text">
          Lina moved 2 tasks to Review
        </p>
        <p className="truncate text-[11px] font-medium tf-text-muted">
          Northwind Redesign · just now
        </p>
      </div>
    </div>
  );
}

export default NotificationToast;
