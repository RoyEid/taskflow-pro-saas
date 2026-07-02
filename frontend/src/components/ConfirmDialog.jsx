import Modal from "./Modal";

function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = "Delete", loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title || "Are you sure?"}>
      <p className="text-[14px] text-slate-600 dark:text-slate-400">
        {message || "This action cannot be undone."}
      </p>
      <div className="mt-8 flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="rounded-lg bg-red-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : confirmText}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
