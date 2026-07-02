import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import DashboardLayout from "../layouts/DashboardLayout";
import useWorkspace from "../context/useWorkspace";
import { getWorkspaces, createWorkspace } from "../services/workspaceService";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Badge from "../components/Badge";
import AppDropdown from "../components/ui/AppDropdown";
import ComingSoonModal from "../components/ComingSoonModal";
import { showSuccess, showWarning } from "../utils/alerts";
import {
  Plus,
  LayoutGrid,
  CheckCircle2,
  MoreVertical,
  Edit2,
  Trash2,
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
  return item?.role || "member";
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
  const { workspace: activeWorkspace, setWorkspace } = useWorkspace();

  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState(null);
  const [form, setForm] = useState(emptyWorkspaceForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

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
    const data = await getWorkspaces();
    setWorkspaces(normalizeWorkspaces(data));
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

      handleSelect(createdWorkspace);
    } catch (err) {
      setFormError(
        err?.response?.data?.message || "Failed to create workspace."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Workspaces
          </h2>

          <p className="mt-1 text-[14px] text-slate-500 dark:text-slate-400">
            Manage your teams, clients, and projects in organized workspaces.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md active:translate-y-0 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Plus size={16} />
            New Workspace
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-10">
          <LoadingState message="Loading workspaces..." />
        </div>
      ) : workspaces.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<LayoutGrid size={24} className="text-slate-400" />}
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
                className={`group rounded-2xl bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-slate-900 ${
                  isActive
                    ? "border border-indigo-600 shadow-sm ring-1 ring-indigo-600/10 dark:border-indigo-500 dark:ring-indigo-500/20"
                    : "cursor-pointer border border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-lg font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-110">
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
                            className={`rounded-lg p-1.5 transition-colors ${
                              open
                                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-800/50 dark:hover:text-slate-300"
                            }`}
                          >
                            <MoreVertical size={16} />
                          </button>
                        )}
                      >
                        <AppDropdown.Item
                          onClick={() =>
                            setComingSoonFeature("Edit Workspace")
                          }
                        >
                          <Edit2 size={14} className="mr-2" />
                          Edit Workspace
                        </AppDropdown.Item>

                        <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

                        <AppDropdown.Item
                          onClick={() =>
                            setComingSoonFeature("Delete Workspace")
                          }
                          className="text-red-600 hover:!bg-red-50 dark:text-red-400 dark:hover:!bg-red-950/30"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Delete Workspace
                        </AppDropdown.Item>
                      </AppDropdown>
                    </div>
                  </div>
                </div>

                <h3 className="mt-5 line-clamp-1 text-[16px] font-bold text-slate-900 dark:text-white">
                  {workspaceName}
                </h3>

                {workspace?.description ? (
                  <p className="mt-1.5 min-h-[40px] line-clamp-2 text-[13px] text-slate-500 dark:text-slate-400">
                    {workspace.description}
                  </p>
                ) : (
                  <p className="mt-1.5 min-h-[40px] text-[13px] text-slate-400 dark:text-slate-500">
                    No description provided.
                  </p>
                )}

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-[12px] text-slate-400 dark:border-slate-800/60 dark:text-slate-500">
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
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
              Name *
            </label>

            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((previousForm) => ({
                  ...previousForm,
                  name: e.target.value,
                }))
              }
              placeholder="My Workspace"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] text-slate-800 shadow-sm outline-none transition placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
              Description
            </label>

            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((previousForm) => ({
                  ...previousForm,
                  description: e.target.value,
                }))
              }
              placeholder="Optional description..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-800 shadow-sm outline-none transition placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeCreateModal}
              disabled={saving}
              className="h-10 rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-600 transition-all duration-300 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-10 rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all duration-300 hover:bg-indigo-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {saving ? "Creating..." : "Create Workspace"}
            </button>
          </div>
        </form>
      </Modal>

      <ComingSoonModal 
        open={!!comingSoonFeature} 
        onClose={() => setComingSoonFeature(null)} 
        featureName={comingSoonFeature} 
      />
    </DashboardLayout>
  );
}

export default Workspaces;