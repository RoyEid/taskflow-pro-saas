import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import useWorkspace from "../context/useWorkspace";
import { submitSupportRequest, getMySupportRequests, updateSupportRequest, deleteSupportRequest } from "../services/supportService";
import { showSuccess, showWarning, showError } from "../utils/alerts";
import AppSelect from "../components/ui/AppSelect";
import { HelpCircle, ChevronDown, MessageSquare, BookOpen, Play, LifeBuoy, Edit2, Trash2 } from "lucide-react";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";

// Lucide icon helper
const ChevronIcon = ({ open }) => (
  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
);

const CATEGORY_OPTIONS = [
  { value: "Account/Login", label: "Account/Login" },
  { value: "Workspace", label: "Workspace" },
  { value: "Members/Roles", label: "Members/Roles" },
  { value: "Clients/Projects", label: "Clients/Projects" },
  { value: "Tasks", label: "Tasks" },
  { value: "Billing/Plans", label: "Billing/Plans" },
  { value: "Bug", label: "Bug Report" },
  { value: "Other", label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
];

const FAQ_DATA = [
  {
    question: "How do workspace roles work?",
    answer: "Workspace roles determine what you can see and do within a workspace. TaskFlow Pro uses three roles: Owner, Admin, and Member. Each has different permissions designed to keep your data secure while allowing collaboration.",
  },
  {
    question: "What is the difference between Owner, Admin, and Member?",
    answer: "Owners have full control and can manage members, clients, projects, and tasks. Admins can manage clients, projects, and tasks, and view members but cannot invite or remove them. Members can view clients and projects, create tasks, update task status, and comment, but they cannot delete tasks or manage settings.",
  },
  {
    question: "Why can’t I edit a client/project?",
    answer: "Only workspace Owners and Admins have permission to edit or delete clients and projects. If you are a Member, you have read-only access to these sections.",
  },
  {
    question: "How do I assign a task?",
    answer: "When creating or editing a task, use the Assignee dropdown. Owners and Admins can assign tasks to any workspace member. Members can only assign tasks to themselves.",
  },
  {
    question: "Why is a task overdue?",
    answer: "A task becomes overdue if its due date has passed and its status is not marked as 'completed' or 'resolved'.",
  },
  {
    question: "How do I reset my password?",
    answer: "If you are logged out, click 'Forgot Password' on the login screen. If you are logged in, you can update your password in the Settings page.",
  },
  {
    question: "How do I send feedback?",
    answer: "You can send feedback by visiting the Feedback page from the sidebar menu. Your feedback helps us improve TaskFlow Pro!",
  },
];

const QUICK_HELP_CARDS = [
  { title: "Getting Started", icon: <Play className="w-5 h-5 text-indigo-500" />, desc: "Learn the basics of TaskFlow Pro and set up your first workspace." },
  { title: "Managing Workspaces", icon: <LifeBuoy className="w-5 h-5 text-emerald-500" />, desc: "How to switch, edit, or delete your workspaces securely." },
  { title: "Inviting Members", icon: <HelpCircle className="w-5 h-5 text-amber-500" />, desc: "Add your team and assign the correct access roles." },
  { title: "Projects and Clients", icon: <BookOpen className="w-5 h-5 text-blue-500" />, desc: "Organize your workload effectively with clients and projects." },
];

function HelpSupport() {
  const { workspace } = useWorkspace();
  const workspaceId = workspace?._id || workspace?.id;

  const [formData, setFormData] = useState({
    subject: "",
    category: "Account/Login",
    otherCategory: "",
    priority: "Medium",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const faqRefs = useRef([]);

  const toggleFaq = (index) => {
    const isOpening = openFaqIndex !== index;
    setOpenFaqIndex(isOpening ? index : null);
    if (isOpening) {
      setTimeout(() => {
        faqRefs.current[index]?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 150);
    }
  };

  // Pagination & Edit/Delete State
  const [showAllRequests, setShowAllRequests] = useState(false);
  
  const [editingRequest, setEditingRequest] = useState(null);
  const [editFormData, setEditFormData] = useState({ subject: "", category: "", otherCategory: "", priority: "", message: "" });
  const [updating, setUpdating] = useState(false);

  const [deletingRequest, setDeletingRequest] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openEditModal = (req) => {
    if (req.status !== "open") {
      showError("This request is already being reviewed and can no longer be changed.");
      return;
    }
    setEditingRequest(req);
    setEditFormData({
      subject: req.subject,
      category: req.category,
      otherCategory: req.otherCategory || "",
      priority: req.priority,
      message: req.message,
    });
  };

  const closeEditModal = () => {
    setEditingRequest(null);
    setEditFormData({ subject: "", category: "", otherCategory: "", priority: "", message: "" });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.subject.trim() || !editFormData.message.trim()) {
      showWarning("Subject and Message are required.");
      return;
    }
    setUpdating(true);
    try {
      const result = await updateSupportRequest(editingRequest._id, editFormData);
      setRecentRequests(prev => prev.map(r => r._id === editingRequest._id ? result.data : r));
      showSuccess("Support request updated successfully.");
      closeEditModal();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Failed to update request.");
    } finally {
      setUpdating(false);
    }
  };

  const openDeleteDialog = (req) => {
    if (req.status !== "open") {
      showError("This request is already being reviewed and can no longer be changed.");
      return;
    }
    setDeletingRequest(req);
  };

  const closeDeleteDialog = () => {
    setDeletingRequest(null);
  };

  const handleDeleteSubmit = async () => {
    setIsDeleting(true);
    try {
      await deleteSupportRequest(deletingRequest._id);
      setRecentRequests(prev => prev.filter(r => r._id !== deletingRequest._id));
      showSuccess("Support request deleted successfully.");
      closeDeleteDialog();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Failed to delete request.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function loadRecent() {
      try {
        const response = await getMySupportRequests();
        if (active) {
          setRecentRequests(response.data || []);
        }
      } catch (err) {
        console.error("Failed to load recent support requests", err);
      } finally {
        if (active) setLoadingRecent(false);
      }
    }
    loadRecent();
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject.trim()) {
      showWarning("Subject is required.");
      return;
    }
    if (!formData.message.trim()) {
      showWarning("Message is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        workspaceId,
        pageUrl: window.location.pathname,
      };

      const result = await submitSupportRequest(payload);
      showSuccess("Support request submitted successfully.");
      
      // Reset form
      setFormData({
        subject: "",
        category: "Account/Login",
        otherCategory: "",
        priority: "Medium",
        message: "",
      });

      // Optimistically add to list
      setRecentRequests([result.data, ...recentRequests]);

    } catch (err) {
      console.error(err);
      showWarning(err.response?.data?.message || "Failed to submit support request.");
    } finally {
      setSubmitting(false);
    }
  };

  const getSafeDateLabel = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return "Unknown Date";
    }
  };

  const renderBadge = (status) => {
    switch (status) {
      case "in_progress":
        return <Badge variant="in_progress" />;
      case "closed":
        return <Badge variant="completed" />;
      default:
        return <Badge variant="todo" />;
    }
  };

  const renderPriority = (priority) => {
    switch (priority) {
      case "High":
        return <span className="text-[11px] font-medium tf-text-danger">High Priority</span>;
      case "Low":
        return <span className="text-[11px] font-medium tf-text-muted">Low Priority</span>;
      default:
        return <span className="text-[11px] font-medium tf-text-accent">Medium Priority</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl">
        <PageHeader
          title="Help & Support"
          subtitle="Find answers to common questions, explore our quick guides, or contact our support team directly."
          breadcrumb={
            <span className="inline-flex items-center gap-1.5">
              <LifeBuoy size={14} />
              Support center
            </span>
          }
        />

        {/* Quick Links & Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {QUICK_HELP_CARDS.map((card, idx) => (
            <div key={idx} className="tf-card-interactive group p-5">
              <div className="mb-3 w-10 h-10 rounded-lg tf-bg-3 flex items-center justify-center transition-transform">
                {card.icon}
              </div>
              <h3 className="text-[14px] font-semibold tf-text mb-1.5">{card.title}</h3>
              <p className="text-[13px] tf-text-muted leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Left Column (Form) */}
          <div className="lg:col-span-7 space-y-8">
            <div className="tf-card-base overflow-hidden rounded-2xl">
              <div className="px-7 py-5 tf-bd border-b tf-bg-2">
                <h2 className="text-[15px] font-semibold tf-text flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 tf-text-accent" />
                  Contact Support
                </h2>
                <p className="text-[13px] tf-text-muted mt-1">Submit a ticket and our team will get back to you.</p>
              </div>

              <form onSubmit={handleSubmit} className="px-7 py-7 space-y-6">
                
                <div>
                  <label className="tf-label" htmlFor="support-subject">
                    Subject *
                  </label>
                  <input
                    id="support-subject"
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Briefly describe your issue"
                    className="tf-field w-full"
                    required
                    maxLength={200}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <AppSelect
                    label="Category"
                    options={CATEGORY_OPTIONS}
                    value={formData.category}
                    onChange={(val) => setFormData({ ...formData, category: val, otherCategory: val === "Other" ? formData.otherCategory : "" })}
                    required
                  />

                  <AppSelect
                    label="Priority"
                    options={PRIORITY_OPTIONS}
                    value={formData.priority}
                    onChange={(val) => setFormData({ ...formData, priority: val })}
                  />
                </div>

                {formData.category === "Other" && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="tf-label" htmlFor="support-other-category">
                      Please specify *
                    </label>
                    <input
                      id="support-other-category"
                      type="text"
                      value={formData.otherCategory}
                      onChange={(e) => setFormData({ ...formData, otherCategory: e.target.value })}
                      placeholder="What kind of issue?"
                      className="tf-field w-full"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="tf-label" htmlFor="support-message">
                    Message *
                  </label>
                  <textarea
                    id="support-message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide as much detail as possible to help us resolve your issue..."
                    className="tf-field min-h-[140px] w-full p-3.5 resize-y"
                    required
                    maxLength={3000}
                  ></textarea>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="tf-btn-base tf-btn-primary"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      "Submit Request"
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* My Recent Support Requests */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-4 py-4 sm:px-7 sm:py-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
                <h2 className="text-[15px] font-semibold tf-text">
                  My Recent Requests
                </h2>
              </div>
              <div className="p-4 sm:p-7">
                {loadingRecent ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                  </div>
                ) : recentRequests.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-[13px] tf-text-muted">You haven't submitted any support requests recently.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(showAllRequests ? recentRequests : recentRequests.slice(0, 5)).map((req) => (
                      <div key={req._id} className="rounded-xl border border-slate-100 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800/60 group animate-in fade-in zoom-in-95 relative">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1 pr-2">
                            <h4 className="text-[14px] font-semibold tf-text mb-1 break-words">{req.subject}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-[12px]">
                              <span className="font-medium tf-text-secondary">
                                {req.category === "Other" && req.otherCategory ? `Other: ${req.otherCategory}` : req.category}
                              </span>
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                              {renderPriority(req.priority)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {renderBadge(req.status)}
                            {req.status === "open" && (
                              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(req)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                  title="Edit Request"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDeleteDialog(req)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                  title="Delete Request"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-[13px] tf-text-secondary mt-3 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/50 break-words">
                          {req.message}
                        </p>
                        <div className="mt-3 text-right">
                          <span className="text-[11px] text-slate-400">{getSafeDateLabel(req.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {recentRequests.length > 5 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-center">
                    <button
                      onClick={() => setShowAllRequests(!showAllRequests)}
                      className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    >
                      {showAllRequests ? "Show Less" : `View All (${recentRequests.length})`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Right Column (FAQ & Coming Soon Links) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* FAQ */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
                <h2 className="text-[15px] font-semibold tf-text flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-500" />
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {FAQ_DATA.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div
                      key={index}
                      ref={(el) => (faqRefs.current[index] = el)}
                      className="overflow-hidden scroll-mt-20"
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(index)}
                        className="w-full px-4 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors gap-3"
                      >
                        <span className={`text-[13px] font-medium transition-colors ${isOpen ? "text-indigo-600 dark:text-indigo-400" : "tf-text"}`}>
                          {faq.question}
                        </span>
                        <ChevronIcon open={isOpen} />
                      </button>
                      <div className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                        <div className="px-4 sm:px-6 pb-5 pt-1">
                          <p className="text-[13px] tf-text-secondary leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Edit Modal */}
      <Modal open={!!editingRequest} onClose={closeEditModal} title="Edit Support Request">
        <form onSubmit={handleEditSubmit} className="space-y-5 p-1">
          <div>
            <label className="tf-label" htmlFor="edit-support-subject">Subject *</label>
            <input
              id="edit-support-subject"
              type="text"
              value={editFormData.subject}
              onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
              className="tf-field w-full"
              required
              maxLength={200}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppSelect
              label="Category"
              options={CATEGORY_OPTIONS}
              value={editFormData.category}
              onChange={(val) => setEditFormData({ ...editFormData, category: val, otherCategory: val === "Other" ? editFormData.otherCategory : "" })}
              required
            />
            <AppSelect
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={editFormData.priority}
              onChange={(val) => setEditFormData({ ...editFormData, priority: val })}
            />
          </div>
          {editFormData.category === "Other" && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="tf-label" htmlFor="edit-support-other-category">Please specify *</label>
              <input
                id="edit-support-other-category"
                type="text"
                value={editFormData.otherCategory}
                onChange={(e) => setEditFormData({ ...editFormData, otherCategory: e.target.value })}
                className="tf-field w-full"
                required
              />
            </div>
          )}
          <div>
            <label className="tf-label" htmlFor="edit-support-message">Message *</label>
            <textarea
              id="edit-support-message"
              value={editFormData.message}
              onChange={(e) => setEditFormData({ ...editFormData, message: e.target.value })}
              className="tf-field min-h-[120px] w-full p-3.5 resize-y"
              required
              maxLength={3000}
            ></textarea>
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={closeEditModal} className="tf-btn-base tf-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={updating} className="tf-btn-base tf-btn-primary">
              {updating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deletingRequest}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteSubmit}
        title="Delete Support Request"
        message="Are you sure you want to delete this support request? This action cannot be undone."
        confirmText="Delete Request"
        loading={isDeleting}
      />
    </DashboardLayout>
  );
}

export default HelpSupport;
