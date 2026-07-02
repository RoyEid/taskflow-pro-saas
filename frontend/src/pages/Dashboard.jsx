import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import DashboardLayout from "../layouts/DashboardLayout";
import useAuth from "../context/useAuth";
import useWorkspace from "../context/useWorkspace";
import { getDashboard } from "../services/dashboardService";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";
import PageHeader from "../components/PageHeader";
import AppDropdown from "../components/ui/AppDropdown";
import ComingSoonModal from "../components/ComingSoonModal";
import { showSuccess, showWarning } from "../utils/alerts";
import {
  Bell,
  Settings as SettingsIcon,
  Calendar,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  FolderOpen,
  CheckSquare,
  CheckCircle2,
  Clock,
  Briefcase,
  RefreshCw,
  Download,
  FileBarChart,
} from "lucide-react";

function getWorkspaceId(workspace) {
  return workspace?._id || workspace?.id || null;
}

function normalizeDashboardResponse(response) {
  if (!response) return null;

  if (response?.data?.data) return response.data.data;

  if (response?.data) return response.data;

  return response;
}

function getSafeDate(value) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}

function getSafeDateLabel(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString();
}

function Dashboard() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const navigate = useNavigate();

  const workspaceId = getWorkspaceId(workspace);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("Today");
  const tabs = ["Today", "Yesterday", "This week"];

  const [comingSoonFeature, setComingSoonFeature] = useState(null);

  const [activitySearch, setActivitySearch] = useState("");
  const [notificationsRead, setNotificationsRead] = useState(false);

  const [dateRange, setDateRange] = useState("Last 30 Days");
  const dateRanges = [
    "Today",
    "Last 7 Days",
    "Last 30 Days",
    "This Month",
    "This Year",
  ];

  const [projectFilter, setProjectFilter] = useState("all");

  const loadDashboard = useCallback(async () => {
    if (!workspaceId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getDashboard(workspaceId);
      setData(normalizeDashboardResponse(response));
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    let cancelled = false;

    async function runLoadDashboard() {
      await Promise.resolve();

      if (!cancelled) {
        await loadDashboard();
      }
    }

    runLoadDashboard();

    return () => {
      cancelled = true;
    };
  }, [loadDashboard]);

  const stats = data?.stats || {
    projects: {
      total: 0,
      active: 0,
      completed: 0,
    },
    tasks: {
      total: 0,
      todo: 0,
      inProgress: 0,
      done: 0,
      overdue: 0,
    },
  };

  const getChange = (current, previous) => {
    if (!previous || previous === 0) return { text: "New", positive: true, label: "No previous data" };
    const diff = current - previous;
    const percentage = Math.round((diff / previous) * 100);
    const positive = percentage >= 0;
    return {
      text: `${positive ? '+' : ''}${percentage}%`,
      positive,
      label: "vs previous 30 days"
    };
  };

  const projectChange = getChange(stats.projects?.last30 || 0, stats.projects?.prev30 || 0);
  const activeTasksChange = getChange(stats.tasks?.activeLast30 || 0, stats.tasks?.activePrev30 || 0);
  const completedTasksChange = getChange(stats.tasks?.completedLast30 || 0, stats.tasks?.completedPrev30 || 0);
  const newTasksChange = getChange(stats.tasks?.newLast30 || 0, stats.tasks?.newPrev30 || 0);

  const statCards = [
    {
      title: "Total Projects",
      value: stats.projects?.total || 0,
      change: projectChange.text,
      changeLabel: projectChange.label,
      positive: projectChange.positive,
      iconBg:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
      icon: <FolderOpen size={18} strokeWidth={2} />,
      link: "/projects",
    },
    {
      title: "Active Tasks",
      value: Math.max((stats.tasks?.total || 0) - (stats.tasks?.done || 0), 0),
      change: activeTasksChange.text,
      changeLabel: activeTasksChange.label,
      positive: activeTasksChange.positive,
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
      icon: <CheckSquare size={18} strokeWidth={2} />,
      link: "/tasks",
    },
    {
      title: "Completed Tasks",
      value: stats.tasks?.done || 0,
      change: completedTasksChange.text,
      changeLabel: completedTasksChange.label,
      positive: completedTasksChange.positive,
      iconBg:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
      icon: <CheckCircle2 size={18} strokeWidth={2} />,
      link: "/tasks",
    },
    {
      title: "Overdue Tasks",
      value: stats.tasks?.overdue || 0,
      change: "—",
      changeLabel: "Current total",
      positive: true,
      iconBg: "bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400",
      icon: <Clock size={18} strokeWidth={2} />,
      link: "/tasks",
    },
  ];

  const chartBars = useMemo(() => {
    if (!data?.tasksTrend || data.tasksTrend.length === 0) return [];
    
    // Find max value to calculate height
    const maxCount = Math.max(...data.tasksTrend.map(t => t.count), 1);
    
    return data.tasksTrend.map((t, index, arr) => {
      // t._id is "YYYY-MM-DD"
      const date = new Date(t._id);
      const day = date.getDate().toString();
      
      return {
        day,
        value: t.count,
        height: (t.count / maxCount) * 100,
        highlighted: index === arr.length - 1, // Highlight the most recent day
      };
    }).slice(-15); // show only up to last 15 days for space
  }, [data?.tasksTrend]);

  const maxChartValue = useMemo(() => {
    if (!data?.tasksTrend || data.tasksTrend.length === 0) return 0;
    return Math.max(...data.tasksTrend.map(t => t.count));
  }, [data?.tasksTrend]);

  const activities = useMemo(() => {
    const activityList = [];

    const recentProjects = Array.isArray(data?.recentProjects)
      ? data.recentProjects
      : [];

    const recentTasks = Array.isArray(data?.recentTasks)
      ? data.recentTasks
      : [];

    recentProjects.forEach((project) => {
      const projectId = project?._id || project?.id;
      const createdDate = getSafeDate(project?.createdAt);

      activityList.push({
        id: `project-${projectId || project?.name || createdDate.getTime()}`,
        link: projectId ? `/projects/${projectId}` : "/projects",
        icon: <FolderOpen size={14} />,
        title: "Project created",
        desc: `${project?.name || "Untitled project"} was added`,
        time: getSafeDateLabel(project?.createdAt),
        date: createdDate,
        color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10",
      });
    });

    recentTasks.forEach((task) => {
      const taskId = task?._id || task?.id;
      const taskStatus = task?.status || "";
      const createdDate = getSafeDate(task?.createdAt);

      activityList.push({
        id: `task-${taskId || task?.title || createdDate.getTime()}`,
        link: taskId
          ? `/tasks/${taskId}?project=${task?.project || ""}`
          : "/tasks",
        icon:
          taskStatus === "done" ? (
            <CheckCircle2 size={14} />
          ) : (
            <CheckSquare size={14} />
          ),
        title: taskStatus === "done" ? "Task completed" : "New task added",
        desc: `${task?.title || "Untitled task"} was ${
          taskStatus === "done" ? "marked as Done" : "added"
        }`,
        time: getSafeDateLabel(task?.createdAt),
        date: createdDate,
        color:
          taskStatus === "done"
            ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
            : "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
      });
    });

    return activityList.sort((a, b) => b.date - a.date);
  }, [data]);

  const latestUpdates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const filteredByDate = activities.filter((activity) => {
      if (activeTab === "Today") return activity.date >= today;

      if (activeTab === "Yesterday") {
        return activity.date >= yesterday && activity.date < today;
      }

      if (activeTab === "This week") return activity.date >= startOfWeek;

      return true;
    });

    const search = activitySearch.toLowerCase().trim();

    return filteredByDate
      .filter((activity) => {
        if (!search) return true;

        return (
          activity.title.toLowerCase().includes(search) ||
          activity.desc.toLowerCase().includes(search)
        );
      })
      .slice(0, 5);
  }, [activities, activeTab, activitySearch]);

  const notifications = notificationsRead ? [] : activities.slice(0, 5);

  const filteredRecentProjects = useMemo(() => {
    const recentProjects = Array.isArray(data?.recentProjects)
      ? data.recentProjects
      : [];

    return recentProjects.filter((project) => {
      if (projectFilter === "active") {
        return project?.status === "active" || project?.status === "in_progress";
      }

      if (projectFilter === "completed") {
        return project?.status === "completed";
      }

      return true;
    });
  }, [data, projectFilter]);

  if (!workspace) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Dashboard"
          subtitle="Select a workspace to view your dashboard."
        />

        <div className="mt-10">
          <EmptyState
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            }
            title="No workspace selected"
            description="Please select or create a workspace from the Workspaces page."
            action="Go to Workspaces"
            onAction={() => navigate("/workspaces")}
          />
        </div>
      </DashboardLayout>
    );
  }

  if (loading && !data) {
    return (
      <DashboardLayout>
        <div className="mt-20">
          <LoadingState message="Loading dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[12px] font-medium text-slate-500 dark:text-slate-400">
            <span className="cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
              Overview
            </span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-900 dark:text-white">Dashboard</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hello, {user?.name || "User"} 👋
          </h2>

          <p className="mt-1.5 text-[14px] text-slate-500 dark:text-slate-400">
            Here are the latest insights from your workspace activity in{" "}
            {workspace?.name || "this workspace"}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
          <AppDropdown
            align="right"
            trigger={({ open }) => (
              <button
                type="button"
                className={`group flex h-10 w-10 items-center justify-center rounded-xl border text-slate-500 transition-all duration-300 active:scale-[0.98] ${
                  open
                    ? "border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800"
                    : "border-slate-200 bg-white hover:bg-slate-50 hover:shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:hover:bg-slate-800"
                }`}
              >
                <Bell
                  size={18}
                  className="transition-transform group-hover:animate-bell-wiggle"
                />
              </button>
            )}
          >
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[13px] font-bold text-slate-900 dark:text-white">
                Notifications
              </span>

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => setNotificationsRead(true)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-[12px] text-slate-500 dark:text-slate-400">
                You're all caught up!
              </div>
            ) : (
              notifications.map((notification) => (
                <AppDropdown.Item
                  key={notification.id}
                  onClick={() => navigate(notification.link || "#")}
                  className="!py-3 cursor-pointer items-start"
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${notification.color}`}
                  >
                    {notification.icon}
                  </div>

                  <div className="ml-3 min-w-0">
                    <p className="truncate text-[13px] font-semibold leading-tight text-slate-900 dark:text-white">
                      {notification.title}
                    </p>

                    <p className="mt-0.5 truncate text-[12px] text-slate-500 dark:text-slate-400">
                      {notification.desc}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      {notification.time}
                    </p>
                  </div>
                </AppDropdown.Item>
              ))
            )}

            <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

            <button
              type="button"
              onClick={() => setComingSoonFeature("Notifications Page")}
              className="w-full py-2 text-center text-[12px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              View all notifications
            </button>
          </AppDropdown>

          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="group flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-300 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98] dark:border-slate-700/80 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <SettingsIcon
              size={18}
              className="transition-transform group-hover:animate-spin-soft"
            />
          </button>

          <AppDropdown
            align="right"
            trigger={({ open }) => (
              <button
                type="button"
                className={`group inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl border px-4 text-[13px] font-medium transition-all duration-300 active:scale-[0.98] ${
                  open
                    ? "border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <Calendar
                  size={16}
                  className="text-slate-400 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110"
                />
                {dateRange}
              </button>
            )}
          >
            {dateRanges.map((range) => (
              <AppDropdown.Item
                key={range}
                onClick={() => {
                  if (range === "Last 30 Days") {
                    setDateRange(range);
                  } else {
                    setComingSoonFeature(`${range} Filter`);
                  }
                }}
                className={
                  dateRange === range
                    ? "bg-slate-50 font-semibold text-indigo-600 dark:bg-slate-800 dark:text-indigo-400"
                    : ""
                }
              >
                {range}
              </AppDropdown.Item>
            ))}
          </AppDropdown>

          <AppDropdown
            align="right"
            trigger={({ open }) => (
              <button
                type="button"
                className={`group flex h-10 w-10 items-center justify-center rounded-xl border text-slate-500 transition-all duration-300 active:scale-[0.98] ${
                  open
                    ? "border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800"
                    : "border-slate-200 bg-white hover:bg-slate-50 hover:shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:hover:bg-slate-800"
                }`}
              >
                <MoreHorizontal
                  size={18}
                  className="transition-transform duration-300 group-hover:scale-110 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                />
              </button>
            )}
          >
            <AppDropdown.Item
              onClick={() => {
                loadDashboard();
              }}
            >
              <RefreshCw size={15} />
              <span className="ml-2">Refresh Data</span>
            </AppDropdown.Item>

            <AppDropdown.Item
              onClick={() => setComingSoonFeature("Export Dashboard")}
            >
              <Download size={15} />
              <span className="ml-2">Export Dashboard</span>
            </AppDropdown.Item>

            <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

            <AppDropdown.Item onClick={() => setComingSoonFeature("Reports")}>
              <FileBarChart size={15} />
              <span className="ml-2">View Reports</span>
            </AppDropdown.Item>
          </AppDropdown>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <section className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Link
            to={card.link}
            key={card.title}
            className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-slate-700"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  {card.title}
                </p>

                <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {card.value}
                </h3>
              </div>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-sm ${card.iconBg}`}
              >
                {card.icon}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span
                className={`flex items-center gap-0.5 text-[12px] font-medium ${
                  card.positive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {card.positive ? (
                  <ArrowUpRight size={14} />
                ) : (
                  <ArrowDownRight size={14} />
                )}
                {card.change}
              </span>

              <span className="text-[12px] text-slate-400 dark:text-slate-500">
                {card.changeLabel}
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 xl:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
                Task Volume Trend
              </h3>

              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.tasks?.newLast30 || 0}
                </span>

                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  newTasksChange.positive
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                }`}>
                  {newTasksChange.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {newTasksChange.text}
                </span>
              </div>
            </div>

            <AppDropdown
              align="right"
              trigger={({ open }) => (
                <button
                  type="button"
                  className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition-all duration-300 active:scale-[0.98] ${
                    open
                      ? "border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {dateRange}
                  <MoreHorizontal size={14} />
                </button>
              )}
            >
              {dateRanges.map((range) => (
                <AppDropdown.Item
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={
                    dateRange === range
                      ? "bg-slate-50 font-semibold text-indigo-600 dark:bg-slate-800 dark:text-indigo-400"
                      : ""
                  }
                >
                  {range}
                </AppDropdown.Item>
              ))}
            </AppDropdown>
          </div>

          <div className="relative mt-8">
            <div className="pointer-events-none absolute right-0 top-0 flex h-full flex-col justify-between py-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
              <span>{maxChartValue}</span>
              <span>{Math.round(maxChartValue * 0.75)}</span>
              <span>{Math.round(maxChartValue * 0.5)}</span>
              <span>{Math.round(maxChartValue * 0.25)}</span>
              <span>0</span>
            </div>

            <div
              className="pointer-events-none absolute left-0 right-8 border-t border-dashed border-slate-200 dark:border-slate-800"
              style={{ top: "40%" }}
            />

            <div className="flex h-60 items-end gap-2 pr-10 sm:gap-4">
              {chartBars.map((bar) => (
                <div
                  key={bar.day}
                  className="group relative flex-1"
                  style={{ height: `${bar.height}%` }}
                >
                  {bar.highlighted && (
                    <div className="absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg dark:bg-white dark:text-slate-900">
                      {bar.value} Tasks
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-white" />
                    </div>
                  )}

                  <div
                    className={`h-full w-full rounded-t-md transition-all duration-300 ${
                      bar.highlighted
                        ? "bg-indigo-500 dark:bg-indigo-500"
                        : "bg-slate-100 group-hover:bg-slate-200 dark:bg-slate-800 dark:group-hover:bg-slate-700"
                    }`}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2 pr-10 sm:gap-4">
              {chartBars.map((bar) => (
                <div
                  key={bar.day}
                  className="flex-1 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500"
                >
                  {bar.day}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800/60">
            <h3 className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
              Latest Updates
            </h3>

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
                  <MoreHorizontal size={18} />
                </button>
              )}
            >
              <AppDropdown.Item
                onClick={() => setComingSoonFeature("Filter Updates")}
              >
                Filter Updates
              </AppDropdown.Item>

              <AppDropdown.Item onClick={() => setComingSoonFeature("Export Activity")}>
                Export Activity
              </AppDropdown.Item>
            </AppDropdown>
          </div>

          <div className="flex items-center gap-6 border-b border-slate-100 px-5 pt-3 dark:border-slate-800/60">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 text-[13px] font-medium transition-colors ${
                  activeTab === tab
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {tab}

                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-indigo-600 dark:bg-indigo-400" />
                )}
              </button>
            ))}

            <div className="ml-auto pb-3">
              <input
                type="text"
                placeholder="Search activity..."
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                className="h-7 w-32 rounded-md border border-slate-200 bg-slate-50 px-2 text-[12px] text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:focus:border-indigo-500 dark:focus:bg-slate-900 md:w-40"
              />
            </div>
          </div>

          <div className="flex-1 p-5">
            <p className="mb-4 flex items-center justify-between text-[13px] font-medium text-slate-900 dark:text-slate-200">
              {latestUpdates.length} recent activities
            </p>

            <div className="space-y-2">
              {latestUpdates.length === 0 ? (
                <div className="py-6 text-center text-[13px] text-slate-500 dark:text-slate-400">
                  No activity found for this period.
                </div>
              ) : (
                latestUpdates.map((update) => (
                  <Link
                    to={update.link || "#"}
                    key={update.id}
                    className="group flex cursor-pointer gap-4 rounded-xl p-3 transition-colors duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${update.color}`}
                    >
                      {update.icon}
                    </div>

                    <div>
                      <p className="text-[13px] font-semibold leading-tight text-slate-900 dark:text-white">
                        {update.title}
                      </p>

                      <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
                        {update.desc}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {update.time}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setComingSoonFeature("Activity Page")}
              className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-[12px] font-semibold text-slate-600 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              View All Activity
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800/60">
          <h3 className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
            Recent Projects
          </h3>

          <div className="flex items-center gap-3">
            <AppDropdown
              align="right"
              trigger={({ open }) => (
                <button
                  type="button"
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all duration-300 active:scale-[0.98] ${
                    open
                      ? "border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  Filter:{" "}
                  {projectFilter === "all"
                    ? "All"
                    : projectFilter === "active"
                    ? "Active"
                    : "Completed"}
                </button>
              )}
            >
              <AppDropdown.Item
                onClick={() => setProjectFilter("all")}
                className={projectFilter === "all" ? "bg-slate-50 dark:bg-slate-800" : ""}
              >
                All Projects
              </AppDropdown.Item>

              <AppDropdown.Item
                onClick={() => setProjectFilter("active")}
                className={
                  projectFilter === "active" ? "bg-slate-50 dark:bg-slate-800" : ""
                }
              >
                Active Only
              </AppDropdown.Item>

              <AppDropdown.Item
                onClick={() => setProjectFilter("completed")}
                className={
                  projectFilter === "completed"
                    ? "bg-slate-50 dark:bg-slate-800"
                    : ""
                }
              >
                Completed Only
              </AppDropdown.Item>
            </AppDropdown>

            <Link
              to="/projects"
              className="text-[13px] font-semibold text-indigo-600 transition-colors hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View all
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 dark:border-slate-800/60 dark:bg-slate-900/50">
                <th className="px-6 py-3.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                  Project Name
                </th>

                <th className="px-6 py-3.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                  Client
                </th>

                <th className="px-6 py-3.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                  Status
                </th>

                <th className="px-6 py-3.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                  Priority
                </th>

                <th className="px-6 py-3.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                  Created Date
                </th>
              </tr>
            </thead>

            <tbody>
              {!filteredRecentProjects.length ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No projects found.
                  </td>
                </tr>
              ) : (
                filteredRecentProjects.map((project) => {
                  const projectId = project?._id || project?.id;

                  return (
                    <tr
                      key={projectId || project?.name}
                      className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-4 text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                        <Link
                          to={projectId ? `/projects/${projectId}` : "/projects"}
                          className="flex items-center gap-2 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                          <Briefcase size={14} className="text-slate-400" />
                          {project?.name || "Untitled Project"}
                        </Link>
                      </td>

                      <td className="px-6 py-4 text-[13px] font-medium text-slate-600 dark:text-slate-400">
                        {project?.client?.name || "N/A"}
                      </td>

                      <td className="px-6 py-4">
                        <Badge variant={project?.status || "active"} />
                      </td>

                      <td className="px-6 py-4">
                        <Badge variant={project?.priority || "medium"} dot />
                      </td>

                      <td className="px-6 py-4 text-[13px] text-slate-500 dark:text-slate-400">
                        {getSafeDateLabel(project?.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ComingSoonModal 
        open={!!comingSoonFeature} 
        onClose={() => setComingSoonFeature(null)} 
        featureName={comingSoonFeature} 
      />
    </DashboardLayout>
  );
}

export default Dashboard;