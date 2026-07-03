import { Check, ChevronDown, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import useWorkspace from "../context/useWorkspace";

export default function WorkspaceSwitcher({
  userWorkspaces = [],
  isCompact = false,
  mobileOpen = false,
  setMobileOpen = () => {},
  isOpen = false,
  setIsOpen = () => {},
  onExpandSidebar = () => {},
}) {
  const navigate = useNavigate();
  const { workspace, setWorkspace, memberRole } = useWorkspace();

  const workspacesList = Array.isArray(userWorkspaces)
    ? userWorkspaces
    : Array.isArray(userWorkspaces?.workspaces)
    ? userWorkspaces.workspaces
    : [];

  const handleWorkspaceSelect = (ws) => {
    setWorkspace(ws);
    if (mobileOpen) setMobileOpen(false);
    setIsOpen(false);
  };

  const togglePanel = () => {
    if (isCompact) {
      onExpandSidebar();
    } else {
      setIsOpen(!isOpen);
    }
  };

  const getRoleBadge = (role) => {
    if (!role) return null;
    let colorClass = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    if (role === "owner") colorClass = "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400";
    if (role === "admin") colorClass = "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400";
    
    return (
      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${colorClass}`}>
        {role}
      </span>
    );
  };

  const currentWorkspaceId = workspace?._id || workspace?.id;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div
        onClick={togglePanel}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800/50 ${
          isOpen && !isCompact ? "bg-slate-200/50 dark:bg-slate-800/50" : ""
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-sm transition-transform duration-300 dark:bg-indigo-500">
          {workspace?.name ? workspace.name.charAt(0).toUpperCase() : "TF"}
        </div>

        {!isCompact && (
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2 pr-8 lg:pr-0">
            <div className="flex min-w-0 flex-1 flex-col items-start">
              <span className="w-full truncate text-left text-[13px] font-bold text-slate-900 dark:text-white">
                TaskFlow Pro
              </span>
              <div className="flex w-full items-center gap-1.5">
                <span className="truncate text-left text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {workspace ? workspace.name : "Select Workspace"}
                </span>
                {memberRole && getRoleBadge(memberRole)}
              </div>
            </div>
            <ChevronDown
              size={14}
              className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        )}
      </div>

      {/* Inline Panel */}
      {isOpen && !isCompact && (
        <div className="mt-2 flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Switch Workspace
          </div>
          
          <div className="max-h-[50vh] space-y-0.5 overflow-y-auto px-1.5 pb-1 no-scrollbar">
            {workspacesList.length > 0 ? (
              workspacesList.map((wsItem) => {
                const ws = wsItem.workspace || wsItem;
                const role = wsItem.role || null;
                const wsId = ws._id || ws.id;
                const isActive = currentWorkspaceId === wsId;

                return (
                  <button
                    key={wsId}
                    onClick={() => handleWorkspaceSelect(wsItem)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
                      isActive 
                        ? "bg-indigo-50 text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-200" 
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-200 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {ws.name ? ws.name.charAt(0).toUpperCase() : "W"}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col items-start">
                      <span className="w-full truncate text-[12px] font-semibold leading-tight">
                        {ws.name}
                      </span>
                      {role && (
                        <span className="mt-0.5 text-[10px] font-medium capitalize text-slate-500 dark:text-slate-400">
                          {role}
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <Check size={14} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-[12px] text-slate-500 dark:text-slate-400">
                No workspaces found
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80" />
          
          <div className="p-1.5">
            <button
              onClick={() => {
                navigate("/workspaces");
                setIsOpen(false);
                if (mobileOpen) setMobileOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-indigo-100 dark:bg-indigo-500/20">
                <Plus size={14} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-[12px] font-semibold">New Workspace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
