import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router";
import useAuth from "../context/useAuth";
import useWorkspace from "../context/useWorkspace";
import AppDropdown from "../components/ui/AppDropdown";
import CommandPalette from "../components/CommandPalette";
import ComingSoonModal from "../components/ComingSoonModal";

import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Users,
  Settings,
  HelpCircle,
  Search,
  Sun,
  Moon,
  LogOut,
  ChevronUp,
  Menu,
  X,
  Building2,
  Pin,
  MessageSquare,
} from "lucide-react";

/* ── Navigation Config ────────────────────────────────────────────── */

const navSections = [
  {
    label: "MAIN NAVIGATION",
    items: [
      {
        to: "/dashboard",
        label: "Overview",
        icon: LayoutDashboard,
        hoverClass: "group-hover:scale-110 group-active:scale-95",
      },
      {
        to: "/projects",
        label: "Projects",
        icon: FolderOpen,
        hoverClass: "group-hover:translate-x-1 group-active:scale-95",
      },
      {
        to: "/tasks",
        label: "Tasks",
        icon: CheckSquare,
        hoverClass:
          "group-hover:scale-110 group-hover:rotate-3 group-active:scale-95",
      },
      {
        to: "/clients",
        label: "Clients",
        icon: Users,
        hoverClass: "group-hover:scale-110 group-active:scale-95",
      },
      {
        to: "/workspaces",
        label: "Workspaces",
        icon: Building2,
        hoverClass: "group-hover:scale-110 group-active:scale-95",
      },
      {
        to: "/members",
        label: "Members",
        icon: Users,
        hoverClass: "group-hover:scale-110 group-active:scale-95",
      },
    ],
  },
  {
    label: "SUPPORT",
    items: [
      {
        to: "/settings",
        label: "Settings",
        icon: Settings,
        hoverClass: "group-hover:animate-spin-soft group-active:scale-95",
      },
      {
        to: "#",
        label: "Help & Support",
        icon: HelpCircle,
        hoverClass: "group-hover:scale-110 group-active:scale-95",
        action: "help",
      },
      {
        to: "#",
        label: "Feedback",
        icon: MessageSquare,
        hoverClass: "group-hover:scale-110 group-active:scale-95",
        action: "feedback",
      },
    ],
  },
];

/* ── DashboardLayout ──────────────────────────────────────────────── */

function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { workspace } = useWorkspace();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState(null);

  const [isPinned, setIsPinned] = useState(() => {
    return localStorage.getItem("sidebarPinned") === "true";
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const isExpanded = isPinned || isHovered || mobileOpen;
  const isCompact = !isExpanded && !mobileOpen;

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handlePinSidebar = () => {
    const nextValue = !isPinned;
    setIsPinned(nextValue);
    localStorage.setItem("sidebarPinned", nextValue.toString());
  };

  const handleSupportAction = (e, action) => {
    e.preventDefault();

    if (action === "help") {
      setComingSoonFeature("Help Center");
    }

    if (action === "feedback") {
      setComingSoonFeature("Feedback");
    }
  };

  const getNavLinkClass = ({ isActive }) => {
    const base =
      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-300 overflow-hidden whitespace-nowrap active:scale-[0.98] border";

    if (isActive) {
      if (isCompact) {
        return `${base} border-transparent bg-indigo-50/80 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400`;
      }

      return `${base} border-slate-200 bg-white text-indigo-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400`;
    }

    return `${base} border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200`;
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((namePart) => namePart[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  /* ── Sidebar Content ─────────────────────────────────────────── */

  const sidebarContent = (
    <div className="relative flex h-full flex-col bg-slate-50 dark:bg-slate-950/50">
      {/* Logo */}
      <div
        className={`flex min-w-0 items-center gap-3 pb-4 pt-5 transition-all duration-300 ${
          isCompact ? "px-[16px]" : "px-4"
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-sm dark:bg-indigo-500">
          TF
        </div>

        <div
          className={`min-w-0 flex-1 items-center justify-between gap-2 whitespace-nowrap transition-opacity duration-300 ${
            isCompact ? "hidden opacity-0" : "flex opacity-100"
          }`}
        >
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              TaskFlow Pro
            </h1>

            <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {workspace ? workspace.name : "Select Workspace"}
            </p>
          </div>

          <button
            type="button"
            onClick={handlePinSidebar}
            className={`hidden shrink-0 rounded-md p-1.5 transition-all duration-200 lg:flex ${
              isPinned
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                : "text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            }`}
            title={isPinned ? "Unpin sidebar" : "Pin sidebar open"}
          >
            <Pin
              size={15}
              className={`transition-transform duration-300 ${
                isPinned ? "rotate-45" : "rotate-0"
              }`}
            />
          </button>
        </div>

        {/* Mobile close */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="ml-auto shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 lg:hidden"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Search */}
      <div
        className={`pb-4 transition-all duration-300 ${
          isCompact ? "px-[16px]" : "px-4"
        }`}
      >
        <button
          type="button"
          onClick={() => setCmdOpen(true)}
          className="group/search relative w-full cursor-text text-left transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <span
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 transition-all duration-300 group-hover/search:scale-110 group-hover/search:text-slate-500 dark:group-hover/search:text-slate-300 ${
              isCompact ? "left-1/2 -translate-x-1/2" : "left-3"
            }`}
          >
            <Search size={16} />
          </span>

          <div
            className={`flex h-9 w-full items-center rounded-lg border text-[13px] transition-all duration-300 ${
              isCompact
                ? "border-transparent bg-transparent px-0 shadow-none hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                : "border-slate-200 bg-white pl-9 pr-14 text-slate-400 shadow-sm hover:border-slate-300 hover:shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-500 dark:hover:border-slate-600"
            }`}
          >
            <span
              className={`whitespace-nowrap transition-opacity duration-300 ${
                isCompact ? "hidden opacity-0" : "opacity-100"
              }`}
            >
              Search anything...
            </span>
          </div>

          <span
            className={`pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md border border-slate-100 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 shadow-sm transition-opacity duration-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 ${
              isCompact ? "hidden opacity-0" : "opacity-100"
            }`}
          >
            Ctrl K
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav
        className={`sidebar-scroll flex-1 space-y-6 overflow-y-auto overflow-x-hidden pb-4 pt-2 transition-all duration-300 ${
          isCompact ? "px-[14px]" : "px-4"
        }`}
      >
        {navSections.map((section) => (
          <div key={section.label}>
            <p
              className={`mb-3 whitespace-nowrap px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 transition-opacity duration-300 dark:text-slate-500 ${
                isCompact ? "hidden opacity-0" : "opacity-100"
              }`}
            >
              {section.label}
            </p>

            <div className="relative space-y-1">
              {section.items.map((item) =>
                item.action ? (
                  <a
                    key={item.label}
                    href="#"
                    className={getNavLinkClass({ isActive: false })}
                    onClick={(e) => handleSupportAction(e, item.action)}
                    title={isCompact ? item.label : undefined}
                  >
                    <div className="flex shrink-0 items-center justify-center">
                      <item.icon
                        size={18}
                        strokeWidth={2.2}
                        className={`transition-all duration-300 ${item.hoverClass}`}
                      />
                    </div>

                    <span
                      className={`transition-opacity duration-300 ${
                        isCompact ? "hidden opacity-0" : "opacity-100"
                      }`}
                    >
                      {item.label}
                    </span>
                  </a>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={getNavLinkClass}
                    onClick={() => setMobileOpen(false)}
                    title={isCompact ? item.label : undefined}
                  >
                    <div className="flex shrink-0 items-center justify-center">
                      <item.icon
                        size={18}
                        strokeWidth={2.2}
                        className={`transition-all duration-300 ${item.hoverClass}`}
                      />
                    </div>

                    <span
                      className={`transition-opacity duration-300 ${
                        isCompact ? "hidden opacity-0" : "opacity-100"
                      }`}
                    >
                      {item.label}
                    </span>
                  </NavLink>
                )
              )}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div
        className={`mt-auto border-t border-slate-200/60 transition-all duration-300 dark:border-slate-800/60 ${
          isCompact ? "p-[14px]" : "p-4"
        }`}
      >
        <AppDropdown
          align="left"
          direction="up"
          containerClassName="w-full"
          trigger={({ open }) => (
            <div
              className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl transition-all duration-300 active:scale-[0.98] ${
                isCompact
                  ? "justify-center border-transparent bg-transparent p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                  : open
                  ? "border border-slate-300 bg-slate-50 p-2 shadow-sm dark:border-slate-600 dark:bg-slate-800"
                  : "border border-slate-200 bg-white p-2 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900 dark:hover:border-slate-600"
              }`}
            >
              <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-105">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-[11px] font-bold text-indigo-700 transition-colors duration-300 group-hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-300 dark:group-hover:bg-indigo-500/30">
                  {userInitials}
                </div>

                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
              </div>

              <div
                className={`min-w-0 flex-1 whitespace-nowrap transition-opacity duration-300 ${
                  isCompact ? "hidden opacity-0" : "opacity-100"
                }`}
              >
                <p className="truncate text-[13px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
                  {user?.name || "User"}
                </p>

                <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {user?.email || "user@taskflow.io"}
                </p>
              </div>

              <span
                className={`shrink-0 text-slate-400 transition-opacity duration-300 dark:text-slate-500 ${
                  isCompact ? "hidden opacity-0" : "opacity-100"
                } ${open ? "rotate-180" : ""}`}
              >
                <ChevronUp size={14} />
              </span>
            </div>
          )}
        >
          <div className="mb-1 flex items-center gap-3 px-3 py-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[13px] font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              {userInitials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold leading-tight text-slate-900 dark:text-white">
                {user?.name || "User"}
              </p>

              <p className="mt-0.5 truncate text-[12px] text-slate-500 dark:text-slate-400">
                {user?.email || "user@taskflow.io"}
              </p>
            </div>
          </div>

          <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

          <AppDropdown.Item onClick={() => navigate("/settings")}>
            <Settings size={15} />
            <span className="ml-2">View Profile / Settings</span>
          </AppDropdown.Item>

          <AppDropdown.Item
            onClick={() => {
              navigate("/settings");

              setTimeout(() => {
                const el = document.getElementById("change-password-section");

                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }, 100);
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>

            <span className="ml-2">Change Password</span>
          </AppDropdown.Item>

          <AppDropdown.Item onClick={() => setIsDarkMode((prev) => !prev)}>
            {isDarkMode ? (
              <>
                <Sun size={15} />
                <span className="ml-2">Switch to Light Mode</span>
              </>
            ) : (
              <>
                <Moon size={15} />
                <span className="ml-2">Switch to Dark Mode</span>
              </>
            )}
          </AppDropdown.Item>

          <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

          <AppDropdown.Item
            onClick={handleLogout}
            className="text-red-600 hover:!bg-red-50 dark:text-red-400 dark:hover:!bg-red-950/30"
          >
            <LogOut size={15} />
            <span className="ml-2">Logout</span>
          </AppDropdown.Item>
        </AppDropdown>
      </div>
    </div>
  );

  /* ── Render ──────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="relative flex min-h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <aside
          className={`absolute z-40 hidden h-full shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-slate-50 transition-[width,box-shadow,border-color] duration-300 ease-in-out dark:border-slate-800/80 dark:bg-slate-950 lg:flex ${
            isCompact
              ? "w-[68px]"
              : "w-[260px] border-transparent shadow-2xl dark:border-transparent lg:shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:lg:shadow-[4px_0_24px_rgba(0,0,0,0.4)]"
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {sidebarContent}
        </aside>

        {/* Spacer for main content when sidebar is absolute */}
        <div
          className={`hidden shrink-0 transition-[width] duration-300 ease-in-out lg:block ${
            isPinned ? "w-[260px]" : "w-[68px]"
          }`}
        />

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <>
            <button
              type="button"
              aria-label="Close sidebar overlay"
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />

            <aside className="fixed inset-y-0 left-0 z-50 w-[280px] bg-slate-50 shadow-2xl dark:bg-slate-950 lg:hidden">
              {sidebarContent}
            </aside>
          </>
        )}

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile header */}
          <div className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white dark:bg-indigo-500">
              TF
            </div>

            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              TaskFlow Pro
            </span>
          </div>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>

      <CommandPalette open={cmdOpen} setOpen={setCmdOpen} />

      <ComingSoonModal 
        open={!!comingSoonFeature} 
        onClose={() => setComingSoonFeature(null)} 
        featureName={comingSoonFeature} 
      />
    </div>
  );
}

export default DashboardLayout;