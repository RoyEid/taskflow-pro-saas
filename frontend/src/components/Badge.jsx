/*
 * Every status pill in the app comes from this map, so a colour carries
 * exactly one meaning: green is a good end state, amber is waiting on
 * something, rose is a problem, sky is in flight, stone is inert.
 *
 * Roles are deliberately not colour-coded as statuses. They render as a
 * neutral pill with a tinted dot, so "Owner" can never be mistaken for a
 * warning and "Member" can never be mistaken for an archived record.
 */
const tones = {
  // Project / workspace status
  active: "success",
  completed: "success",
  inactive: "neutral",
  archived: "neutral",
  planning: "info",
  on_hold: "warning",
  cancelled: "error",

  // Task status
  todo: "neutral",
  in_progress: "info",
  review: "warning",
  done: "success",
  blocked: "error",

  // Priority
  low: "neutral",
  medium: "warning",
  high: "error",

  // Invitation / approval status
  pending: "warning",
  accepted: "success",
  declined: "error",
  expired: "neutral",
  approved: "success",
  rejected: "error",

  // Roles - neutral pill, tinted dot
  owner: "neutral",
  admin: "neutral",
  member: "neutral",
  client: "neutral",
};

const dotColors = {
  success: "var(--tf-success-dot)",
  warning: "var(--tf-warning-dot)",
  error: "var(--tf-error-dot)",
  info: "var(--tf-info-dot)",
  neutral: "var(--tf-neutral-dot)",
};

/* Roles override only the dot, keeping the pill itself neutral. */
const roleDots = {
  owner: "var(--tf-accent)",
  admin: "var(--tf-info-dot)",
  member: "var(--tf-neutral-dot)",
  client: "var(--tf-info-dot)",
};

const labels = {
  in_progress: "In Progress",
  on_hold: "On Hold",
  todo: "To Do",
  review: "In Review",
};

function toTitleCase(value) {
  if (!value || typeof value !== "string") return value;

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function Badge({ variant, children, dot, tone: toneOverride, className = "" }) {
  const tone = toneOverride || tones[variant] || "neutral";
  const label = children || labels[variant] || toTitleCase(variant);
  const dotColor = roleDots[variant] || dotColors[tone];

  return (
    <span className={`tf-badge tf-badge-${tone} ${className}`}>
      {dot && (
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      )}
      {label}
    </span>
  );
}

export default Badge;
