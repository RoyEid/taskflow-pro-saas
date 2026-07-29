import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import useWorkspace from "../context/useWorkspace";
import { submitFeedback, getMyFeedback, updateFeedback, deleteFeedback } from "../services/feedbackService";
import { showSuccess, showWarning } from "../utils/alerts";
import Badge from "../components/Badge";
import AppSelect from "../components/ui/AppSelect";
import { Edit2, Trash2 } from "lucide-react";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import PageHeader from "../components/PageHeader";

function getSafeDateLabel(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

const CATEGORY_OPTIONS = [
  { value: "Bug", label: "Bug" },
  { value: "Feature Request", label: "Feature Request" },
  { value: "General Feedback", label: "General Feedback" },
  { value: "UI/UX", label: "UI/UX" },
  { value: "Other", label: "Other" },
];

function Feedback() {
  const { workspace } = useWorkspace();
  const workspaceId = workspace?._id || workspace?.id;

  const [formData, setFormData] = useState({
    category: "General Feedback",
    otherCategory: "",
    rating: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const [recentFeedback, setRecentFeedback] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadRecent() {
      try {
        const response = await getMyFeedback();
        if (active) {
          setRecentFeedback(response.data || []);
        }
      } catch (err) {
        console.error("Failed to load recent feedback", err);
      } finally {
        if (active) setLoadingRecent(false);
      }
    }
    loadRecent();
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      showWarning("Message is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        rating: formData.rating ? parseInt(formData.rating, 10) : null,
        workspaceId,
        pageUrl: window.location.pathname,
      };

      const result = await submitFeedback(payload);
      showSuccess("Feedback submitted successfully. Thank you!");
      
      // Reset form
      setFormData({
        category: "General Feedback",
        otherCategory: "",
        rating: "",
        message: "",
      });

      // Add to recent feedback smoothly
      setRecentFeedback((prev) => [result.data, ...prev]);
    } catch (err) {
      showWarning(err.response?.data?.message || "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (fb) => {
    if (fb.status !== "new") return;
    setEditingItem({ ...fb });
    setEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingItem.message.trim()) {
      showWarning("Message is required.");
      return;
    }
    
    setUpdating(true);
    try {
      const payload = {
        category: editingItem.category,
        otherCategory: editingItem.otherCategory,
        message: editingItem.message,
        rating: editingItem.rating ? parseInt(editingItem.rating, 10) : null,
      };
      const result = await updateFeedback(editingItem._id, payload);
      showSuccess("Feedback updated successfully!");
      setRecentFeedback((prev) => prev.map((f) => f._id === editingItem._id ? result.data : f));
      setEditModalOpen(false);
    } catch (err) {
      showWarning(err.response?.data?.message || "Failed to update feedback.");
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenDelete = (fb) => {
    if (fb.status !== "new") return;
    setDeletingItem(fb);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteFeedback(deletingItem._id);
      showSuccess("Feedback deleted successfully!");
      setRecentFeedback((prev) => prev.filter((f) => f._id !== deletingItem._id));
      setDeleteConfirmOpen(false);
    } catch (err) {
      showWarning(err.response?.data?.message || "Failed to delete feedback.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Feedback"
        subtitle="Help us improve TaskFlow Pro by sharing your thoughts."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form Section */}
        <div className="overflow-hidden rounded-2xl tf-card-base h-fit">
          <div className="tf-bd border-b px-4 py-4 sm:px-7 sm:py-6">
            <h3 className="text-[16px] font-bold tf-text">
              Submit Feedback
            </h3>
            <p className="mt-1.5 text-[13px] tf-text-muted">
              We read every piece of feedback to make the product better.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-4 py-5 sm:px-7 sm:py-7 space-y-6">
            <AppSelect
              label="Category"
              options={CATEGORY_OPTIONS}
              value={formData.category}
              onChange={(val) => setFormData({ ...formData, category: val, otherCategory: val === "Other" ? formData.otherCategory : "" })}
              required
            />

            {formData.category === "Other" && (
              <div>
                <label className="tf-label" htmlFor="feedback-other-category">
                  Please specify *
                </label>
                <input
                  id="feedback-other-category"
                  type="text"
                  value={formData.otherCategory}
                  onChange={(e) => setFormData({ ...formData, otherCategory: e.target.value })}
                  placeholder="What kind of feedback?"
                  className="tf-field w-full"
                  required
                />
              </div>
            )}

            <div>
              <label className="tf-label" htmlFor="feedback-message">
                Message *
              </label>
              <textarea
                id="feedback-message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="What's on your mind?"
                rows={5}
                className="tf-field w-full"
              />
            </div>

            <div>
              <p className="tf-label" id="feedback-rating-label">
                Rating (Optional)
              </p>
              <div className="flex gap-2" role="group" aria-labelledby="feedback-rating-label">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: num === formData.rating ? "" : num })}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border text-[14px] font-semibold transition ${
                      formData.rating === num
                        ? "tf-btn-primary"
                        : "tf-btn-ghost tf-bg-2"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="tf-btn-base tf-btn-primary"
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Feedback Section */}
        <div className="overflow-hidden rounded-2xl tf-card-base h-fit max-h-[800px] flex flex-col">
          <div className="tf-bd border-b px-4 py-4 sm:px-7 sm:py-6 shrink-0">
            <h3 className="text-[16px] font-bold tf-text">
              My Recent Feedback
            </h3>
            <p className="mt-1.5 text-[13px] tf-text-muted">
              A history of your submitted feedback.
            </p>
          </div>

          <div className="overflow-y-auto p-4 sm:p-7">
            {loadingRecent ? (
              <p className="text-[13px] tf-text-muted text-center py-10">Loading...</p>
            ) : recentFeedback.length === 0 ? (
              <p className="text-[13px] tf-text-muted text-center py-10">You haven't submitted any feedback yet.</p>
            ) : (
              <div className="space-y-4">
                {recentFeedback.map((fb) => {
                  const canModify = fb.status === "new";
                  return (
                    <div key={fb._id} className="rounded-xl tf-card-base p-4 group">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={fb.category === 'Bug' ? 'high' : 'medium'}>
                          {fb.category === "Other" && fb.otherCategory ? `Other: ${fb.otherCategory}` : fb.category}
                        </Badge>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] tf-text-subtle">{getSafeDateLabel(fb.createdAt)}</span>
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(fb)}
                              disabled={!canModify}
                              title={!canModify ? "Reviewed feedback can no longer be changed" : "Edit"}
                              className="tf-btn-icon tf-size-sm"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(fb)}
                              disabled={!canModify}
                              title={!canModify ? "Reviewed feedback can no longer be changed" : "Delete"}
                              className="tf-btn-icon tf-size-sm tf-text-danger"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="text-[13px] tf-text-secondary whitespace-pre-wrap">
                        {fb.message}
                      </p>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/60">
                        <div className="text-[11px] tf-text-muted">
                          Status: <strong className="capitalize">{fb.status}</strong>
                        </div>
                        {fb.rating && (
                          <div className="text-[11px] font-semibold text-amber-500 flex items-center gap-1">
                            ★ {fb.rating}/5
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => !updating && setEditModalOpen(false)}
        title="Edit Feedback"
      >
        {editingItem && (
          <form onSubmit={handleUpdate} className="space-y-5">
            <AppSelect
              label="Category"
              options={CATEGORY_OPTIONS}
              value={editingItem.category}
              onChange={(val) => setEditingItem({ ...editingItem, category: val, otherCategory: val === "Other" ? editingItem.otherCategory : "" })}
              required
            />

            {editingItem.category === "Other" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="tf-label" htmlFor="edit-feedback-other-category">
                  Please specify *
                </label>
                <input
                  id="edit-feedback-other-category"
                  type="text"
                  value={editingItem.otherCategory || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, otherCategory: e.target.value })}
                  placeholder="What kind of feedback?"
                  className="tf-field w-full"
                  required
                />
              </div>
            )}

            <div>
              <label className="tf-label" htmlFor="edit-feedback-message">
                Message *
              </label>
              <textarea
                id="edit-feedback-message"
                value={editingItem.message}
                onChange={(e) => setEditingItem({ ...editingItem, message: e.target.value })}
                placeholder="What's on your mind?"
                rows={4}
                className="tf-field w-full"
              />
            </div>

            <div>
              <p className="tf-label" id="edit-feedback-rating-label">
                Rating (Optional)
              </p>
              <div className="flex gap-2" role="group" aria-labelledby="edit-feedback-rating-label">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, rating: num === editingItem.rating ? "" : num })}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-[13px] font-semibold transition ${
                      editingItem.rating === num
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                disabled={updating}
                className="tf-btn-base tf-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="tf-btn-base tf-btn-primary"
              >
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => !deleting && setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Feedback"
        message="Are you sure you want to delete this feedback?"
        confirmText="Delete"
        isDestructive
        loading={deleting}
      />
    </DashboardLayout>
  );
}

export default Feedback;
