import React from "react";
import LoadingSpinner from "./LoadingSpinner";

export default function PageLoader({ message = "Loading..." }) {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 px-4 py-12 transition-all duration-300">
      <div className="relative flex items-center justify-center">
        <LoadingSpinner size="lg" />
        <div className="absolute h-3 w-3 rounded-full bg-indigo-500 animate-pulse" />
      </div>
      <p className="animate-pulse text-[14px] font-medium tracking-wide text-slate-500 dark:text-slate-400">
        {message}
      </p>
    </div>
  );
}
