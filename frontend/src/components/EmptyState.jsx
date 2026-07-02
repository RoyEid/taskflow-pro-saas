function EmptyState({ icon, title, description, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-16 px-6 text-center dark:border-slate-700 dark:bg-slate-800/20">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-sm">
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-[13px] text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {action}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
