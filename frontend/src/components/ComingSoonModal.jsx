import { Rocket } from "lucide-react";
import Modal from "./Modal";

export default function ComingSoonModal({ open, onClose, featureName }) {
  return (
    <Modal open={open} onClose={onClose} title="Coming Soon">
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
          <Rocket size={32} strokeWidth={1.5} />
        </div>
        <h3 className="mb-2 text-[18px] font-bold text-slate-900 dark:text-white">
          {featureName ? `${featureName} is coming soon!` : "Feature coming soon!"}
        </h3>
        <p className="max-w-[280px] text-[14px] leading-relaxed text-slate-500 dark:text-slate-400">
          We're working hard on this feature. It will be available in a future update!
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-8 rounded-lg bg-indigo-600 px-6 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          Got it
        </button>
      </div>
    </Modal>
  );
}
