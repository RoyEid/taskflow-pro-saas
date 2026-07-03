import React from "react";

export default function EmptyState({ icon, title, description, action, onAction, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 py-16 px-6 text-center dark:border-slate-800 dark:bg-slate-900/50 ${className}`}>
      {icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-sm">
          {icon}
        </div>
      ) : (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-sm">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
      )}
      <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-250">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-[13.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      )}
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {action}
        </button>
      )}
    </div>
  );
}
