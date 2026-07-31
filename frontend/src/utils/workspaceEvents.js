export const WORKSPACE_ACCESS_LOST_EVENT =
  "taskflow:workspace-access-lost";
export const WORKSPACE_DELETED_EVENT = "taskflow:workspace-deleted";
export const WORKSPACE_DELETION_PENDING_KEY =
  "taskflow:workspace-deletion-pending";

export function getWorkspaceIdFromRequestUrl(value) {
  const url = String(value || "");
  const match = url.match(/\/workspaces\/([^/?#]+)(?:[/?#]|$)/i);

  if (!match?.[1]) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function dispatchWorkspaceEvent(name, detail) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(name, {
      detail,
    }),
  );
}

export function dispatchWorkspaceAccessLost(detail) {
  dispatchWorkspaceEvent(WORKSPACE_ACCESS_LOST_EVENT, detail);
}

export function dispatchWorkspaceDeleted(detail) {
  dispatchWorkspaceEvent(WORKSPACE_DELETED_EVENT, detail);
}

export function getPendingWorkspaceDeletionId() {
  try {
    return sessionStorage.getItem(WORKSPACE_DELETION_PENDING_KEY);
  } catch {
    return null;
  }
}

export function setPendingWorkspaceDeletionId(workspaceId) {
  try {
    sessionStorage.setItem(
      WORKSPACE_DELETION_PENDING_KEY,
      String(workspaceId),
    );
  } catch {
    // The request can still proceed when browser storage is unavailable.
  }
}

export function clearPendingWorkspaceDeletionId(expectedWorkspaceId) {
  try {
    const currentWorkspaceId = sessionStorage.getItem(
      WORKSPACE_DELETION_PENDING_KEY,
    );

    if (
      expectedWorkspaceId === undefined ||
      String(currentWorkspaceId) === String(expectedWorkspaceId)
    ) {
      sessionStorage.removeItem(WORKSPACE_DELETION_PENDING_KEY);
    }
  } catch {
    // Nothing to clear when browser storage is unavailable.
  }
}
