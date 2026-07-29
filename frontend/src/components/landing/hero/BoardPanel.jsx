import TaskCard from "./TaskCard";
import Avatar from "./Avatar";

const columns = [
  {
    name: "To do",
    tone: "bg-slate-400",
    tasks: [
      { title: "Audit checkout funnel", priority: "High", assignee: "Rana Haddad", meta: "3 files" },
      { title: "Collect brand assets", priority: "Low", assignee: "Omar Nasser", meta: "Fri" },
    ],
  },
  {
    name: "In progress",
    tone: "bg-amber-500",
    tasks: [
      {
        title: "Rebuild pricing page",
        priority: "High",
        assignee: "Lina Chatti",
        progress: 68,
        meta: "8 / 12",
      },
      { title: "Migrate blog CMS", priority: "Medium", assignee: "Yara Fadel", progress: 34 },
    ],
  },
  {
    // Deliberately light: the floating approval card lands over this
    // column's empty lower half, so nothing readable sits beneath it.
    name: "Review",
    tone: "bg-emerald-500",
    tasks: [
      { title: "Homepage motion pass", priority: "Medium", assignee: "Sami Kabbani", meta: "2 notes" },
    ],
  },
];

const team = ["Lina Chatti", "Omar Nasser", "Rana Haddad", "Sami Kabbani"];

/* The main workspace panel: window chrome, team, and three Kanban columns. */
function BoardPanel() {
  return (
    <div className="lp-panel-shadow flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/90 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/90">
      {/* Window chrome */}
      <div className="flex items-center gap-3 border-b border-slate-200/80 px-4 py-3 dark:border-slate-700/70">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>

        <div className="ml-1 flex min-w-0 items-center gap-2">
          <span className="truncate text-[13px] font-bold tf-text">
            Northwind Redesign
          </span>
          <span className="shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            Active
          </span>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <div className="flex -space-x-2">
            {team.map((member) => (
              <Avatar key={member} name={member} size={22} ring />
            ))}
          </div>

          <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <span className="lp-breathe h-1.5 w-1.5 rounded-full bg-emerald-500" />
            4
          </span>
        </div>
      </div>

      {/* Project progress strip */}
      <div className="flex items-center gap-4 border-b border-slate-200/80 px-4 py-3 dark:border-slate-700/70">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-semibold tf-text-muted">
              Sprint 14 progress
            </span>
            <span className="lp-tabular text-[11.5px] font-bold tf-text">
              72%
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400" />
          </div>
        </div>

        <div className="shrink-0 whitespace-nowrap border-l border-slate-200 pl-3.5 dark:border-slate-700">
          <p className="lp-tabular text-[15px] font-extrabold leading-none tf-text">
            18
          </p>
          <p className="mt-1 text-[10px] font-semibold tf-text-subtle">
            open tasks
          </p>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid flex-1 grid-cols-3 gap-3 overflow-hidden p-4">
        {columns.map((column) => (
          <div key={column.name} className="flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${column.tone}`} />
              <span className="text-[11px] font-bold uppercase tracking-wide tf-text-muted">
                {column.name}
              </span>
              <span className="lp-tabular ml-auto rounded bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {column.tasks.length}
              </span>
            </div>

            {column.tasks.map((task) => (
              <TaskCard key={task.title} {...task} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BoardPanel;
