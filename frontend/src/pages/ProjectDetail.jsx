import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import DashboardLayout from "../layouts/DashboardLayout";
import useWorkspace from "../context/useWorkspace";
import { getProjectById } from "../services/projectService";
import { getTasks } from "../services/taskService";
import Badge from "../components/Badge";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import {
  ArrowLeft,
  Briefcase,
  Columns,
  Calendar,
  Clock,
  BarChart3,
  CheckCircle2,
  ListTodo,
  Timer,
} from "lucide-react";

function getWorkspaceId(workspace) {
  return workspace?._id || workspace?.id || null;
}

function getProjectId(project) {
  return project?._id || project?.id || null;
}

function getTaskId(task) {
  return task?._id || task?.id || null;
}

function normalizeProject(data) {
  if (!data) return null;

  if (data?.data?.project) return data.data.project;

  if (data?.project) return data.project;

  if (data?.data?._id || data?.data?.id) return data.data;

  if (data?._id || data?.id) return data;

  return null;
}

function normalizeTasks(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.tasks)) return data.tasks;

  if (Array.isArray(data?.data?.tasks)) return data.data.tasks;

  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function getSafeDateLabel(value, fallback = "—") {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleDateString();
}

function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { workspace } = useWorkspace();

  const workspaceId = getWorkspaceId(workspace);

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const loadData = useCallback(async () => {
    await Promise.resolve();

    if (!workspaceId || !projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [projectData, tasksData] = await Promise.all([
        getProjectById(workspaceId, projectId),
        getTasks(workspaceId, projectId),
      ]);

      setProject(normalizeProject(projectData));
      setTasks(normalizeTasks(tasksData));
    } catch {
      setProject(null);
      setTasks([]);
      setError("Failed to load project details.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId]);

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

  const projectRealId = getProjectId(project);

  const taskStats = useMemo(() => {
    const todoTasks = tasks.filter((task) => task?.status === "todo").length;

    const inProgressTasks = tasks.filter(
      (task) => task?.status === "in_progress" || task?.status === "review"
    ).length;

    const doneTasks = tasks.filter((task) => task?.status === "done").length;

    const totalTasks = tasks.length;

    const progressPercent =
      totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

    return {
      todoTasks,
      inProgressTasks,
      doneTasks,
      totalTasks,
      progressPercent,
    };
  }, [tasks]);

  if (!workspace) {
    return (
      <DashboardLayout>
        <div className="mt-10">
          <EmptyState
            title="No workspace selected"
            description="Please select a workspace to view this project."
            action="Go to Workspaces"
            onAction={() => navigate("/workspaces")}
          />
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading project..." />
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="mt-10">
          <EmptyState
            title="Project not found"
            description={
              error ||
              "The project you're looking for doesn't exist or you don't have access."
            }
            action="Back to Projects"
            onAction={() => navigate("/projects")}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft size={14} />
          Back to Projects
        </Link>
      </div>

      <header className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {project?.name || "Untitled Project"}
            </h2>

            <Badge variant={project?.status || "active"} />
            <Badge variant={project?.priority || "medium"} dot />
          </div>

          {project?.client && (
            <div className="mt-3 flex items-center gap-1.5 text-[13px] text-slate-500 dark:text-slate-400">
              <Briefcase size={14} />
              Client:{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {project.client?.name || "Unnamed Client"}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/tasks?project=${projectRealId || projectId}`}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Columns size={16} />
            View Board
          </Link>
        </div>
      </header>

      <div className="mt-8 border-b border-slate-200 dark:border-slate-800/60">
        <nav className="-mb-px flex gap-8 px-2">
          {["overview", "tasks"].map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 py-3.5 text-[13px] font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
                  Description
                </h3>

                <p className="mt-4 whitespace-pre-wrap text-[14px] leading-relaxed text-slate-600 dark:text-slate-400">
                  {project?.description || "No description provided."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
                    <BarChart3 size={16} className="text-slate-400" />
                    Task Progress
                  </h3>

                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[13px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                    {taskStats.progressPercent}%
                  </span>
                </div>

                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/80">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${taskStats.progressPercent}%` }}
                  />
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800/60">
                    <p className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                      <ListTodo size={14} />
                      To Do
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                      {taskStats.todoTasks}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800/60">
                    <p className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                      <Timer size={14} />
                      In Progress
                    </p>

                    <p className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {taskStats.inProgressTasks}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800/60">
                    <p className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                      <CheckCircle2 size={14} />
                      Done
                    </p>

                    <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {taskStats.doneTasks}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
                <h3 className="mb-5 text-[15px] font-bold text-slate-900 dark:text-white">
                  Project Details
                </h3>

                <div className="space-y-5 text-[13px]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800/60">
                    <p className="text-slate-500 dark:text-slate-400">
                      Status
                    </p>

                    <div>
                      <Badge variant={project?.status || "active"} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800/60">
                    <p className="text-slate-500 dark:text-slate-400">
                      Priority
                    </p>

                    <div>
                      <Badge variant={project?.priority || "medium"} dot />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800/60">
                    <p className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Calendar size={14} />
                      Due Date
                    </p>

                    <p className="font-medium text-slate-900 dark:text-slate-200">
                      {project?.dueDate
                        ? getSafeDateLabel(project.dueDate)
                        : "No due date"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Clock size={14} />
                      Created
                    </p>

                    <p className="font-medium text-slate-900 dark:text-slate-200">
                      {getSafeDateLabel(project?.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            {tasks.length === 0 ? (
              <div className="py-16">
                <EmptyState
                  title="No tasks yet"
                  description="This project has no tasks."
                  action="Go to Kanban Board"
                  onAction={() =>
                    navigate(`/tasks?project=${projectRealId || projectId}`)
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 dark:border-slate-800/60 dark:bg-slate-900/50">
                      <th className="px-6 py-4 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                        Task Name
                      </th>

                      <th className="px-6 py-4 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                        Status
                      </th>

                      <th className="px-6 py-4 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                        Priority
                      </th>

                      <th className="px-6 py-4 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                        Due Date
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {tasks.map((task) => {
                      const taskId = getTaskId(task);

                      return (
                        <tr
                          key={taskId || task?.title}
                          className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-6 py-4 text-[14px] font-semibold text-slate-900 dark:text-slate-100">
                            <Link
                              to={
                                taskId
                                  ? `/tasks/${taskId}?project=${
                                      projectRealId || projectId
                                    }`
                                  : `/tasks?project=${projectRealId || projectId}`
                              }
                              className="transition hover:text-indigo-600 dark:hover:text-indigo-400"
                            >
                              {task?.title || "Untitled Task"}
                            </Link>
                          </td>

                          <td className="px-6 py-4">
                            <Badge variant={task?.status || "todo"} />
                          </td>

                          <td className="px-6 py-4">
                            <Badge variant={task?.priority || "medium"} dot />
                          </td>

                          <td className="px-6 py-4 text-[13px] text-slate-500 dark:text-slate-400">
                            {task?.dueDate
                              ? getSafeDateLabel(task.dueDate)
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ProjectDetail;