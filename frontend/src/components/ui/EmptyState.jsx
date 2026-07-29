import { Inbox } from "lucide-react";

/*
 * The single empty state for the whole app. An empty screen is an
 * invitation to act, so the shape is always: what is missing, one line
 * explaining why, and the action that fills it when there is one.
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  onAction,
  className = "",
}) {
  return (
    <div
      className={`tf-card-empty flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}
    >
      <div className="tf-bg-3 tf-text-muted mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
        {icon || <Inbox size={22} />}
      </div>

      <h3 className="tf-title-card">{title}</h3>

      {description && (
        <p className="tf-body-sm tf-text-muted mt-1.5 max-w-sm">{description}</p>
      )}

      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="tf-btn-base tf-btn-primary mt-5"
        >
          {action}
        </button>
      )}
    </div>
  );
}
