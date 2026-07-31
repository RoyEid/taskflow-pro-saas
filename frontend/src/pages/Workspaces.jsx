import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import DashboardLayout from "../layouts/DashboardLayout";
import useWorkspace from "../context/useWorkspace";
import { getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } from "../services/workspaceService";
import {
  getMyInvitations,
  acceptInvitationById,
  declineInvitationById,
} from "../services/memberService";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import CardSkeleton from "../components/ui/CardSkeleton";
import Badge from "../components/Badge";
import AppDropdown from "../components/ui/AppDropdown";
import PageHeader from "../components/PageHeader";
import { showSuccess } from "../utils/alerts";
import {
  clearPendingWorkspaceDeletionId,
  setPendingWorkspaceDeletionId,
  WORKSPACE_DELETED_EVENT,
} from "../utils/workspaceEvents";
import {
  Plus,
  LayoutGrid,
  CheckCircle2,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  X,
  Building,
} from "lucide-react";

const emptyWorkspaceForm = {
  name: "",
  description: "",
};

function getWorkspaceId(workspace) {
  return workspace?._id || workspace?.id || null;
}

function normalizeWorkspaces(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.workspaces)) return data.workspaces;

  if (Array.isArray(data?.data?.workspaces)) return data.data.workspaces;

  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function normalizeCreatedWorkspace(data) {
  if (!data) return null;

  if (data?.data?.workspace) return data.data.workspace;

  if (data?.workspace) return data.workspace;

  if (data?.data?._id || data?.data?.id) return data.data;

  if (data?._id || data?.id) return data;

  return null;
}

function getWorkspaceFromItem(item) {
  return item?.workspace || item;
}

function getWorkspaceRole(item) {
  return item?.role || item?.membership?.role || item?.userRole || item?.workspace?.role || "member";
}

function getSafeDateLabel(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString();
}

function Workspaces() {
  const navigate = useNavigate();
  const {
    workspace: activeWorkspace,
    setWorkspace,
    removeWorkspace,
    refreshWorkspaces,
  } = useWorkspace();

  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [invitationActionLoadingId, setInvitationActionLoadingId] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState(emptyWorkspaceForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingWorkspace, setDeletingWorkspace] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const activeWorkspaceId = getWorkspaceId(activeWorkspace);

  const handleSelect = useCallback(
    (workspace) => {
      setWorkspace(workspace);
      navigate("/dashboard");
    },
    [setWorkspace, navigate]
  );

const load = useCallback(async () => {
  setLoading(true);
  setError("");

  try {
    const [data, invitesRes] = await Promise.all([
      getWorkspaces(),
      getMyInvitations().catch(() => null),
    ]);
    setWorkspaces(normalizeWorkspaces(data));
    setPendingInvitations(invitesRes?.invitations || []);
  } catch {
    setWorkspaces([]);
    setError("Failed to load workspaces.");
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  let cancelled = false;

  async function runLoad() {
    await Promise.resolve();

    if (!cancelled) {
      await load();
    }
  }

  runLoad();

  return () => {
    cancelled = true;
  };
}, [load]);

useEffect(() => {
  const oauthMessage = localStorage.getItem("oauth_success_message");
  if (oauthMessage) {
    showSuccess(oauthMessage);
    localStorage.removeItem("oauth_success_message");
  }
}, []);

useEffect(() => {
  const removeDeletedWorkspaceFromPage = (event) => {
    const deletedWorkspaceId =
      event?.detail?.deletedWorkspaceId || event?.detail?.workspaceId;

    if (!deletedWorkspaceId) return;

    setWorkspaces((currentWorkspaces) =>
      currentWorkspaces.filter(
        (item) =>
          String(getWorkspaceId(getWorkspaceFromItem(item))) !==
          String(deletedWorkspaceId)
      )
    );
  };

  window.addEventListener(
    WORKSPACE_DELETED_EVENT,
    removeDeletedWorkspaceFromPage
  );

  return () => {
    window.removeEventListener(
      WORKSPACE_DELETED_EVENT,
      removeDeletedWorkspaceFromPage
    );
  };
}, []);

  const openCreateModal = () => {
    setForm(emptyWorkspaceForm);
    setFormError("");
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (!saving) {
      setIsCreateModalOpen(false);
      setForm(emptyWorkspaceForm);
      setFormError("");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");

    const cleanForm = {
      name: form.name.trim(),
      description: form.description.trim(),
    };

    if (!cleanForm.name) {
      setFormError("Workspace name is required.");
      return;
    }

    setSaving(true);

    try {
      const data = await createWorkspace(cleanForm);
      const createdWorkspace = normalizeCreatedWorkspace(data);

      if (!createdWorkspace) {
        setFormError("Workspace was created, but the response was invalid.");
        return;
      }

      setWorkspaces((previousWorkspaces) => [
        {
          workspace: createdWorkspace,
          role: "owner",
          joinedAt: new Date().toISOString(),
        },
        ...previousWorkspaces,
      ]);

      setIsCreateModalOpen(false);
      setForm(emptyWorkspaceForm);

      showSuccess("Workspace created successfully!");

      await refreshWorkspaces();
      handleSelect({ workspace: createdWorkspace, role: "owner" });
    } catch (err) {
      setFormError(
        err?.response?.data?.message || "Failed to create workspace."
      );
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (workspace) => {
    setForm({ name: workspace.name, description: workspace.description || "" });
    setEditingWorkspace(workspace);
    setFormError("");
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    if (!saving) {
      setIsEditModalOpen(false);
      setEditingWorkspace(null);
      setForm(emptyWorkspaceForm);
      setFormError("");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setFormError("");

    const cleanForm = {
      name: form.name.trim(),
      description: form.description.trim(),
    };

    if (!cleanForm.name) {
      setFormError("Workspace name is required.");
      return;
    }

    setSaving(true);
    try {
      await updateWorkspace(getWorkspaceId(editingWorkspace), cleanForm);
      
      setWorkspaces((prev) => 
        prev.map((w) => {
          const wItem = getWorkspaceFromItem(w);
          if (getWorkspaceId(wItem) === getWorkspaceId(editingWorkspace)) {
            return {
              ...w,
              workspace: {
                ...wItem,
                name: cleanForm.name,
                description: cleanForm.description,
              }
            };
          }
          return w;
        })
      );

      if (activeWorkspaceId === getWorkspaceId(editingWorkspace)) {
        setWorkspace({
          ...activeWorkspace,
          name: cleanForm.name,
          description: cleanForm.description,
        });
      }

      showSuccess("Workspace updated successfully!");
      closeEditModal();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to update workspace.");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (workspace) => {
    setDeletingWorkspace(workspace);
    setDeleteConfirmText("");
    setFormError("");
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (!saving) {
      setIsDeleteModalOpen(false);
      setDeletingWorkspace(null);
      setDeleteConfirmText("");
      setFormError("");
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setFormError("");

    if (deleteConfirmText !== deletingWorkspace.name) {
      setFormError("Workspace name does not match.");
      return;
    }

    setSaving(true);
    const requestedWorkspaceId = getWorkspaceId(deletingWorkspace);
    let deletionSucceeded = false;
    setPendingWorkspaceDeletionId(requestedWorkspaceId);

    try {
      const response = await deleteWorkspace(requestedWorkspaceId);
      deletionSucceeded = true;
      const deletedWorkspaceId =
        response?.deletedWorkspaceId || requestedWorkspaceId;
      
      const newWorkspaces = workspaces.filter(
        (w) =>
          String(getWorkspaceId(getWorkspaceFromItem(w))) !==
          String(deletedWorkspaceId)
      );
      setWorkspaces(newWorkspaces);
      removeWorkspace(deletedWorkspaceId, newWorkspaces);

      showSuccess("Workspace deleted successfully.");

      if (String(activeWorkspaceId) === String(deletedWorkspaceId)) {
        navigate("/workspaces", { replace: true });
      }

      closeDeleteModal();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to delete workspace.");
    } finally {
      if (deletionSucceeded) {
        window.setTimeout(
          () => clearPendingWorkspaceDeletionId(requestedWorkspaceId),
          2000
        );
      } else {
        clearPendingWorkspaceDeletionId(requestedWorkspaceId);
      }
      setSaving(false);
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    setInvitationActionLoadingId(inviteId);
    try {
      await acceptInvitationById(inviteId);
      showSuccess("Invitation accepted!");
      window.location.reload();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to accept invitation.");
    } finally {
      setInvitationActionLoadingId(null);
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    setInvitationActionLoadingId(inviteId);
    try {
      await declineInvitationById(inviteId);
      showSuccess("Invitation declined.");
      setPendingInvitations((prev) => prev.filter(inv => inv._id !== inviteId));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to decline invitation.");
    } finally {
      setInvitationActionLoadingId(null);
    }
  };

  const renderPendingInvitations = () => {
    if (pendingInvitations.length === 0) return null;

    return (
      <div className="mb-10 space-y-4">
        <h3 className="text-[16px] font-bold tracking-tight tf-text">Pending Invitations</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pendingInvitations.map((invite) => (
            <div key={invite._id} className="tf-card-base rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl tf-bg-3 tf-text-accent">
                  <Building size={20} />
                </div>
                <div className="truncate">
                  <h4 className="truncate text-[14px] font-bold tf-text">{invite.workspace?.name}</h4>
                  <p className="truncate text-[12px] tf-text-muted">Invited by {invite.invitedBy?.name}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[12px] font-medium tf-text-secondary">Role: <strong className="capitalize">{invite.role}</strong></span>
                {invite.expiresAt && <span className="text-[11px] tf-text-subtle">Expires: {new Date(invite.expiresAt).toLocaleDateString()}</span>}
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => handleAcceptInvite(invite._id)}
                  disabled={invitationActionLoadingId === invite._id}
                  className="tf-btn-base tf-btn-primary flex-1"
                >
                  <Check size={14} /> Accept
                </button>
                <button
                  onClick={() => handleDeclineInvite(invite._id)}
                  disabled={invitationActionLoadingId === invite._id}
                  className="tf-btn-base tf-btn-secondary flex-1"
                >
                  <X size={14} /> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      {renderPendingInvitations()}
      <PageHeader
        title="Workspaces"
        subtitle="Manage your teams, clients, and projects in organized workspaces."
        action={openCreateModal}
        actionLabel="New Workspace"
        actionIcon={<Plus size={16} />}
      />

      {error && (
        <div className="tf-alert tf-alert-error mb-5" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-10">
          <CardSkeleton
            count={4}
            className="grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
          />
        </div>
      ) : workspaces.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<LayoutGrid size={24} className="tf-text-subtle" />}
            title="No workspaces yet"
            description="Create your first workspace to start managing projects, clients, and tasks."
            action="Create Workspace"
            onAction={openCreateModal}
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((item) => {
            const workspace = getWorkspaceFromItem(item);
            const workspaceId = getWorkspaceId(workspace);
            const workspaceName = workspace?.name || "Untitled Workspace";
            const workspaceRole = getWorkspaceRole(item);
            const normalizedRole = String(workspaceRole || "").toLowerCase();
            const isActive =
              activeWorkspaceId && workspaceId
                ? String(activeWorkspaceId) === String(workspaceId)
                : false;

            return (
              <div
                key={workspaceId || workspaceName}
                onClick={() => {
                  if (!isActive) {
                    handleSelect(workspace);
                  }
                }}
                className={`group tf-card-interactive rounded-2xl p-6 ${
                  isActive
                    ? "border-[var(--tf-accent)]"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl tf-bg-3 text-lg font-bold tf-text-accent transition-transform duration-300 group-hover:scale-110">
                    {workspaceName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={workspaceRole}>{workspaceRole}</Badge>

                    <div onClick={(e) => e.stopPropagation()}>
                      <AppDropdown
                        align="right"
                        trigger={({ open }) => (
                          <button
                            type="button"
                            className={`tf-btn-icon tf-size-sm ${
                              open ? "tf-bg-3" : ""
                            }`}
                          >
                            <MoreVertical size={16} />
                          </button>
                        )}
                      >
                        {!isActive ? (
                          <AppDropdown.Item
                            onClick={() => handleSelect(workspace)}
                          >
                            <LayoutGrid size={14} className="mr-2" />
                            Switch to workspace
                          </AppDropdown.Item>
                        ) : (
                          <AppDropdown.Item disabled>
                            <CheckCircle2 size={14} className="mr-2 tf-text-accent" />
                            Current workspace
                          </AppDropdown.Item>
                        )}
                        
                        {normalizedRole === "owner" && (
                          <>
                            <AppDropdown.Separator />
                            <AppDropdown.Item onClick={() => openEditModal(workspace)}>
                              <Edit2 size={14} className="mr-2" />
                              Edit Workspace
                            </AppDropdown.Item>
                            <AppDropdown.Item
                              onClick={() => openDeleteModal(workspace)}
                              danger
                            >
                              <Trash2 size={14} className="mr-2" />
                              Delete Workspace
                            </AppDropdown.Item>
                          </>
                        )}
                      </AppDropdown>
                    </div>
                  </div>
                </div>

                <h3 className="mt-5 line-clamp-1 text-[16px] font-bold tf-text">
                  {workspaceName}
                </h3>

                {workspace?.description ? (
                  <p className="mt-1.5 min-h-[40px] line-clamp-2 text-[13px] tf-text-muted">
                    {workspace.description}
                  </p>
                ) : (
                  <p className="mt-1.5 min-h-[40px] text-[13px] tf-text-subtle">
                    No description provided.
                  </p>
                )}

                <div className="mt-6 flex items-center justify-between tf-bd border-t pt-4 text-[12px] tf-text-subtle">
                  <span>
                    Created {getSafeDateLabel(workspace?.createdAt)}
                  </span>

                  {isActive && (
                    <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                      <CheckCircle2 size={12} />
                      Active
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Create Workspace"
      >
        {formError && (
          <div className="tf-alert tf-alert-error mb-4" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="tf-label" htmlFor="create-workspace-name">
              Name *
            </label>

            <input
              id="create-workspace-name"
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((previousForm) => ({
                  ...previousForm,
                  name: e.target.value,
                }))
              }
              placeholder="My Workspace"
              className="tf-field w-full"
            />
          </div>

          <div>
            <label className="tf-label" htmlFor="create-workspace-description">
              Description
            </label>

            <textarea
              id="create-workspace-description"
              value={form.description}
              onChange={(e) =>
                setForm((previousForm) => ({
                  ...previousForm,
                  description: e.target.value,
                }))
              }
              placeholder="Optional description..."
              rows={3}
              className="tf-field w-full"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeCreateModal}
              disabled={saving}
              className="tf-btn-base tf-btn-secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="tf-btn-base tf-btn-primary"
            >
              {saving ? "Creating..." : "Create Workspace"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={isEditModalOpen}
        onClose={closeEditModal}
        title="Edit Workspace"
      >
        {formError && (
          <div className="tf-alert tf-alert-error mb-4" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleEdit} className="space-y-5">
          <div>
            <label className="tf-label" htmlFor="edit-workspace-name">
              Name *
            </label>

            <input
              id="edit-workspace-name"
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((previousForm) => ({
                  ...previousForm,
                  name: e.target.value,
                }))
              }
              placeholder="My Workspace"
              className="tf-field w-full"
            />
          </div>

          <div>
            <label className="tf-label" htmlFor="edit-workspace-description">
              Description
            </label>

            <textarea
              id="edit-workspace-description"
              value={form.description}
              onChange={(e) =>
                setForm((previousForm) => ({
                  ...previousForm,
                  description: e.target.value,
                }))
              }
              placeholder="Optional description..."
              rows={3}
              className="tf-field w-full"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeEditModal}
              disabled={saving}
              className="tf-btn-base tf-btn-secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="tf-btn-base tf-btn-primary"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Delete Workspace"
      >
        {formError && (
          <div className="tf-alert tf-alert-error mb-4" role="alert">
            {formError}
          </div>
        )}
        
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/10">
          <p className="text-[13px] font-medium text-red-800 dark:text-red-400">
            Warning: This action cannot be undone.
          </p>
          <p className="mt-1 text-[13px] text-red-700 dark:text-red-300">
            This will permanently delete the <strong>{deletingWorkspace?.name}</strong> workspace, along with all its projects, tasks, clients, and associated data.
          </p>
        </div>

        <form onSubmit={handleDelete} className="space-y-5">
          <div>
            <label className="tf-label" htmlFor="delete-workspace-confirmation">
              Type <strong>{deletingWorkspace?.name}</strong> to confirm
            </label>

            <input
              id="delete-workspace-confirmation"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={deletingWorkspace?.name}
              className="tf-field w-full focus:border-red-500 focus:ring-red-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeDeleteModal}
              disabled={saving}
              className="tf-btn-base tf-btn-secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || deleteConfirmText !== deletingWorkspace?.name}
              className="tf-btn-base tf-btn-danger"
            >
              {saving ? "Deleting..." : "Delete Workspace"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default Workspaces;
