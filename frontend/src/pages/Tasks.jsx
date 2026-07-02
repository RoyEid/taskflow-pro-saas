import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router";
import DashboardLayout from "../layouts/DashboardLayout";
import useWorkspace from "../context/useWorkspace";
import useAuth from "../context/useAuth";
import { getProjects } from "../services/projectService";
import {
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from "../services/taskService";
import { getMembers } from "../services/memberService";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import AppSelect from "../components/ui/AppSelect";
import AppDatePicker from "../components/ui/AppDatePicker";
import AppDropdown from "../components/ui/AppDropdown";
import {
  showSuccess,
  showError,
  confirmDelete,
  showWarning,
} from "../utils/alerts";

import {
  Search,
  Plus,
  Calendar,
  Edit2,
  Trash2,
  CircleDashed,
  Columns,
  User,
} from "lucide-react";

const KANBAN_COLUMNS = [
  { id: "todo", title: "To Do", dotColor: "bg-slate-400" },
  { id: "in_progress", title: "In Progress", dotColor: "bg-blue-500" },
  { id: "review", title: "Review", dotColor: "bg-amber-500" },
  { id: "done", title: "Done", dotColor: "bg-emerald-500" },
  { id: "blocked", title: "Blocked", dotColor: "bg-red-500" },
];

const emptyTaskForm = {
  title: "",
  description: "",
  project: "",
  status: "todo",
  priority: "medium",
  dueDate: null,
  assignee: "",
};

function getWorkspaceId(workspace) {
  return workspace?._id || workspace?.id || null;
}

function getProjectId(project) {
  return project?._id || project?.id || null;
}

function getTaskId(task) {
  return task?._id || task?.id || null;
}

function getMemberUser(member) {
  if (member?.user && typeof member.user === "object") {
    return member.user;
  }

  if (member?.member && typeof member.member === "object") {
    return member.member;
  }

  return null;
}

function getUserId(user) {
  return user?._id || user?.id || null;
}

function normalizeProjects(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.projects)) return data.projects;

  if (Array.isArray(data?.data?.projects)) return data.data.projects;

  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function normalizeTasks(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.tasks)) return data.tasks;

  if (Array.isArray(data?.data?.tasks)) return data.data.tasks;

  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function normalizeMembers(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.members)) return data.members;

  if (Array.isArray(data?.data?.members)) return data.data.members;

  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function normalizeSelectValue(value) {
  if (typeof value === "string") return value;

  if (value?.value) return value.value;

  return "";
}

function getTaskProjectId(task, fallbackProjectId) {
  if (!task?.project) return fallbackProjectId || "";

  if (typeof task.project === "string") return task.project;

  return task.project?._id || task.project?.id || fallbackProjectId || "";
}

function getTaskAssigneeId(task) {
  if (!task?.assignee) return "";

  if (typeof task.assignee === "string") return task.assignee;

  return task.assignee?._id || task.assignee?.id || "";
}

function getSafeShortDate(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProjectId = searchParams.get("project") || "";

  const navigate = useNavigate();
  const { workspace, memberRole } = useWorkspace();
  const { user } = useAuth();
  const isMemberRole = memberRole === "member";

  const workspaceId = getWorkspaceId(workspace);
  const currentUserId = getUserId(user);

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(emptyTaskForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    await Promise.resolve();

    if (!workspaceId) {
      setProjects([]);
      setTasks([]);
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [projectsData, membersData] = await Promise.all([
        getProjects(workspaceId),
        getMembers(workspaceId).catch(() => []),
      ]);

      setProjects(normalizeProjects(projectsData));
      setMembers(normalizeMembers(membersData));

      if (selectedProjectId) {
        const tasksData = await getTasks(workspaceId, selectedProjectId);
        setTasks(normalizeTasks(tasksData));
      } else {
        setTasks([]);
      }
    } catch {
      setProjects([]);
      setTasks([]);
      setMembers([]);
      setError("Failed to load tasks. Please ensure a project is selected.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, selectedProjectId]);

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

  const handleProjectSelect = (value) => {
    const projectId = normalizeSelectValue(value);

    if (projectId) {
      setSearchParams({ project: projectId });
    } else {
      setSearchParams({});
    }
  };

  const openCreateModal = () => {
    if (!selectedProjectId) {
      showWarning("Please select a project first to create a task.");
      return;
    }

    setEditingTask(null);
    setForm({
      ...emptyTaskForm,
      project: selectedProjectId,
      assignee: isMemberRole ? currentUserId : "",
    });
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);

    setForm({
      title: task?.title || "",
      description: task?.description || "",
      project: getTaskProjectId(task, selectedProjectId),
      status: task?.status || "todo",
      priority: task?.priority || "medium",
      dueDate: task?.dueDate ? new Date(task.dueDate) : null,
      assignee: getTaskAssigneeId(task),
    });

    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (!saving) {
      setShowModal(false);
      setEditingTask(null);
      setForm(emptyTaskForm);
      setFormError("");
    }
  };

  const handleDelete = async (task) => {
    const taskId = getTaskId(task);

    if (!workspaceId || !selectedProjectId || !taskId) {
      showError("Missing workspace, project, or task information.");
      return;
    }

    try {
      await deleteTask(workspaceId, selectedProjectId, taskId);
      await loadData();
      showSuccess("Task deleted successfully");
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to delete task.");
    }
  };

  const openDeleteConfirm = async (task) => {
    const confirmed = await confirmDelete({
      title: "Delete Task",
      text: `Are you sure you want to delete "${
        task?.title || "this task"
      }"? This action cannot be undone.`,
      confirmButtonText: "Delete Task",
    });

    if (confirmed) {
      await handleDelete(task);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");

    const cleanForm = {
      title: form.title.trim(),
      description: form.description.trim(),
      project: normalizeSelectValue(form.project) || selectedProjectId,
      status: normalizeSelectValue(form.status) || "todo",
      priority: normalizeSelectValue(form.priority) || "medium",
      dueDate: form.dueDate || null,
      assignee: normalizeSelectValue(form.assignee),
    };

    if (!cleanForm.title) {
      setFormError("Task title is required.");
      return;
    }

    if (!workspaceId || !cleanForm.project) {
      setFormError("Missing workspace or project information.");
      return;
    }

    const payload = { ...cleanForm };

    delete payload.project;

    if (!payload.dueDate) {
      delete payload.dueDate;
    }

    if (!payload.assignee) {
      delete payload.assignee;
    }

    setSaving(true);

    try {
      if (editingTask) {
        const taskId = getTaskId(editingTask);

        if (!taskId) {
          setFormError("Missing task information.");
          return;
        }

        await updateTask(workspaceId, cleanForm.project, taskId, payload);
      } else {
        await createTask(workspaceId, cleanForm.project, payload);
      }

      await loadData();

      setShowModal(false);
      setEditingTask(null);
      setForm(emptyTaskForm);

      showSuccess(
        editingTask ? "Task updated successfully" : "Task created successfully"
      );
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save task.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (task, value) => {
    const newStatus = normalizeSelectValue(value);
    const taskId = getTaskId(task);

    if (!newStatus || task?.status === newStatus) return;

    if (!workspaceId || !selectedProjectId || !taskId) {
      showError("Missing workspace, project, or task information.");
      return;
    }

    try {
      await updateTaskStatus(workspaceId, selectedProjectId, taskId, newStatus);

      await loadData();
      showSuccess("Task status updated");
    } catch {
      showError("Failed to update status.");
    }
  };

  const filteredTasks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return tasks;

    return tasks.filter((task) => {
      const title = task?.title || "";
      const description = task?.description || "";

      return (
        title.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query)
      );
    });
  }, [tasks, searchQuery]);

  const projectOptions = useMemo(() => {
    return projects.map((project) => ({
      value: getProjectId(project) || "",
      label: project?.name || "Untitled Project",
    }));
  }, [projects]);

  const memberOptions = useMemo(() => {
    return [
      { value: "", label: "Unassigned" },
      ...members.map((member) => {
        const memberUser = getMemberUser(member);
        const memberUserId = getUserId(memberUser);
        const memberName =
          memberUser?.name || memberUser?.email || "Unknown User";

        return {
          value: memberUserId || "",
          label: memberName,
        };
      }),
    ];
  }, [members]);

  if (!workspace) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Tasks"
          subtitle="Manage your tasks in a Kanban board."
        />

        <div className="mt-10">
          <EmptyState
            title="No workspace selected"
            description="Please select a workspace to view tasks."
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
            Tasks Board
          </h2>

          <p className="mt-1 text-[14px] text-slate-500 dark:text-slate-400">
            Manage and track project tasks.
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-3 sm:flex-row lg:w-auto">
          <div className="relative w-full min-w-[250px] sm:w-64">
            <AppSelect
              value={selectedProjectId}
              onChange={handleProjectSelect}
              placeholder="-- Select a Project --"
              options={projectOptions}
            />
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={!selectedProjectId}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600 sm:w-auto"
          >
            <Plus size={16} />
            New Task
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {!selectedProjectId ? (
        <div className="mt-10">
          <EmptyState
            icon={
              <Columns
                size={48}
                className="mb-4 text-slate-300 dark:text-slate-600"
              />
            }
            title="Select a project"
            description="Tasks are scoped to projects. Please select a project from the dropdown above to view its Kanban board."
          />
        </div>
      ) : loading ? (
        <div className="mt-10">
          <LoadingState message="Loading tasks..." />
        </div>
      ) : (
        <>
          <div className="relative mb-6 max-w-sm transition-transform duration-300 hover:scale-[1.02] focus-within:scale-[1.02]">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-[13px] text-slate-700 shadow-sm outline-none transition-all placeholder-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-600"
            />
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4">
            {KANBAN_COLUMNS.map((column) => {
              const columnTasks = filteredTasks.filter(
                (task) => task?.status === column.id
              );

              return (
                <div
                  key={column.id}
                  className="flex w-[300px] shrink-0 flex-col rounded-xl bg-slate-100/50 p-3 dark:bg-slate-900/30"
                >
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${column.dotColor}`}
                      />

                      <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">
                        {column.title}
                      </h3>
                    </div>

                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200/50 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="flex min-h-[150px] flex-col gap-3">
                    {columnTasks.map((task) => {
                      const taskId = getTaskId(task);
                      const taskTitle = task?.title || "Untitled Task";
                      const assigneeName =
                        task?.assignee?.name || "Unassigned";

                      return (
                        <div
                          key={taskId || taskTitle}
                          className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900 dark:hover:border-slate-600"
                        >
                          <div className="flex items-start justify-between">
                            <Badge variant={task?.priority || "medium"} dot />

                            <AppDropdown
                              align={
                                column.id ===
                                KANBAN_COLUMNS[KANBAN_COLUMNS.length - 1].id
                                  ? "right"
                                  : "left"
                              }
                              trigger={({ open }) => (
                                <button
                                  type="button"
                                  className={`group/btn rounded p-1 text-slate-400 transition-all duration-300 hover:scale-110 hover:bg-slate-100 hover:text-slate-600 active:scale-95 dark:hover:bg-slate-800 dark:hover:text-slate-300 ${
                                    open ? "bg-slate-100 dark:bg-slate-800" : ""
                                  }`}
                                >
                                  <CircleDashed
                                    size={14}
                                    className="transition-transform duration-300 group-hover/btn:rotate-90"
                                  />
                                </button>
                              )}
                            >
                              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Change Status
                              </div>

                              {KANBAN_COLUMNS.map((statusColumn) => (
                                <AppDropdown.Item
                                  key={statusColumn.id}
                                  onClick={() =>
                                    handleStatusChange(task, statusColumn.id)
                                  }
                                  className={
                                    task?.status === statusColumn.id
                                      ? "bg-slate-50 dark:bg-slate-800/50"
                                      : ""
                                  }
                                >
                                  <span
                                    className={`mr-2 h-2 w-2 rounded-full ${statusColumn.dotColor}`}
                                  />
                                  {statusColumn.title}
                                </AppDropdown.Item>
                              ))}
                            </AppDropdown>
                          </div>

                          <Link
                            to={
                              taskId
                                ? `/tasks/${taskId}?project=${selectedProjectId}`
                                : `/tasks?project=${selectedProjectId}`
                            }
                            className="mt-3 line-clamp-2 block text-[14px] font-semibold text-slate-900 transition-colors hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                          >
                            {taskTitle}
                          </Link>

                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {task?.assignee ? (
                                <div
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                                  title={assigneeName}
                                >
                                  {assigneeName.charAt(0).toUpperCase()}
                                </div>
                              ) : (
                                <div
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-400 dark:border-slate-700 dark:bg-slate-800"
                                  title="Unassigned"
                                >
                                  <User size={12} />
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {task?.dueDate && (
                                <span className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                                  <Calendar size={12} />
                                  {getSafeShortDate(task.dueDate)}
                                </span>
                              )}

                              {!isMemberRole && (
                                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      openEditModal(task);
                                    }}
                                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                                    aria-label={`Edit ${taskTitle}`}
                                  >
                                    <Edit2 size={12} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      openDeleteConfirm(task);
                                    }}
                                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                                    aria-label={`Delete ${taskTitle}`}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingTask ? "Edit Task" : "Create Task"}
      >
        {formError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            {formError}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
              Title *
            </label>

            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              required
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
                    status: normalizeSelectValue(value) || "todo",
                  }))
                }
                options={KANBAN_COLUMNS.map((column) => ({
                  value: column.id,
                  label: column.title,
                }))}
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

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
              <AppSelect
                label="Assignee"
                value={form.assignee || ""}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    assignee: normalizeSelectValue(value),
                  }))
                }
                options={memberOptions}
                isDisabled={isMemberRole}
              />
            </div>
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
              className="h-10 rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-10 rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {saving ? "Saving..." : "Save Task"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default Tasks;