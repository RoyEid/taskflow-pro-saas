function PageHeader({ breadcrumb, title, subtitle, action, actionLabel, actionIcon }) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
      <div>
        {breadcrumb && (
          <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">
            {breadcrumb}
          </div>
        )}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-[14px] text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {action && actionLabel && (
        <button
          onClick={action}
          className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 h-10 text-[13px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {actionIcon}
          {actionLabel}
        </button>
      )}
    </header>
  );
}

export default PageHeader;
