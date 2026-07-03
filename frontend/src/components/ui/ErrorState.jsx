import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this information. Please check your connection and try again.",
  onRetry,
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-red-200/50 bg-red-50/20 p-8 text-center dark:border-red-900/30 dark:bg-red-950/10 ${className}`}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
        <AlertCircle size={24} />
      </div>
      <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-200">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98] dark:bg-red-700 dark:hover:bg-red-600"
        >
          <RefreshCw size={14} className="animate-hover-spin" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
