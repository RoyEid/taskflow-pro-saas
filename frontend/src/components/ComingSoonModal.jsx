import { Rocket } from "lucide-react";
import Modal from "./Modal";

export default function ComingSoonModal({ open, onClose, featureName }) {
  return (
    <Modal open={open} onClose={onClose} title="Coming Soon">
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
          <Rocket size={32} strokeWidth={1.5} />
        </div>
        <h3 className="mb-2 text-[18px] font-bold tf-text">
          {featureName ? `${featureName} is coming soon!` : "Feature coming soon!"}
        </h3>
        <p className="max-w-[280px] text-[14px] leading-relaxed tf-text-muted">
          We're working hard on this feature. It will be available in a future update!
        </p>
        <button
          type="button"
          onClick={onClose}
          className="tf-btn-base tf-btn-primary mt-8"
        >
          Got it
        </button>
      </div>
    </Modal>
  );
}
