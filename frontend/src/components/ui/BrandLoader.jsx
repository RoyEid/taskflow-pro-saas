export default function BrandLoader({
  text = "",
  fullScreen = false,
  size = "md",
  className = "",
}) {
  const dimensions = {
    sm: "h-10 w-10 p-2 rounded-xl",
    md: "h-14 w-14 p-2.5 rounded-2xl",
    lg: "h-18 w-18 p-3.5 rounded-2xl",
    xl: "h-28 w-28 p-5 rounded-3xl",
  };

  const imgSize = dimensions[size] || dimensions.md;

  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-xl dark:bg-slate-950/80 transition-colors duration-300"
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
          className="absolute rounded-full border border-amber-500/25 border-t-amber-500 dark:border-amber-400/20 dark:border-t-amber-400 animate-spin"
          style={{
            animationDuration: "3s",
            width: "calc(100% + 2rem)",
            height: "calc(100% + 2rem)",
          }}
        />

        {/* Soft pulse background glow */}
        <div className="absolute inset-0 -z-10 rounded-full bg-amber-500/15 blur-xl animate-pulse" />

        {/* Beautiful wrapped rounded brand logo with subtle borders and shadows */}
        <div className={`tf-card flex shrink-0 items-center justify-center transition-all duration-300 animate-pulse ${imgSize}`}>
          <img
            src="/icon.png"
            alt="TaskFlow Pro"
            className="h-full w-full object-contain"
            draggable={false}
          />
        </div>
      </div>

      {text && (
        <p className="mt-6 text-sm font-semibold tracking-wide tf-text-secondary animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
