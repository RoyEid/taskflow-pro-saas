import { useEffect, useState, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import useAuth from "../context/useAuth";
import useTheme from "../context/useTheme";
import useWorkspace from "../context/useWorkspace";
import useChatSocket from "../context/useChatSocket";
import { getChatUnreadCount } from "../services/chatService";
import AppBackground from "../components/ui3d/AppBackground";
import { easeOutFast, springSoft } from "../components/ui3d/motionTokens";

import AppDropdown from "../components/ui/AppDropdown";
import BrandLogo from "../components/ui/BrandLogo";
import ComingSoonModal from "../components/ComingSoonModal";
import GlobalSearchModal from "../components/GlobalSearchModal";
import TaskFlowAssistant from "../components/TaskFlowAssistant";
import WorkspaceSwitcher from "../components/WorkspaceSwitcher";

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
        label: "Dashboard",
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
      {
        to: "/chat",
        label: "Chat",
        icon: MessageSquare,
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
        to: "/help",
        label: "Help & Support",
        icon: HelpCircle,
        hoverClass: "group-hover:scale-110 group-active:scale-95",
      },
      {
        to: "/feedback",
        label: "Feedback",
        icon: MessageSquare,
        hoverClass: "group-hover:scale-110 group-active:scale-95",
      },
    ],
  },
];

/* ── DashboardLayout ──────────────────────────────────────────────── */

function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { workspaces, workspaceId } = useWorkspace();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState(null);
  const { unreadCounts, setUnreadCount: setGlobalUnreadCount } = useChatSocket();
  const chatUnreadCount = unreadCounts[workspaceId] || 0;

  const touchStart = useRef({ x: 0, y: 0 });
  const touchDelta = useRef({ x: 0, y: 0 });
  const mobileDrawerRef = useRef(null);
  const mobileTriggerRef = useRef(null);

  const handleTouchStart = (e) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    touchDelta.current = { x: 0, y: 0 };
  };

  const handleTouchMove = (e) => {
    touchDelta.current = {
      x: e.touches[0].clientX - touchStart.current.x,
      y: e.touches[0].clientY - touchStart.current.y,
    };
  };

  const handleTouchEnd = () => {
    const { x, y } = touchDelta.current;
    // Check if swipe is horizontal enough and to the left (X is negative and below -50px)
    // Using a ratio of 2.5 ensures vertical scrolling won't accidentally close the sidebar
    if (x < -50 && Math.abs(x) > Math.abs(y) * 2.5) {
      setMobileOpen(false);
    }
  };

  const userWorkspaces = workspaces;

  const [isPinned, setIsPinned] = useState(() => {
    return localStorage.getItem("sidebarPinned") === "true";
  });

  const { isDarkMode, toggleTheme } = useTheme();

  const isExpanded = isPinned || isHovered || mobileOpen;
  const isCompact = !isExpanded && !mobileOpen;

  const [isWorkspacePanelOpen, setIsWorkspacePanelOpen] = useState(false);

  useEffect(() => {
    if (isCompact) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsWorkspacePanelOpen(false);
    }
  }, [isCompact]);

  useEffect(() => {
    let cancelled = false;

    async function loadChatUnreadCount() {
      if (!workspaceId) {
        setGlobalUnreadCount(workspaceId, 0);
        return;
      }

      try {
        const data = await getChatUnreadCount(workspaceId);

        if (!cancelled) {
          setGlobalUnreadCount(workspaceId, data?.unreadCount || 0);
        }
      } catch {
        if (!cancelled) {
          setGlobalUnreadCount(workspaceId, 0);
        }
      }
    }

    loadChatUnreadCount();

    window.addEventListener("focus", loadChatUnreadCount);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadChatUnreadCount);
    };
  }, [workspaceId, location.pathname, setGlobalUnreadCount]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const focusTimer = window.setTimeout(() => {
      mobileDrawerRef.current
        ?.querySelector("button, a[href], input, [tabindex]:not([tabindex='-1'])")
        ?.focus();
    }, 0);

    document.body.style.overflow = "hidden";

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);

      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [mobileOpen]);

  const trapMobileDrawerFocus = (event) => {
    if (event.key !== "Tab" || !mobileDrawerRef.current) return;

    const focusableElements = Array.from(
      mobileDrawerRef.current.querySelectorAll(
        "button:not(:disabled), a[href], input:not(:disabled), [tabindex]:not([tabindex='-1'])"
      )
    ).filter((element) => element.getClientRects().length > 0);

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  /* Global hotkey for search (Ctrl+K or Cmd+K) */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handlePinSidebar = () => {
    const nextValue = !isPinned;
    setIsPinned(nextValue);
    localStorage.setItem("sidebarPinned", nextValue.toString());
  };

  const getNavLinkClass = ({ isActive }) => {
    const base = `tf-nav-item group relative w-full overflow-visible whitespace-nowrap ${
      isCompact ? "justify-center px-0" : ""
    }`;

    return isActive ? `${base} tf-text font-semibold` : base;
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

  const renderSidebar = (instanceId) => (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden">
      {/* Logo / Header */}
      <div
        className={`relative flex min-w-0 shrink-0 items-start justify-between gap-1.5 pb-4 pt-5 transition-all duration-300 ${
          isCompact ? "px-2" : "px-3.5"
        }`}
      >
        <WorkspaceSwitcher
          userWorkspaces={userWorkspaces}
          isCompact={isCompact}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          isOpen={isWorkspacePanelOpen}
          setIsOpen={setIsWorkspacePanelOpen}
          onExpandSidebar={() => setIsPinned(true)}
        />

        <div className="relative z-50 flex shrink-0 items-center gap-1 pt-0.5">
          {instanceId === "desktop" && !isCompact && (
            <button
              type="button"
              onClick={handlePinSidebar}
              className={`tf-btn-icon tf-size-sm ${
                isPinned ? "tf-bg-3 tf-text-accent" : ""
              }`}
              title={isPinned ? "Unpin sidebar" : "Pin sidebar open"}
              aria-pressed={isPinned}
              aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar open"}
            >
              <Pin
                size={15}
                className={`transition-transform duration-300 ${
                  isPinned ? "rotate-45" : "rotate-0"
                }`}
              />
            </button>
          )}

          {instanceId === "mobile" && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMobileOpen(false);
                setIsWorkspacePanelOpen(false);
              }}
              className="tf-btn-icon tf-size-sm relative z-50 cursor-pointer active:scale-95"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div
        className={`pb-4 shrink-0 transition-all duration-300 ${
          isCompact ? "px-[16px]" : "px-4"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="group/search relative w-full cursor-text text-left transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <span
            className={`tf-text-subtle pointer-events-none absolute top-1/2 -translate-y-1/2 transition-all duration-300 group-hover/search:scale-110 ${
              isCompact ? "left-1/2 -translate-x-1/2" : "left-3"
            }`}
          >
            <Search size={16} />
          </span>

          <div
            className={`tf-text-subtle flex h-9 w-full cursor-pointer items-center rounded-[var(--tf-r-md)] border text-[13px] transition-all duration-300 ${
              isCompact
                ? "tf-bg-3/0 border-transparent bg-transparent px-0 shadow-none hover:bg-[var(--tf-bg-3)]"
                : "tf-bd tf-bg-2 pl-9 pr-14 hover:border-[var(--tf-border-strong)]"
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
            className={`tf-bd tf-bg-3 tf-text-muted pointer-events-none right-1.5 top-1/2 hidden -translate-y-1/2 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition-opacity duration-300 lg:absolute lg:inline-flex ${
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
              className={`tf-eyebrow mb-2.5 whitespace-nowrap px-2 transition-opacity duration-300 ${
                isCompact ? "hidden opacity-0" : "opacity-100"
              }`}
            >
              {section.label}
            </p>

            <div className="relative space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={getNavLinkClass}
                  onClick={() => {
                    setMobileOpen(false);
                    setIsWorkspacePanelOpen(false);
                  }}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId={`tf-nav-active-${instanceId}`}
                          transition={{ type: "spring", stiffness: 380, damping: 34 }}
                          aria-hidden="true"
                          className="tf-bg-3 absolute inset-0 -z-10 rounded-[var(--tf-r-md)]"
                          style={{ boxShadow: "inset 3px 0 0 var(--tf-accent)" }}
                        />
                      )}

                      <div className="relative flex shrink-0 items-center justify-center">
                        <item.icon
                          size={18}
                          strokeWidth={2.2}
                          className={`transition-all duration-300 ${item.hoverClass}`}
                        />
                        {isCompact && item.to === "/chat" && chatUnreadCount > 0 && (
                          <span
                            className="absolute top-0 right-0 -translate-y-1 translate-x-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--tf-error-dot)] px-1 text-[9px] font-bold leading-none text-white shadow-sm ring-2 ring-[var(--tf-bg-sidebar)]"
                          >
                            {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                          </span>
                        )}
                      </div>

                      <span
                        className={`transition-opacity duration-300 ${
                          isCompact ? "hidden opacity-0" : "opacity-100"
                        }`}
                      >
                        {item.label}
                      </span>

                      {!isCompact && item.to === "/chat" && chatUnreadCount > 0 && (
                        <span
                          className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--tf-error-dot)] px-1.5 text-[10px] font-bold leading-none text-white shadow-sm"
                        >
                          {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                        </span>
                      )}

                      {isCompact && (
                        <div className="sidebar-tooltip">{item.label}</div>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div
        className={`tf-bd mt-auto shrink-0 border-t transition-all duration-300 ${
          isCompact ? "p-[14px]" : "p-4"
        }`}
        style={{ paddingBottom: isCompact ? undefined : 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <AppDropdown
          align="left"
          direction="up"
          containerClassName="w-full"
          trigger={({ open }) => (
            <div
              className={`group flex w-full cursor-pointer items-center gap-3 rounded-[var(--tf-r-md)] border transition-all duration-300 active:scale-[0.98] ${
                isCompact
                  ? "justify-center border-transparent bg-transparent p-2 hover:bg-[var(--tf-bg-3)]"
                  : open
                    ? "tf-bd-strong tf-bg-2 p-2"
                    : "tf-bd tf-bg-1 p-2 hover:border-[var(--tf-border-strong)] hover:bg-[var(--tf-bg-2)]"
              }`}
            >
              <div className="relative shrink-0 transition-all duration-300 group-hover:scale-105">
                <div className="tf-bg-3 tf-text flex h-8 w-8 items-center justify-center rounded-[var(--tf-r-sm)] text-[11px] font-bold">
                  {userInitials}
                </div>

                <div
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
                  style={{
                    backgroundColor: "var(--tf-success-dot)",
                    borderColor: "var(--tf-bg-1)",
                  }}
                />
              </div>

              <div
                className={`min-w-0 flex-1 whitespace-nowrap transition-opacity duration-300 ${
                  isCompact ? "hidden opacity-0" : "opacity-100"
                }`}
              >
                <p className="tf-text truncate text-[13px] font-semibold leading-tight">
                  {user?.name || "User"}
                </p>

                <p className="tf-text-muted mt-0.5 truncate text-[11px]">
                  {user?.email || "user@taskflow.io"}
                </p>
              </div>

              <span
                className={`tf-text-muted shrink-0 transition-opacity duration-300 ${
                  isCompact ? "hidden opacity-0" : "opacity-100"
                } ${open ? "rotate-180" : ""}`}
              >
                <ChevronUp size={14} />
              </span>
            </div>
          )}
        >
          <div className="mb-1 flex items-center gap-3 px-2.5 py-2">
            <div className="tf-bg-3 tf-text flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--tf-r-md)] text-[13px] font-bold">
              {userInitials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="tf-text truncate text-[13px] font-semibold leading-tight">
                {user?.name || "User"}
              </p>

              <p className="tf-text-muted mt-0.5 truncate text-[12px]">
                {user?.email || "user@taskflow.io"}
              </p>
            </div>
          </div>

          <AppDropdown.Separator />

          <AppDropdown.Item onClick={() => navigate("/settings")}>
            <Settings size={15} />
            Profile & Settings
          </AppDropdown.Item>

          <AppDropdown.Item onClick={() => navigate('/workspaces')}>
            <Building2 size={15} />
            Switch Workspace
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

            Change Password
          </AppDropdown.Item>

          <AppDropdown.Item onClick={toggleTheme}>
            {isDarkMode ? (
              <>
                <Sun size={15} />
                Switch to Light Mode
              </>
            ) : (
              <>
                <Moon size={15} />
                Switch to Dark Mode
              </>
            )}
          </AppDropdown.Item>

          <AppDropdown.Separator />

          <AppDropdown.Item onClick={handleLogout} danger>
            <LogOut size={15} />
            Log out
          </AppDropdown.Item>
        </AppDropdown>
      </div>
    </div>
  );

  /* ── Render ──────────────────────────────────────────────────── */

  return (
    <div className="tf-bg-app tf-text relative min-h-screen">
      <AppBackground />

      <div className="relative z-10 flex min-h-screen">
        {/* Floating glass rail — detached from the viewport edge so it
            reads as a panel suspended over the background. */}
        <aside
          className={`sticky top-0 z-40 hidden h-screen shrink-0 self-start p-3 transition-[width] duration-300 ease-out lg:flex ${
            isCompact ? "w-[86px]" : "w-[288px]"
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="tf-surface tf-hairline tf-elev-3 relative flex h-full w-full flex-col overflow-hidden rounded-2xl">
            {renderSidebar("desktop")}
          </div>
        </aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.button
                type="button"
                aria-label="Close sidebar overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={easeOutFast}
                className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-md lg:hidden"
                onClick={() => setMobileOpen(false)}
              />

              <motion.aside
                ref={mobileDrawerRef}
                initial={{ x: -24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -24, opacity: 0 }}
                transition={springSoft}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onKeyDown={trapMobileDrawerFocus}
                role="dialog"
                aria-modal="true"
                aria-label="Main navigation"
                tabIndex={-1}
                className="fixed inset-y-0 left-0 z-50 flex h-dvh w-[292px] flex-col p-3 lg:hidden"
              >
                <div className="tf-surface tf-hairline tf-elev-4 relative flex h-full w-full flex-col overflow-hidden rounded-2xl">
                  {renderSidebar("mobile")}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex min-w-0 max-w-full flex-1 flex-col overflow-x-hidden">
          {/* Floating glass topbar */}
          <div className="sticky top-0 z-30 p-3 lg:hidden">
            <div className="tf-surface tf-hairline tf-elev-2 flex h-14 items-center gap-3 rounded-2xl px-3">
              <button
                ref={mobileTriggerRef}
                type="button"
                onClick={() => setMobileOpen(true)}
                className="tf-btn-icon tf-size-sm"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>

              <BrandLogo size="sm" />

              <span className="tf-text text-sm font-bold tracking-tight">
                TaskFlow Pro
              </span>

              {/* Search and theme are reachable from the rail on desktop;
                  on mobile the rail is closed, so they live here. */}
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="tf-btn-icon tf-size-sm"
                  aria-label="Search"
                >
                  <Search size={18} />
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="tf-btn-icon tf-size-sm"
                  aria-label={
                    isDarkMode ? "Switch to light mode" : "Switch to dark mode"
                  }
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Capped so the grid does not stretch into unreadable line
              lengths on wide monitors, and never flush to the edge. */}
          <main className="flex-1 p-4 md:p-6 lg:py-7 lg:pl-5 lg:pr-7">
            <div className="mx-auto w-full max-w-[1560px]">{children}</div>
          </main>
        </div>
      </div>

      <ComingSoonModal 
        open={!!comingSoonFeature} 
        onClose={() => setComingSoonFeature(null)} 
        featureName={comingSoonFeature} 
      />

      <GlobalSearchModal 
        open={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

      <TaskFlowAssistant />
    </div>
  );
}

export default DashboardLayout;
