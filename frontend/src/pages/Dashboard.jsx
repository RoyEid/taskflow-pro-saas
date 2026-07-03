import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import DashboardLayout from "../layouts/DashboardLayout";
import useAuth from "../context/useAuth";
import useWorkspace from "../context/useWorkspace";
import {
  getDashboard,
  getDashboardActivity,
} from "../services/dashboardService";
import {
  getMyInvitations,
  acceptInvitationById,
  declineInvitationById,
} from "../services/memberService";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";
import PageHeader from "../components/PageHeader";
import AppDropdown from "../components/ui/AppDropdown";
import ActivityModal from "../components/ActivityModal";
import AnimatedNumber from "../components/AnimatedNumber";
import DashboardSettingsModal from "../components/DashboardSettingsModal";
import NotificationDropdown from "../components/NotificationDropdown";
import NotificationSettingsModal from "../components/NotificationSettingsModal";
import { showSuccess, showError } from "../utils/alerts";
import { exportDashboardPdf } from "../utils/exportDashboardPdf";
import {
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
  ChevronUp,
  ChevronDown,
  Users,
  Plus,
  UserPlus,
  Check,
  X,
  Building,
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

function normalizeArrayResponse(response) {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data?.data)) return response.data.data;

  if (Array.isArray(response?.data)) return response.data;

  return [];
}

function normalizeInvitationsResponse(response) {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.invitations)) return response.invitations;

  if (Array.isArray(response?.data?.invitations)) {
    return response.data.invitations;
  }

  if (Array.isArray(response?.data?.data?.invitations)) {
    return response.data.data.invitations;
  }

  if (Array.isArray(response?.data?.data)) return response.data.data;

  if (Array.isArray(response?.data)) return response.data;

  return [];
}

function getSafeDateLabel(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString();
}

function getNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatLabel(value, fallback = "N/A") {
  if (!value || typeof value !== "string") return fallback;

  return value.replaceAll("_", " ");
}

function getFirstName(name) {
  if (!name || typeof name !== "string") return "Unassigned";

  return name.trim().split(" ")[0] || "Unassigned";
}

function Dashboard() {
  const { user } = useAuth();
  const { workspace, memberRole } = useWorkspace();
  const navigate = useNavigate();

  const workspaceId = getWorkspaceId(workspace);

  const [data, setData] = useState(null);
  const [realActivities, setRealActivities] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [invitationActionLoadingId, setInvitationActionLoadingId] =
    useState(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("Today");
  const tabs = ["Today", "Yesterday", "This week"];

  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] =
    useState(false);

  const [activitySearch, setActivitySearch] = useState("");

  const dateRanges = [
    "Today",
    "Last 7 Days",
    "Last 30 Days",
    "This Month",
    "This Year",
  ];

  const defaultSettings = {
    showProjectsCard: true,
    showActiveTasksCard: true,
    showCompletedTasksCard: true,
    showOverdueTasksCard: true,
    showTrendChart: true,
    showLatestUpdates: true,
    showRecentProjects: true,
    activityCount: 5,
  };

  function getSavedDashboardSettings() {
    try {
      const saved = localStorage.getItem("taskflow_dashboard_settings");

      if (!saved) return {};

      const parsed = JSON.parse(saved);

      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      localStorage.removeItem("taskflow_dashboard_settings");
      return {};
    }
  }

  const savedDashboardSettings = useMemo(() => getSavedDashboardSettings(), []);

  const [dateRange, setDateRange] = useState(
    savedDashboardSettings.dateRange || "Last 30 Days",
  );

  const [settings, setSettings] = useState({
    ...defaultSettings,
    ...savedDashboardSettings,
  });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [projectFilter, setProjectFilter] = useState("all");

  const loadDashboard = useCallback(async () => {
    try {
      const invitesRes = await getMyInvitations().catch(() => null);
      setPendingInvitations(normalizeInvitationsResponse(invitesRes));
    } catch {
      setPendingInvitations([]);
    }

    if (!workspaceId || workspaceId === "undefined" || workspaceId === "null") {
      setData(null);
      setRealActivities([]);
      setLoading(false);
      return false;
    }

    setLoading(true);
    setError("");

    try {
      let rangeCode = "30d";

      if (dateRange === "Today") rangeCode = "today";
      else if (dateRange === "Last 7 Days") rangeCode = "7d";
      else if (dateRange === "This Month") rangeCode = "this_month";
      else if (dateRange === "This Year") rangeCode = "all";

      const [dashRes, actRes] = await Promise.all([
        getDashboard(workspaceId, rangeCode),
        getDashboardActivity(workspaceId).catch(() => []),
      ]);

      setData(normalizeDashboardResponse(dashRes));
      setRealActivities(normalizeArrayResponse(actRes));

      return true;
    } catch {
      setError("Failed to load dashboard data.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [workspaceId, dateRange]);

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    const success = await loadDashboard();

    if (success) {
      showSuccess("Dashboard refreshed successfully");
    } else {
      showError("Failed to refresh dashboard data");
    }

    setIsRefreshing(false);
  };

  const handleAcceptInvite = async (inviteId) => {
    setInvitationActionLoadingId(inviteId);
    try {
      await acceptInvitationById(inviteId);
      showSuccess("Invitation accepted!");
      window.location.reload();
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to accept invitation.");
    } finally {
      setInvitationActionLoadingId(null);
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    setInvitationActionLoadingId(inviteId);
    try {
      await declineInvitationById(inviteId);
      showSuccess("Invitation declined.");
      setPendingInvitations((prev) =>
        prev.filter((inv) => inv._id !== inviteId),
      );
    } catch (err) {
      showError(
        err?.response?.data?.message || "Failed to decline invitation.",
      );
    } finally {
      setInvitationActionLoadingId(null);
    }
  };

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

  const myTasks = Array.isArray(data?.myTasks) ? data.myTasks : [];
  const dueSoonTasks = Array.isArray(data?.dueSoonTasks)
    ? data.dueSoonTasks
    : [];

  const getChange = (current, previous) => {
    if (!previous || previous === 0) {
      return {
        text: "New",
        positive: true,
        label: "No previous data",
      };
    }

    const diff = current - previous;
    const percentage = Math.round((diff / previous) * 100);
    const positive = percentage >= 0;

    return {
      text: `${positive ? "+" : ""}${percentage}%`,
      positive,
      label: "vs previous 30 days",
    };
  };

  const projectChange = getChange(
    getNumber(stats.projects?.last30),
    getNumber(stats.projects?.prev30),
  );

  const activeTasksChange = getChange(
    getNumber(stats.tasks?.activeLast30),
    getNumber(stats.tasks?.activePrev30),
  );

  const completedTasksChange = getChange(
    getNumber(stats.tasks?.completedLast30),
    getNumber(stats.tasks?.completedPrev30),
  );

  const statCards = [
    {
      title: "Total Projects",
      value: getNumber(stats.projects?.total),
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
      value: Math.max(
        getNumber(stats.tasks?.total) - getNumber(stats.tasks?.done),
        0,
      ),
      change: activeTasksChange.text,
      changeLabel: activeTasksChange.label,
      positive: activeTasksChange.positive,
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
      icon: <CheckSquare size={18} strokeWidth={2} />,
      link: "/tasks",
    },
    {
      title: "Completed Tasks",
      value: getNumber(stats.tasks?.done),
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
      value: getNumber(stats.tasks?.overdue),
      change: "—",
      changeLabel: "Current total",
      positive: true,
      iconBg: "bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400",
      icon: <Clock size={18} strokeWidth={2} />,
      link: "/tasks",
    },
  ].filter((card) => {
    if (card.title === "Total Projects" && !settings.showProjectsCard) {
      return false;
    }

    if (card.title === "Active Tasks" && !settings.showActiveTasksCard) {
      return false;
    }

    if (card.title === "Completed Tasks" && !settings.showCompletedTasksCard) {
      return false;
    }

    if (card.title === "Overdue Tasks" && !settings.showOverdueTasksCard) {
      return false;
    }

    return true;
  });

  const chartBars = useMemo(() => {
    if (!Array.isArray(data?.tasksTrend) || data.tasksTrend.length === 0) {
      return [];
    }

    const maxCount = Math.max(
      ...data.tasksTrend.map((item) => getNumber(item?.count)),
      1,
    );

    const trendFormat = data.trendFormat || "daily";

    const bars = data.tasksTrend.map((item, index, arr) => {
      const count = getNumber(item?.count);
      let label = item?._id || "";
      let title = "";

      if (trendFormat === "status") {
        const statusMap = {
          todo: "To Do",
          in_progress: "In Progress",
          review: "Review",
          done: "Done",
          blocked: "Blocked",
        };

        label = statusMap[item?._id] || formatLabel(item?._id, "Unknown");
        title = `${label}: ${count} tasks`;
      } else if (trendFormat === "daily") {
        const date = new Date(item?._id);

        label = Number.isNaN(date.getTime()) ? "—" : date.getDate().toString();

        title = Number.isNaN(date.getTime())
          ? `${count} tasks`
          : `${date.toLocaleDateString()}: ${count} tasks`;
      } else if (trendFormat === "weekly") {
        const parts = String(item?._id || "").split("-");

        label = parts[1] ? `W${parts[1]}` : "—";
        title =
          parts[0] && parts[1]
            ? `Week ${parts[1]}, ${parts[0]}: ${count} tasks`
            : `${count} tasks`;
      } else if (trendFormat === "monthly") {
        const date = new Date(`${item?._id}-01T00:00:00Z`);

        label = Number.isNaN(date.getTime())
          ? "—"
          : date.toLocaleString("default", { month: "short" });

        title = Number.isNaN(date.getTime())
          ? `${count} tasks`
          : `${date.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}: ${count} tasks`;
      }

      return {
        label,
        title,
        value: count,
        height: (count / maxCount) * 100,
        highlighted: index === arr.length - 1,
      };
    });

    if (trendFormat === "daily") return bars.slice(-14);
    if (trendFormat === "weekly") return bars.slice(-12);
    if (trendFormat === "monthly") return bars.slice(-12);

    return bars;
  }, [data]);

  const maxChartValue = useMemo(() => {
    if (!Array.isArray(data?.tasksTrend) || data.tasksTrend.length === 0) {
      return 0;
    }

    return Math.max(...data.tasksTrend.map((item) => getNumber(item?.count)));
  }, [data]);

  const activities = useMemo(() => {
    if (!Array.isArray(realActivities) || realActivities.length === 0) {
      return [];
    }

    return realActivities.map((activity) => {
      let icon = <CheckSquare size={14} />;
      let color = "text-blue-500 bg-blue-50 dark:bg-blue-500/10";
      let link = "/dashboard";

      if (activity.type === "project_created") {
        icon = <FolderOpen size={14} />;
        color = "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10";
        link = activity.relatedId
          ? `/projects/${activity.relatedId}`
          : "/projects";
      } else if (activity.type === "task_completed") {
        icon = <CheckCircle2 size={14} />;
        color = "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10";
        link = activity.relatedId ? `/tasks/${activity.relatedId}` : "/tasks";
      } else if (activity.type === "task_created") {
        icon = <CheckSquare size={14} />;
        color = "text-blue-500 bg-blue-50 dark:bg-blue-500/10";
        link = activity.relatedId ? `/tasks/${activity.relatedId}` : "/tasks";
      } else if (activity.type === "client_created") {
        icon = <Users size={14} />;
        color = "text-amber-500 bg-amber-50 dark:bg-amber-500/10";
        link = "/clients";
      }

      return {
        id: activity._id || activity.id || `${activity.type}-${activity.date}`,
        title: activity.title || "Activity update",
        desc: activity.description || "",
        date: activity.date ? new Date(activity.date) : new Date(0),
        time: getSafeDateLabel(activity.date),
        icon,
        color,
        link,
      };
    });
  }, [realActivities]);

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

        const title = String(activity.title || "").toLowerCase();
        const desc = String(activity.desc || "").toLowerCase();

        return title.includes(search) || desc.includes(search);
      })
      .slice(0, settings.activityCount || 5);
  }, [activities, activeTab, activitySearch, settings.activityCount]);

  const filteredRecentProjects = useMemo(() => {
    const recentProjects = Array.isArray(data?.recentProjects)
      ? data.recentProjects
      : [];

    return recentProjects.filter((project) => {
      if (projectFilter === "active") {
        return (
          project?.status === "active" || project?.status === "in_progress"
        );
      }

      if (projectFilter === "completed") {
        return project?.status === "completed";
      }

      return true;
    });
  }, [data, projectFilter]);

  const handleExportReport = () => {
    try {
      exportDashboardPdf({
        workspaceName: workspace?.name,
        selectedRange: dateRange,
        user,
        stats,
        trendData: data?.tasksTrend,
        trendFormat: data?.trendFormat,
        activities,
        recentProjects: Array.isArray(data?.recentProjects)
          ? data.recentProjects
          : [],
        myTasks,
        dueSoonTasks,
      });

      showSuccess("Dashboard PDF report exported");
    } catch {
      showError("Failed to export dashboard report");
    }
  };

  const renderPendingInvitations = () => {
    if (pendingInvitations.length === 0) return null;

    return (
      <div className="mb-8 space-y-4">
        <h3 className="text-[16px] font-bold tracking-tight text-slate-900 dark:text-white">
          Pending Workspace Invitations
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pendingInvitations.map((invite) => (
            <div
              key={invite._id}
              className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                  <Building size={20} />
                </div>
                <div className="truncate">
                  <h4 className="truncate text-[14px] font-bold text-slate-900 dark:text-white">
                    {invite.workspace?.name}
                  </h4>
                  <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">
                    Invited by {invite.invitedBy?.name}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300">
                  Role: <strong className="capitalize">{invite.role}</strong>
                </span>
                {invite.expiresAt && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAcceptInvite(invite._id)}
                  disabled={invitationActionLoadingId === invite._id}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-[13px] font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  <Check size={14} /> Accept
                </button>
                <button
                  type="button"
                  onClick={() => handleDeclineInvite(invite._id)}
                  disabled={invitationActionLoadingId === invite._id}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/50"
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

  if (!workspace) {
    return (
      <DashboardLayout>
        {renderPendingInvitations()}
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

  const normalizedRole = (memberRole || "").toLowerCase();

  const canCreateTask = ["owner", "admin", "member"].includes(normalizedRole);
  const canCreateProject = ["owner", "admin"].includes(normalizedRole);
  const canCreateClient = ["owner", "admin"].includes(normalizedRole);
  const canInviteMember = normalizedRole === "owner";

  const formatTick = (val) => {
    if (maxChartValue < 4) {
      if (val === 0 || val === maxChartValue) return val;
      return val.toFixed(1);
    }
    return Math.round(val);
  };

  return (
    <DashboardLayout>
      {renderPendingInvitations()}

      <header className="mb-4 sm:mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="hidden sm:flex mb-3 items-center gap-2 text-[12px] font-medium text-slate-500 dark:text-slate-400">
            <span className="cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
              Home
            </span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-900 dark:text-white">Dashboard</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hello, {user?.name || "Roy Eid"} 👋
          </h2>

          <p className="mt-1 text-[13px] sm:text-[14px] text-slate-500 dark:text-slate-400">
            Here are the latest insights from your workspace activity in{" "}
            {workspace?.name || "this workspace"}.
          </p>
        </div>

        <div className="flex flex-col gap-3.5 w-full lg:w-auto sm:flex-row sm:items-center">
          {/* Row 1 for mobile (Bell, Settings, Menu) */}
          <div className="flex items-center justify-end gap-2.5 sm:gap-3 w-full sm:w-auto order-1 sm:order-2">
            <NotificationDropdown
              onOpenSettings={() => setIsNotificationSettingsOpen(true)}
            />

            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-300 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98] dark:border-slate-700/80 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <SettingsIcon
                size={18}
                className="transition-transform group-hover:animate-spin-soft"
              />
            </button>

            <AppDropdown
              align="right"
              trigger={() => (
                <button
                  type="button"
                  disabled={isRefreshing}
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800/80 dark:hover:text-slate-200"
                >
                  {isRefreshing ? (
                    <RefreshCw
                      size={16}
                      className="animate-spin text-indigo-500"
                    />
                  ) : (
                    <MoreHorizontal size={18} />
                  )}
                </button>
              )}
            >
              <AppDropdown.Item onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${
                    isRefreshing ? "animate-spin text-indigo-500" : ""
                  }`}
                />
                {isRefreshing ? "Refreshing..." : "Refresh dashboard"}
              </AppDropdown.Item>

              <AppDropdown.Item
                onClick={handleExportReport}
                disabled={isRefreshing}
              >
                <Download className="mr-2 h-4 w-4" />
                Export report
              </AppDropdown.Item>

              <AppDropdown.Item
                onClick={() => setIsSettingsModalOpen(true)}
                disabled={isRefreshing}
              >
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </AppDropdown.Item>
            </AppDropdown>
          </div>

          {/* Row 2 for mobile / Inline Today/DateRange for desktop */}
          <div className="w-full sm:w-auto order-2 sm:order-1 flex">
            <AppDropdown
              align="right"
              containerClassName="w-full sm:w-auto flex-1 sm:flex-initial"
              trigger={({ open }) => (
                <div
                  role="button"
                  tabIndex={0}
                  className={`group flex w-full sm:w-auto h-10 cursor-pointer items-center justify-between sm:justify-start gap-2 whitespace-nowrap rounded-xl border px-4 text-[13px] font-medium transition-all duration-300 active:scale-[0.98] ${
                    open
                      ? "border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar
                      size={16}
                      className="text-slate-400 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110"
                    />
                    <span>{dateRange}</span>
                  </div>
                  <ChevronDown size={14} className="text-slate-400 sm:hidden" />
                </div>
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
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <section className="mb-4 sm:mb-6 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3 animate-fade-in-up stagger-1">
        {canCreateTask && (
          <div className="col-span-2 sm:col-span-1">
            <button
              type="button"
              onClick={() => navigate("/tasks")}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs sm:text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-95 dark:bg-indigo-500 dark:hover:bg-indigo-600 h-10"
            >
              <Plus size={14} className="shrink-0" />
              New Task
            </button>
          </div>
        )}

        {canCreateProject && (
          <div className="col-span-1">
            <button
              type="button"
              onClick={() => navigate("/projects")}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-[13px] font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 h-10"
            >
              <FolderOpen size={14} className="shrink-0" />
              New Project
            </button>
          </div>
        )}

        {canCreateClient && (
          <div className="col-span-1">
            <button
              type="button"
              onClick={() => navigate("/clients")}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-[13px] font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 h-10"
            >
              <Briefcase size={14} className="shrink-0" />
              New Client
            </button>
          </div>
        )}

        {canInviteMember && (
          <div className="col-span-2 sm:col-span-1">
            <button
              type="button"
              onClick={() => navigate("/members")}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-[13px] font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 h-10"
            >
              <UserPlus size={14} className="shrink-0" />
              Invite Member
            </button>
          </div>
        )}
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-fade-in-up stagger-2">
        {statCards.map((card, index) => (
          <Link
            to={card.link}
            key={card.title}
            className={`group block w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-slate-700 animate-fade-in-up stagger-${
              (index % 5) + 1
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  {card.title}
                </p>

                <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  <AnimatedNumber value={card.value} />
                </h3>
              </div>

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-sm ${card.iconBg}`}
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
        {settings.showTrendChart && (
          <div
            className={`rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 animate-fade-in-up stagger-3 ${
              settings.showLatestUpdates ? "xl:col-span-2" : "xl:col-span-3"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
                  Task Volume Trend
                </h3>

                <div className="mt-1.5 flex flex-wrap items-center gap-3">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    <AnimatedNumber value={getNumber(stats.tasks?.newLast30)} />{" "}
                    <span className="text-xs font-normal text-slate-500">
                      Total
                    </span>
                  </span>

                  <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-500">
                    <span
                      className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800"
                      title="Created in period"
                    >
                      +{getNumber(stats.tasks?.newLast30)} Created
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                      {getNumber(stats.tasks?.completedLast30)} Completed
                    </span>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                      {getNumber(stats.tasks?.inProgress)} In Progress
                    </span>
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                      {getNumber(stats.tasks?.overdue)} Overdue
                    </span>
                  </div>
                </div>
              </div>

              <AppDropdown
                containerClassName="w-full sm:w-auto"
                trigger={() => (
                  <button
                    type="button"
                    className="flex h-10 w-full sm:w-auto sm:h-9 items-center justify-between gap-3 rounded-xl sm:rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/80 lg:w-44"
                  >
                    {dateRange}
                    <ChevronUp className="h-4 w-4 rotate-180 text-slate-400" />
                  </button>
                )}
              >
                {dateRanges.map((range) => (
                  <AppDropdown.Item
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={
                      dateRange === range
                        ? "bg-slate-50 dark:bg-slate-800/50"
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
                <span>{formatTick(maxChartValue)}</span>
                <span>{formatTick(maxChartValue * 0.75)}</span>
                <span>{formatTick(maxChartValue * 0.5)}</span>
                <span>{formatTick(maxChartValue * 0.25)}</span>
                <span>0</span>
              </div>

              <div
                className="pointer-events-none absolute left-0 right-8 border-t border-dashed border-slate-200 dark:border-slate-800"
                style={{ top: "40%" }}
              />

              <div className="flex h-48 sm:h-60 items-end gap-1 sm:gap-2 pr-8 sm:pr-10 md:gap-4">
                {chartBars.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-lg bg-slate-50/80 px-4 py-2 text-[13px] font-medium text-slate-500 dark:bg-slate-900/80 dark:text-slate-400">
                      No task activity found for this period.
                    </span>
                  </div>
                ) : (
                  chartBars.map((bar, index) => (
                    <div
                      key={`${bar.label}-${index}`}
                      title={bar.title}
                      className="group relative flex flex-1 cursor-pointer justify-center"
                      style={{ height: `${bar.height}%` }}
                    >
                      {bar.highlighted && (
                        <div className="absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-white dark:text-slate-900">
                          {bar.value} Tasks
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-white" />
                        </div>
                      )}

                      <div
                        className={`h-full w-full max-w-[40px] rounded-t-md transition-all duration-700 ease-out ${
                          bar.highlighted
                            ? "bg-indigo-500 dark:bg-indigo-500"
                            : "bg-slate-100 group-hover:bg-indigo-300 dark:bg-slate-800 dark:group-hover:bg-indigo-500/60"
                        }`}
                        style={{
                          height: "100%",
                          transformOrigin: "bottom",
                          animation:
                            "grow-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards",
                          animationDelay: `${index * 20}ms`,
                        }}
                      />
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 flex gap-1 sm:gap-2 pr-8 sm:pr-10 md:gap-4">
                {chartBars.map((bar, index) => (
                  <div
                    key={`${bar.label}-label-${index}`}
                    className="flex-1 truncate text-center text-[9px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500"
                    title={bar.title}
                  >
                    {bar.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {settings.showLatestUpdates && (
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900 animate-fade-in-up stagger-4">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 dark:border-slate-800/60">
              <h3 className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white truncate pr-2">
                Latest Updates
              </h3>
              <input
                type="text"
                placeholder="Search..."
                value={activitySearch}
                onChange={(event) => setActivitySearch(event.target.value)}
                className="h-8 w-28 sm:w-36 rounded-md border border-slate-200 bg-slate-50 px-2 text-[12px] text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:focus:border-indigo-500 dark:focus:bg-slate-900 shrink-0"
              />
            </div>

            <div className="border-b border-slate-100 dark:border-slate-800/60 px-4 sm:px-5 pt-3">
              <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth">
                {tabs.map((tab) => (
                  <button
                    type="button"
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative pb-3 text-[13px] font-medium transition-colors shrink-0 ${
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
              </div>
            </div>

            <div className="flex-1 p-5">
              <div className="space-y-2">
                {latestUpdates.length === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
                    <div className="mb-3 rounded-full bg-slate-100 p-3 dark:bg-slate-800">
                      <Calendar size={20} />
                    </div>
                    <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                      No activity found
                    </p>
                    <p className="text-[12px]">
                      {activitySearch
                        ? `No matching activity found for "${activitySearch}"`
                        : "No activity found for this period."}
                    </p>
                  </div>
                ) : (
                  latestUpdates.map((update, index) => (
                    <Link
                      to={update.link || "#"}
                      key={update.id}
                      className={`group flex cursor-pointer gap-4 rounded-xl p-3 transition-colors duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 animate-fade-in-up stagger-${
                        (index % 5) + 1
                      }`}
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

              <div className="border-t border-slate-100 p-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(true)}
                  className="w-full rounded-lg px-4 py-2.5 text-[13px] font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                >
                  View all activity →
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900 animate-fade-in-up stagger-5">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800/60">
            <h3 className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
              My Tasks
            </h3>
            <Link
              to="/tasks"
              className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              View all →
            </Link>
          </div>

          <div className="p-0">
            {myTasks.length > 0 ? (
              <div className="flex flex-col">
                {myTasks.map((task) => (
                  <Link
                    key={task._id || task.id || task.title}
                    to="/tasks"
                    className="flex flex-col gap-2 border-b border-slate-100 p-5 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/50"
                  >
                    <div className="flex items-center justify-between">
                      <p className="truncate pr-4 text-[13px] font-semibold text-slate-900 dark:text-white">
                        {task.title || "Untitled task"}
                      </p>
                      <Badge
                        variant={
                          task.priority === "high"
                            ? "danger"
                            : task.priority === "medium"
                              ? "warning"
                              : "default"
                        }
                      >
                        {task.priority || "normal"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-[12px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <CheckSquare size={14} />
                        {formatLabel(task.status, "No status")}
                      </span>

                      {task.project && (
                        <span className="flex items-center gap-1">
                          <FolderOpen size={14} />
                          {task.project.name || "Project"}
                        </span>
                      )}

                      <span className="ml-auto flex items-center gap-1">
                        <Clock size={14} />
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : "No due date"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex h-32 flex-col items-center justify-center text-slate-500">
                <CheckCircle2
                  size={24}
                  className="mb-2 text-slate-300 dark:text-slate-600"
                />
                <p className="text-[13px]">No tasks assigned to you.</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900 animate-fade-in-up stagger-5">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800/60">
            <h3 className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
              Due Soon
            </h3>
            <Link
              to="/tasks"
              className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              View all →
            </Link>
          </div>

          <div className="p-0">
            {dueSoonTasks.length > 0 ? (
              <div className="flex flex-col">
                {dueSoonTasks.map((task) => {
                  const dueTime = task.dueDate
                    ? new Date(task.dueDate).getTime()
                    : null;

                  const isDueSoon =
                    dueTime &&
                    dueTime - new Date().getTime() <= 2 * 24 * 60 * 60 * 1000;

                  return (
                    <Link
                      key={task._id || task.id || task.title}
                      to="/tasks"
                      className="flex flex-col gap-2 border-b border-slate-100 p-5 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/50"
                    >
                      <div className="flex items-center justify-between">
                        <p className="truncate pr-4 text-[13px] font-semibold text-slate-900 dark:text-white">
                          {task.title || "Untitled task"}
                        </p>
                        <span
                          className={`text-[12px] font-medium ${
                            isDueSoon
                              ? "text-red-600 dark:text-red-400"
                              : "text-slate-500"
                          }`}
                        >
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString()
                            : "No due date"}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-[12px] text-slate-500">
                        {task.assignee && (
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {getFirstName(task.assignee.name)}
                          </span>
                        )}

                        <span className="flex items-center gap-1">
                          <CheckSquare size={14} />
                          {formatLabel(task.status, "No status")}
                        </span>

                        <Badge
                          variant={
                            task.priority === "high"
                              ? "danger"
                              : task.priority === "medium"
                                ? "warning"
                                : "default"
                          }
                          className="ml-auto"
                        >
                          {task.priority || "normal"}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-32 flex-col items-center justify-center text-slate-500">
                <Calendar
                  size={24}
                  className="mb-2 text-slate-300 dark:text-slate-600"
                />
                <p className="text-[13px]">No tasks due soon.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {settings.showRecentProjects && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900 animate-fade-in-up stagger-5">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800/60">
            <h3 className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
              Recent Projects
            </h3>

            <div className="flex items-center gap-3">
              <AppDropdown
                trigger={({ open }) => (
                  <div
                    role="button"
                    tabIndex={0}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all duration-300 active:scale-[0.98] ${
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
                  </div>
                )}
              >
                <AppDropdown.Item
                  onClick={() => setProjectFilter("all")}
                  className={
                    projectFilter === "all"
                      ? "bg-slate-50 dark:bg-slate-800"
                      : ""
                  }
                >
                  All Projects
                </AppDropdown.Item>

                <AppDropdown.Item
                  onClick={() => setProjectFilter("active")}
                  className={
                    projectFilter === "active"
                      ? "bg-slate-50 dark:bg-slate-800"
                      : ""
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

          <div>
            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {!filteredRecentProjects.length ? (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  No projects found.
                </div>
              ) : (
                filteredRecentProjects.map((project) => {
                  const projectId = project?._id || project?.id;

                  return (
                    <div
                      key={projectId || project?.name}
                      className="p-4 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          to={
                            projectId ? `/projects/${projectId}` : "/projects"
                          }
                          className="flex items-center gap-2 text-[13px] font-semibold text-slate-900 dark:text-slate-100 transition hover:text-indigo-600 dark:hover:text-indigo-400 truncate pr-2"
                        >
                          <Briefcase
                            size={14}
                            className="text-slate-400 shrink-0"
                          />
                          {project?.name || "Untitled Project"}
                        </Link>
                        <Badge variant={project?.status || "active"} />
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[12px] text-slate-500">
                        <div>
                          <span className="text-slate-400">Client:</span>{" "}
                          {project?.client?.name || "N/A"}
                        </div>
                        <Badge variant={project?.priority || "medium"} dot />
                      </div>

                      <div className="mt-1 flex justify-end text-[11px] text-slate-500 dark:text-slate-500">
                        Created {getSafeDateLabel(project?.createdAt)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block overflow-x-auto">
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
                              to={
                                projectId
                                  ? `/projects/${projectId}`
                                  : "/projects"
                              }
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
                            <Badge
                              variant={project?.priority || "medium"}
                              dot
                            />
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
          </div>
        </section>
      )}

      <NotificationSettingsModal
        open={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
      />

      <ActivityModal
        open={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        activities={activities}
      />

      <DashboardSettingsModal
        open={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={(newSettings) => {
          setSettings((prev) => ({ ...prev, ...newSettings }));

          if (newSettings.dateRange && newSettings.dateRange !== dateRange) {
            setDateRange(newSettings.dateRange);
          }
        }}
      />
    </DashboardLayout>
  );
}

export default Dashboard;
