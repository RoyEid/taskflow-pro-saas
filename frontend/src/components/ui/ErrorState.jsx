import { AlertTriangle, RefreshCw } from "lucide-react";

/*
 * The single error state for the whole app. It says what failed in plain
 * language and offers the way out - never a status code or a stack trace.
 * The tone is the semantic error colour, so it reads as a problem without
 * flooding the panel in red.
 */
export default function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this information. Check your connection and try again.",
  onRetry,
  retryLabel = "Try again",
  className = "",
}) {
  return (
    <div
      role="alert"
      className={`tf-card-base flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
    >
      <div
        className="tf-text-danger mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ backgroundColor: "var(--tf-error-bg)" }}
      >
        <AlertTriangle size={22} />
      </div>

      <h3 className="tf-title-card">{title}</h3>

      <p className="tf-body-sm tf-text-muted mt-1.5 max-w-sm">{message}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="tf-btn-base tf-btn-secondary mt-5"
        >
          <RefreshCw size={14} />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
