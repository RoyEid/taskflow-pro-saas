
import LoadingSpinner from "./LoadingSpinner";

export default function ButtonLoader({ loadingText = "Saving...", className = "" }) {
  return (
    <span className={`flex items-center justify-center gap-2 ${className}`}>
      <LoadingSpinner size="sm" className="!border-current/30 !border-t-current" />
      <span>{loadingText}</span>
    </span>
  );
}
