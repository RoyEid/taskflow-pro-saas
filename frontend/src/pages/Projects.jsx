import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import DashboardLayout from "../layouts/DashboardLayout";
import useWorkspace from "../context/useWorkspace";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../services/projectService";
import { getClients } from "../services/clientService";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import AppSelect from "../components/ui/AppSelect";
import AppDatePicker from "../components/ui/AppDatePicker";
import { showSuccess, showError, confirmDelete } from "../utils/alerts";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
  Calendar,
  Building2,
} from "lucide-react";

const emptyProjectForm = {
  name: "",
  description: "",
  client: "",
  status: "planning",
  priority: "medium",
  dueDate: null,
};

function getWorkspaceId(workspace) {
  return workspace?._id || workspace?.id || null;
}

function getProjectId(project) {
  return project?._id || project?.id || null;
}

function getClientId(client) {
  return client?._id || client?.id || null;
}

function normalizeProjects(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.projects)) return data.projects;

  if (Array.isArray(data?.data?.projects)) return data.data.projects;

  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function normalizeClients(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.clients)) return data.clients;

  if (Array.isArray(data?.data?.clients)) return data.data.clients;

  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function normalizeSelectValue(value) {
  if (typeof value === "string") return value;

  if (value?.value) return value.value;

  return "";
}

function getProjectClientId(project) {
  if (!project?.client) return "";

  if (typeof project.client === "string") return project.client;

  return project.client?._id || project.client?.id || "";
}

function getSafeDateLabel(value, options) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, options);
}

function Projects() {
  const navigate = useNavigate();
  const { workspace, memberRole } = useWorkspace();

  const workspaceId = getWorkspaceId(workspace);
  const isMemberRole = memberRole === "member";

  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState(emptyProjectForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    await Promise.resolve();

    if (!workspaceId) {
      setProjects([]);
      setClients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [projectsData, clientsData] = await Promise.all([
        getProjects(workspaceId),
        getClients(workspaceId),
      ]);

      setProjects(normalizeProjects(projectsData));
      setClients(normalizeClients(clientsData));
    } catch {
      setProjects([]);
      setClients([]);
      setError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    let cancelled = false;

    async function runLoadData() {
      await Promise.resolve();

      if (!cancelled) {
        await loadData();
      }
    }

    runLoadData();

    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const openCreateModal = () => {
    setEditingProject(null);
    setForm(emptyProjectForm);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);

    setForm({
      name: project?.name || "",
      description: project?.description || "",
      client: getProjectClientId(project),
      status: project?.status || "planning",
      priority: project?.priority || "medium",
      dueDate: project?.dueDate ? new Date(project.dueDate) : null,
    });

    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (!saving) {
      setShowModal(false);
      setEditingProject(null);
      setForm(emptyProjectForm);
      setFormError("");
    }
  };

  const handleDelete = async (project) => {
    const projectId = getProjectId(project);

    if (!workspaceId || !projectId) {
      showError("Missing workspace or project information.");
      return;
    }

    try {
      await deleteProject(workspaceId, projectId);
      await loadData();
      showSuccess("Project deleted successfully");
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to delete project.");
    }
  };

  const openDeleteConfirm = async (project) => {
    const confirmed = await confirmDelete({
      title: "Delete Project",
      text: `Are you sure you want to delete ${
        project?.name || "this project"
      }? This will permanently delete all tasks and comments inside this project.`,
      confirmButtonText: "Delete Project",
    });

    if (confirmed) {
      await handleDelete(project);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");

    const cleanForm = {
      name: form.name.trim(),
      description: form.description.trim(),
      client: normalizeSelectValue(form.client),
      status: normalizeSelectValue(form.status) || "planning",
      priority: normalizeSelectValue(form.priority) || "medium",
      dueDate: form.dueDate || null,
    };

    if (!cleanForm.name) {
      setFormError("Project name is required.");
      return;
    }

    if (!workspaceId) {
      setFormError("No workspace selected.");
      return;
    }

    const payload = { ...cleanForm };

    if (!payload.client) {
      delete payload.client;
    }

    if (!payload.dueDate) {
      delete payload.dueDate;
    }

    setSaving(true);

    try {
      if (editingProject) {
        const projectId = getProjectId(editingProject);

        if (!projectId) {
          setFormError("Missing project information.");
          return;
        }

        await updateProject(workspaceId, projectId, payload);
      } else {
        await createProject(workspaceId, payload);
      }

      await loadData();

      setShowModal(false);
      setEditingProject(null);
      setForm(emptyProjectForm);

      showSuccess(
        editingProject
          ? "Project updated successfully"
          : "Project created successfully"
      );
    } catch (err) {
      setFormError(
        err?.response?.data?.message || "Failed to save project."
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredProjects = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return projects;

    return projects.filter((project) => {
      const projectName = project?.name || "";
      const clientName =
        typeof project?.client === "object" ? project.client?.name || "" : "";

      return (
        projectName.toLowerCase().includes(query) ||
        clientName.toLowerCase().includes(query)
      );
    });
  }, [projects, searchQuery]);

  const clientOptions = useMemo(() => {
    return [
      { value: "", label: "No Client (Internal Project)" },
      ...clients.map((client) => {
        const clientId = getClientId(client);
        const clientName = client?.name || "Unnamed Client";
        const companyName = client?.companyName ? ` (${client.companyName})` : "";

        return {
          value: clientId || "",
          label: `${clientName}${companyName}`,
        };
      }),
    ];
  }, [clients]);

  if (!workspace) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Projects"
          subtitle="Manage your workspace projects."
        />

        <div className="mt-10">
          <EmptyState
            title="No workspace selected"
            description="Please select a workspace to view projects."
            action="Go to Workspaces"
            onAction={() => navigate("/workspaces")}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Projects
          </h2>

          <p className="mt-1 text-[14px] text-slate-500 dark:text-slate-400">
            Manage all active projects and initiatives in this workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isMemberRole && (
            <button
              type="button"
              onClick={openCreateModal}
              className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md active:translate-y-0 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Plus size={16} />
              New Project
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <div className="relative mb-6 max-w-sm transition-transform duration-300 hover:scale-[1.02] focus-within:scale-[1.02]">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-[13px] text-slate-700 shadow-sm outline-none transition-all placeholder-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-600"
          />
        </div>

        {loading ? (
          <LoadingState message="Loading projects..." />
        ) : filteredProjects.length === 0 ? (
          <div className="py-10">
            <EmptyState
              icon={<FolderOpen size={24} className="text-slate-400" />}
              title={searchQuery ? "No projects found" : "No projects yet"}
              description={
                searchQuery
                  ? "Try adjusting your search query."
                  : "Create your first project to start tracking tasks and milestones."
              }
              action={!searchQuery && !isMemberRole ? "Create Project" : undefined}
              onAction={!searchQuery && !isMemberRole ? openCreateModal : undefined}
            />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => {
              const projectId = getProjectId(project);
              const projectName = project?.name || "Untitled Project";
              const projectClientName =
                typeof project?.client === "object"
                  ? project.client?.name || "No Client"
                  : "No Client";

              return (
                <div
                  key={projectId || projectName}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-slate-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-2">
                      <Badge variant={project?.status || "planning"} />
                      <Badge variant={project?.priority || "medium"} dot />
                    </div>

                    {!isMemberRole && (
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            openEditModal(project);
                          }}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                          aria-label={`Edit ${projectName}`}
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            openDeleteConfirm(project);
                          }}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                          aria-label={`Delete ${projectName}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <Link
                    to={projectId ? `/projects/${projectId}` : "/projects"}
                    className="mt-5 block transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <h3 className="line-clamp-1 text-[16px] font-bold text-slate-900 dark:text-white">
                      {projectName}
                    </h3>
                  </Link>

                  <p className="mt-1.5 min-h-[40px] line-clamp-2 text-[13px] text-slate-500 dark:text-slate-400">
                    {project?.description || "No description provided."}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-[12px] dark:border-slate-800/60">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Building2 size={14} />
                      <span className="font-medium">{projectClientName}</span>
                    </div>

                    {project?.dueDate && (
                      <div className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                        <Calendar size={12} />

                        <span className="font-medium">
                          {getSafeDateLabel(project.dueDate, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingProject ? "Edit Project" : "Create Project"}
      >
        {formError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            {formError}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
              Project Name *
            </label>

            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              required
            />
          </div>

          <div>
            <AppSelect
              label="Client"
              value={form.client}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  client: normalizeSelectValue(value),
                }))
              }
              options={clientOptions}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <AppSelect
                label="Status"
                value={form.status}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    status: normalizeSelectValue(value) || "planning",
                  }))
                }
                options={[
                  { value: "planning", label: "Planning" },
                  { value: "active", label: "Active" },
                  { value: "on_hold", label: "On Hold" },
                  { value: "completed", label: "Completed" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
            </div>

            <div>
              <AppSelect
                label="Priority"
                value={form.priority}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    priority: normalizeSelectValue(value) || "medium",
                  }))
                }
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ]}
              />
            </div>
          </div>

          <div>
            <AppDatePicker
              label="Due Date"
              selected={form.dueDate}
              onChange={(date) =>
                setForm((prev) => ({ ...prev, dueDate: date }))
              }
              placeholderText="Select due date"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
              Description
            </label>

            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="h-10 rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-600 transition-all duration-300 hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-10 rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all duration-300 hover:bg-indigo-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {saving ? "Saving..." : "Save Project"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default Projects;