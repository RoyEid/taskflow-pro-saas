import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Command } from "cmdk";
import useWorkspace from "../context/useWorkspace";
import { getProjects } from "../services/projectService";
import { getClients } from "../services/clientService";
import {
  Search,
  LayoutDashboard,
  Briefcase,
  FolderKanban,
  CheckSquare,
  Settings,
  LayoutList,
  Users,
  User,
} from "lucide-react";

function normalizeList(response, key) {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.[key])) return response[key];

  if (Array.isArray(response?.data?.[key])) return response.data[key];

  if (Array.isArray(response?.data)) return response.data;

  return [];
}

export default function CommandPalette({ open, setOpen }) {
  const navigate = useNavigate();
  const { workspace } = useWorkspace();

  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  const workspaceId = workspace?._id || workspace?.id;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((currentOpen) => !currentOpen);
      }

      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [setOpen]);

  useEffect(() => {
    let isActive = true;

    async function loadCommandData() {
      if (!open || !workspaceId) {
        setProjects([]);
        setClients([]);
        return;
      }

      setLoading(true);

      try {
        const [projectsResponse, clientsResponse] = await Promise.all([
          getProjects(workspaceId).catch(() => []),
          getClients(workspaceId).catch(() => []),
        ]);

        if (!isActive) return;

        setProjects(normalizeList(projectsResponse, "projects"));
        setClients(normalizeList(clientsResponse, "clients"));
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadCommandData();

    return () => {
      isActive = false;
    };
  }, [open, workspaceId]);

  const handleSelect = (path) => {
    setOpen(false);
    navigate(path);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close command palette"
        onClick={() => setOpen(false)}
        className="fixed inset-0 h-full w-full cursor-default bg-black/40 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
        <div
          role="dialog"
          aria-modal="true"
          className="mx-auto max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
        >
          <Command className="flex max-h-[60vh] flex-col">
            <div className="flex items-center border-b border-slate-100 px-4 py-4 dark:border-slate-800/60">
              <Search size={18} className="shrink-0 text-slate-400" />

              <Command.Input
                autoFocus
                placeholder="Search projects, navigation, and more..."
                className="h-12 w-full border-0 bg-transparent pl-3 pr-4 text-[15px] text-slate-900 placeholder-slate-400 outline-none focus:ring-0 dark:text-white"
              />

              <div className="hidden items-center gap-1 whitespace-nowrap text-[11px] font-medium text-slate-400 sm:flex">
                <kbd className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  ESC
                </kbd>
                to close
              </div>
            </div>

            <Command.List className="overflow-y-auto p-2">
              <Command.Empty className="p-8 text-center text-[14px] text-slate-500 dark:text-slate-400">
                No results found.
              </Command.Empty>

              <Command.Group
                heading="Navigation"
                className="px-2 py-3 [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-slate-400 dark:[&_[cmdk-group-heading]]:text-slate-500"
              >
                <Command.Item
                  value="Dashboard"
                  onSelect={() => handleSelect("/dashboard")}
                  className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-slate-700 transition-colors aria-selected:bg-indigo-50 aria-selected:text-indigo-700 dark:text-slate-300 dark:aria-selected:bg-indigo-500/20 dark:aria-selected:text-indigo-400"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Command.Item>

                <Command.Item
                  value="Workspaces"
                  onSelect={() => handleSelect("/workspaces")}
                  className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-slate-700 transition-colors aria-selected:bg-indigo-50 aria-selected:text-indigo-700 dark:text-slate-300 dark:aria-selected:bg-indigo-500/20 dark:aria-selected:text-indigo-400"
                >
                  <Briefcase size={16} />
                  Workspaces
                </Command.Item>

                <Command.Item
                  value="Clients"
                  onSelect={() => handleSelect("/clients")}
                  className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-slate-700 transition-colors aria-selected:bg-indigo-50 aria-selected:text-indigo-700 dark:text-slate-300 dark:aria-selected:bg-indigo-500/20 dark:aria-selected:text-indigo-400"
                >
                  <Users size={16} />
                  Clients
                </Command.Item>

                <Command.Item
                  value="Projects"
                  onSelect={() => handleSelect("/projects")}
                  className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-slate-700 transition-colors aria-selected:bg-indigo-50 aria-selected:text-indigo-700 dark:text-slate-300 dark:aria-selected:bg-indigo-500/20 dark:aria-selected:text-indigo-400"
                >
                  <FolderKanban size={16} />
                  Projects
                </Command.Item>

                <Command.Item
                  value="Tasks"
                  onSelect={() => handleSelect("/tasks")}
                  className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-slate-700 transition-colors aria-selected:bg-indigo-50 aria-selected:text-indigo-700 dark:text-slate-300 dark:aria-selected:bg-indigo-500/20 dark:aria-selected:text-indigo-400"
                >
                  <CheckSquare size={16} />
                  Tasks
                </Command.Item>

                <Command.Item
                  value="Settings Profile Security Appearance"
                  onSelect={() => handleSelect("/settings")}
                  className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-slate-700 transition-colors aria-selected:bg-indigo-50 aria-selected:text-indigo-700 dark:text-slate-300 dark:aria-selected:bg-indigo-500/20 dark:aria-selected:text-indigo-400"
                >
                  <Settings size={16} />
                  Settings
                </Command.Item>
              </Command.Group>

              {loading && (
                <div className="px-5 py-4 text-[13px] text-slate-500 dark:text-slate-400">
                  Loading workspace data...
                </div>
              )}

              {!loading && projects.length > 0 && (
                <Command.Group
                  heading="Projects"
                  className="mt-2 border-t border-slate-100 px-2 py-3 dark:border-slate-800/60 [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-slate-400 dark:[&_[cmdk-group-heading]]:text-slate-500"
                >
                  {projects.map((project) => (
                    <Command.Item
                      key={project._id || project.id}
                      value={`Project ${project.name || "Untitled Project"}`}
                      onSelect={() =>
                        handleSelect(`/projects/${project._id || project.id}`)
                      }
                      className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-slate-700 transition-colors aria-selected:bg-indigo-50 aria-selected:text-indigo-700 dark:text-slate-300 dark:aria-selected:bg-indigo-500/20 dark:aria-selected:text-indigo-400"
                    >
                      <LayoutList size={16} />
                      {project.name || "Untitled Project"}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {!loading && clients.length > 0 && (
                <Command.Group
                  heading="Clients"
                  className="mt-2 border-t border-slate-100 px-2 py-3 dark:border-slate-800/60 [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-slate-400 dark:[&_[cmdk-group-heading]]:text-slate-500"
                >
                  {clients.map((client) => (
                    <Command.Item
                      key={client._id || client.id}
                      value={`Client ${client.name || "Untitled Client"}`}
                      onSelect={() => handleSelect("/clients")}
                      className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-slate-700 transition-colors aria-selected:bg-indigo-50 aria-selected:text-indigo-700 dark:text-slate-300 dark:aria-selected:bg-indigo-500/20 dark:aria-selected:text-indigo-400"
                    >
                      <User size={16} />
                      {client.name || "Untitled Client"}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </div>
      </div>
    </div>
  );
}