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
      <header className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Feedback
        </h2>
        <p className="mt-1 text-[14px] text-slate-500 dark:text-slate-400">
          Help us improve TaskFlow Pro by sharing your thoughts.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Form Section */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900 h-fit">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-7 sm:py-6 dark:border-slate-800/60">
            <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
              Submit Feedback
            </h3>
            <p className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400">
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
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="mb-2 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  Please specify *
                </label>
                <input
                  type="text"
                  value={formData.otherCategory}
                  onChange={(e) => setFormData({ ...formData, otherCategory: e.target.value })}
                  placeholder="What kind of feedback?"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
                Message *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="What's on your mind?"
                rows={5}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
                Rating (Optional)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: num === formData.rating ? "" : num })}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border text-[14px] font-semibold transition ${
                      formData.rating === num
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
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
                className="h-10 rounded-lg bg-indigo-600 px-6 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-300 hover:bg-indigo-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Feedback Section */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900 h-fit max-h-[800px] flex flex-col">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-7 sm:py-6 dark:border-slate-800/60 shrink-0">
            <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
              My Recent Feedback
            </h3>
            <p className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400">
              A history of your submitted feedback.
            </p>
          </div>

          <div className="overflow-y-auto p-4 sm:p-7">
            {loadingRecent ? (
              <p className="text-[13px] text-slate-500 dark:text-slate-400 text-center py-10">Loading...</p>
            ) : recentFeedback.length === 0 ? (
              <p className="text-[13px] text-slate-500 dark:text-slate-400 text-center py-10">You haven't submitted any feedback yet.</p>
            ) : (
              <div className="space-y-4">
                {recentFeedback.map((fb) => {
                  const canModify = fb.status === "new";
                  return (
                    <div key={fb._id} className="rounded-xl border border-slate-100 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800/60 group animate-in fade-in zoom-in-95">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={fb.category === 'Bug' ? 'high' : 'medium'}>
                          {fb.category === "Other" && fb.otherCategory ? `Other: ${fb.otherCategory}` : fb.category}
                        </Badge>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-400">{getSafeDateLabel(fb.createdAt)}</span>
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(fb)}
                              disabled={!canModify}
                              title={!canModify ? "Reviewed feedback can no longer be changed" : "Edit"}
                              className="text-slate-400 hover:text-indigo-600 disabled:hover:text-slate-400 disabled:opacity-50 dark:hover:text-indigo-400 p-1 rounded-md"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(fb)}
                              disabled={!canModify}
                              title={!canModify ? "Reviewed feedback can no longer be changed" : "Delete"}
                              className="text-slate-400 hover:text-red-600 disabled:hover:text-slate-400 disabled:opacity-50 dark:hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="text-[13px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {fb.message}
                      </p>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/60">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
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
                <label className="mb-2 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  Please specify *
                </label>
                <input
                  type="text"
                  value={editingItem.otherCategory || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, otherCategory: e.target.value })}
                  placeholder="What kind of feedback?"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
                Message *
              </label>
              <textarea
                value={editingItem.message}
                onChange={(e) => setEditingItem({ ...editingItem, message: e.target.value })}
                placeholder="What's on your mind?"
                rows={4}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
                Rating (Optional)
              </label>
              <div className="flex gap-2">
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
                className="h-10 rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-600 transition-all duration-300 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="h-10 rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all duration-300 hover:bg-indigo-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
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
