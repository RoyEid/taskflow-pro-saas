export default function BrandLoader({
  text = "",
  fullScreen = false,
  size = "md",
  className = "",
}) {
  const dimensions = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  const imgSize = dimensions[size] || dimensions.md;

  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/95 dark:bg-slate-950/95 transition-colors duration-300"
    : "flex flex-col items-center justify-center p-8 transition-colors duration-300";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${containerClasses} ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Slow rotating glow ring around the icon */}
        <div
          className="absolute rounded-full border border-indigo-500/30 border-t-indigo-600 dark:border-indigo-500/20 dark:border-t-indigo-400 animate-spin"
          style={{
            animationDuration: "3s",
            width: "calc(100% + 1.5rem)",
            height: "calc(100% + 1.5rem)",
          }}
        />

        {/* Soft pulse background glow */}
        <div className="absolute inset-0 -z-10 rounded-full bg-indigo-500/10 blur-xl animate-pulse" />

        {/* Branded Logo with soft pulse/scale animation */}
        <img
          src="/favicon.png"
          alt="TaskFlow Pro"
          className={`${imgSize} animate-pulse object-contain`}
        />
      </div>

      {text && (
        <p className="mt-6 text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-300 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
