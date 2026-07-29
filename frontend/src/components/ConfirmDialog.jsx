import Modal from "./Modal";

function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = "Delete", loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || "Are you sure?"}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="tf-btn-base tf-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="tf-btn-base tf-btn-danger"
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </>
      }
    >
      <p className="tf-body">
        {message || "This action cannot be undone."}
      </p>
    </Modal>
  );
}

export default ConfirmDialog;
