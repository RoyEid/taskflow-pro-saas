import { useState } from "react";

export default function BrandLogo({ size = "md", className = "" }) {
  const [error, setError] = useState(false);

  const dimensions = {
    sm: "h-9 w-9 p-1.5",
    md: "h-11 w-11 p-1.5",
    lg: "h-14 w-14 p-2",
    xl: "h-16 w-16 p-2",
  };

  const imgSize = dimensions[size] || dimensions.md;

  return (
    <div className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 shadow-sm transition-all duration-300 ${imgSize} ${className}`}>
      {error ? (
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">TF</span>
      ) : (
        <img
          src="/icon.png"
          alt="TaskFlow Pro"
          className="h-full w-full object-contain"
          draggable={false}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}

