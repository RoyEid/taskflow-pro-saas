import Avatar from "./Avatar";

const priorityStyles = {
  High: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  Low: "bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300",
};

/* A single task tile inside the mock Kanban board. */
function TaskCard({ title, priority, assignee, meta, progress }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-700/70 dark:bg-slate-800">
      <p className="text-[12.5px] font-semibold leading-snug tf-text">
        {title}
      </p>

      {typeof progress === "number" && (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${priorityStyles[priority]}`}
        >
          {priority}
        </span>

        <div className="flex items-center gap-2">
          {meta && (
            <span className="text-[10.5px] font-medium tf-text-subtle">
              {meta}
            </span>
          )}
          <Avatar name={assignee} size={22} />
        </div>
      </div>
    </div>
  );
}

export default TaskCard;
