

export default function LoadingSpinner({ size = "md", className = "" }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-[3px]",
    lg: "h-12 w-12 border-4",
  };
  return (
    <div
      className={`animate-spin rounded-full border-slate-200 border-t-indigo-600 dark:border-slate-850 dark:border-t-indigo-500 ${sizeClasses[size] || sizeClasses.md} ${className}`}
    />
  );
}
