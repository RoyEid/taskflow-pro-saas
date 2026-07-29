import { Check, MessageSquare } from "lucide-react";
import Avatar from "./Avatar";

/* Floating client-approval request, the moment that distinguishes
   TaskFlow Pro from a plain task tracker. */
function ApprovalCard() {
  return (
    <div className="lp-panel-shadow w-full rounded-2xl border border-white/60 bg-white/90 p-4 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/90">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
          Client review
        </span>
        <span className="lp-tabular ml-auto text-[10.5px] font-medium tf-text-subtle">
          2h ago
        </span>
      </div>

      <p className="mt-3 text-[13px] font-bold leading-snug tf-text">
        Homepage motion pass is ready for sign-off
      </p>

      <div className="mt-2.5 flex items-center gap-2">
        <Avatar name="Priya Raman" size={22} />
        <span className="text-[11.5px] font-medium tf-text-muted">
          Priya Raman · Northwind
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <span className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-[11.5px] font-bold text-white">
          <Check size={13} />
          Approve
        </span>
        <span className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-[11.5px] font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">
          <MessageSquare size={13} />
          Comment
        </span>
      </div>
    </div>
  );
}

export default ApprovalCard;
