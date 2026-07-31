import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import WorkspaceContext from "./WorkspaceContext";
import { getWorkspaces } from "../services/workspaceService";
import useAuth from "./useAuth";
import { showWarning } from "../utils/alerts";
import {
  WORKSPACE_ACCESS_LOST_EVENT,
  WORKSPACE_DELETED_EVENT,
} from "../utils/workspaceEvents";

function getWorkspaceId(ws) {
  return ws?._id || ws?.id || null;
}

function normalizeWorkspace(data) {
  if (!data) return null;

  if (data?.data?.workspace) return data.data.workspace;

  if (data?.workspace) return data.workspace;

  if (data?.data?._id || data?.data?.id) return data.data;

  if (data?._id || data?.id) return data;

  return null;
}

function normalizeWorkspaceList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.workspaces)) return data.workspaces;
  if (Array.isArray(data?.data?.workspaces)) return data.data.workspaces;
  return [];
}

function persistWorkspaceId(workspaceId) {
  try {
    if (workspaceId) {
      localStorage.setItem("workspaceId", String(workspaceId));
      sessionStorage.removeItem("workspaceId");
    } else {
      localStorage.removeItem("workspaceId");
      sessionStorage.removeItem("workspaceId");
    }
  } catch {
    // Storage can be blocked. The in-memory selection remains authoritative.
  }
}

function getPersistedWorkspaceId() {
  try {
    return (
      localStorage.getItem("workspaceId") ||
      sessionStorage.getItem("workspaceId")
    );
  } catch {
    return null;
  }
}

function workspaceListContains(workspaceList, workspaceId) {
  return workspaceList.some(
    (item) =>
      String(getWorkspaceId(normalizeWorkspace(item))) === String(workspaceId),
  );
}

function isWorkspaceDependentPath(pathname) {
  return [
    "/dashboard",
    "/clients",
    "/projects",
    "/tasks",
    "/chat",
    "/members",
  ].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function getChatWorkspaceIdFromPath() {
  const match = window.location.pathname.match(/^\/chat\/([^/]+)\/?$/);

  if (!match?.[1]) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function WorkspaceProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const lastUnavailableWorkspace = useRef({ id: null, time: 0 });

  const [workspace, setWorkspaceState] = useState(null);
  const [memberRole, setMemberRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);

  const setWorkspace = useCallback((ws) => {
    const normalizedWorkspace = normalizeWorkspace(ws);
    const workspaceId = getWorkspaceId(normalizedWorkspace);

    setWorkspaceState(normalizedWorkspace);

    const role = ws?.role || ws?.member?.role || ws?.data?.member?.role || ws?.membership?.role || ws?.userRole;
    if (role) {
      setMemberRole(role.toLowerCase());
    } else {
      setMemberRole(null);
    }

    persistWorkspaceId(workspaceId);
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setWorkspace(null);
      return [];
    }

    setLoadingWorkspaces(true);
    try {
      const data = await getWorkspaces();
      const nextWorkspaces = normalizeWorkspaceList(data);
      const currentWorkspaceId = getWorkspaceId(workspace);
      const matchingWorkspace = nextWorkspaces.find((item) => {
        const itemWorkspace = normalizeWorkspace(item);
        return String(getWorkspaceId(itemWorkspace)) === String(currentWorkspaceId);
      });

      setWorkspaces(nextWorkspaces);

      // Keep the selected workspace synchronized with the authoritative list.
      // This also replaces a deleted or inaccessible workspace with a safe
      // fallback so consumers never keep requesting its stale ID.
      if (!matchingWorkspace) {
        setWorkspace(nextWorkspaces[0] || null);
      }

      return nextWorkspaces;
    } catch (err) {
      console.error("Failed to refresh workspaces:", err);
      return null;
    } finally {
      setLoadingWorkspaces(false);
    }
  }, [user, workspace, setWorkspace]);

  const removeWorkspace = useCallback(
    (workspaceId, remainingWorkspaces) => {
      const sourceWorkspaces = Array.isArray(remainingWorkspaces)
        ? normalizeWorkspaceList(remainingWorkspaces)
        : workspaces;
      const nextWorkspaces = sourceWorkspaces.filter((item) => {
        const itemWorkspace = normalizeWorkspace(item);
        return String(getWorkspaceId(itemWorkspace)) !== String(workspaceId);
      });

      setWorkspaces(nextWorkspaces);

      if (String(getWorkspaceId(workspace)) === String(workspaceId)) {
        const fallbackWorkspace = nextWorkspaces[0] || null;
        setWorkspace(fallbackWorkspace);
        return normalizeWorkspace(fallbackWorkspace);
      }

      const persistedWorkspaceId = getPersistedWorkspaceId();
      if (String(persistedWorkspaceId) === String(workspaceId)) {
        persistWorkspaceId(getWorkspaceId(workspace));
      }

      return workspace;
    },
    [workspace, workspaces, setWorkspace]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSavedWorkspace() {
      await Promise.resolve();

      if (cancelled) return;

      if (!user) {
        setWorkspaceState(null);
        setLoading(false);
        setWorkspaces([]);
        return;
      }

      setLoadingWorkspaces(true);
      setLoading(true);

      let userWorkspaces = [];
      try {
        const wsData = await getWorkspaces();
        if (!cancelled) {
          userWorkspaces = normalizeWorkspaceList(wsData);
          setWorkspaces(userWorkspaces);
        }
      } catch (err) {
        console.error("Failed to load workspaces list:", err);
      } finally {
        if (!cancelled) {
          setLoadingWorkspaces(false);
        }
      }

      if (cancelled) return;

      const savedWorkspaceId = getPersistedWorkspaceId();
      const linkedWorkspaceId = getChatWorkspaceIdFromPath();
      const preferredWorkspaceId = linkedWorkspaceId || savedWorkspaceId;

      // Email links can open a specific workspace chat. Prefer that workspace
      // when it belongs to the signed-in user, then fall back to their saved one.
      const matchedWorkspace = userWorkspaces.find((w) => {
        const id = w?._id || w?.id || w?.workspace?._id || w?.workspace?.id;
        return String(id) === String(preferredWorkspaceId);
      });

      if (matchedWorkspace) {
        const normalized = normalizeWorkspace(matchedWorkspace);
        const normalizedId = getWorkspaceId(normalized) || preferredWorkspaceId;
        setWorkspaceState(normalized);
        const role =
          matchedWorkspace?.role ||
          matchedWorkspace?.member?.role ||
          matchedWorkspace?.membership?.role ||
          matchedWorkspace?.userRole;
        setMemberRole(role ? role.toLowerCase() : null);
        persistWorkspaceId(normalizedId);
        setLoading(false);
        return;
      }

      const invalidPreferredWorkspace = Boolean(preferredWorkspaceId);

      // If savedWorkspaceId is invalid/forbidden or missing, fallback to first available workspace
      if (userWorkspaces.length > 0) {
        const fallbackWs = normalizeWorkspace(userWorkspaces[0]);
        const fallbackId = getWorkspaceId(fallbackWs);
        setWorkspaceState(fallbackWs);
        const role =
          userWorkspaces[0]?.role ||
          userWorkspaces[0]?.member?.role ||
          userWorkspaces[0]?.membership?.role ||
          userWorkspaces[0]?.userRole;
        setMemberRole(role ? role.toLowerCase() : null);
        persistWorkspaceId(fallbackId);
      } else {
        setWorkspaceState(null);
        setMemberRole(null);
        persistWorkspaceId(null);
      }

      if (
        invalidPreferredWorkspace &&
        (linkedWorkspaceId ||
          isWorkspaceDependentPath(window.location.pathname))
      ) {
        navigate("/workspaces", { replace: true });
        showWarning("This workspace no longer exists.", "Workspace unavailable");
      }

      setLoading(false);
    }

    loadSavedWorkspace();

    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  useEffect(() => {
    const handleWorkspaceUnavailable = async (event) => {
      const eventWorkspaceId =
        event?.detail?.deletedWorkspaceId || event?.detail?.workspaceId;

      if (!eventWorkspaceId) return;

      const now = Date.now();
      if (
        String(lastUnavailableWorkspace.current.id) ===
          String(eventWorkspaceId) &&
        now - lastUnavailableWorkspace.current.time < 1000
      ) {
        return;
      }

      lastUnavailableWorkspace.current = {
        id: String(eventWorkspaceId),
        time: now,
      };

      const isDeletionEvent = event.type === WORKSPACE_DELETED_EVENT;
      const activeWorkspaceWasRemoved =
        String(getWorkspaceId(workspace)) === String(eventWorkspaceId);
      const linkedWorkspaceWasRemoved =
        String(getChatWorkspaceIdFromPath()) === String(eventWorkspaceId);

      if (isDeletionEvent) {
        removeWorkspace(eventWorkspaceId);
      }

      const refreshedWorkspaces = await refreshWorkspaces();
      if (!Array.isArray(refreshedWorkspaces)) return;

      const workspaceStillAccessible = workspaceListContains(
        refreshedWorkspaces,
        eventWorkspaceId,
      );

      if (workspaceStillAccessible && !isDeletionEvent) {
        return;
      }

      removeWorkspace(eventWorkspaceId, refreshedWorkspaces);

      if (
        activeWorkspaceWasRemoved ||
        linkedWorkspaceWasRemoved ||
        !isDeletionEvent
      ) {
        navigate("/workspaces", { replace: true });
      }

      showWarning(
        isDeletionEvent
          ? event?.detail?.message || "This workspace no longer exists."
          : "This workspace no longer exists or you no longer have access.",
        "Workspace unavailable",
      );
    };

    window.addEventListener(
      WORKSPACE_ACCESS_LOST_EVENT,
      handleWorkspaceUnavailable,
    );
    window.addEventListener(
      WORKSPACE_DELETED_EVENT,
      handleWorkspaceUnavailable,
    );

    return () => {
      window.removeEventListener(
        WORKSPACE_ACCESS_LOST_EVENT,
        handleWorkspaceUnavailable,
      );
      window.removeEventListener(
        WORKSPACE_DELETED_EVENT,
        handleWorkspaceUnavailable,
      );
    };
  }, [navigate, refreshWorkspaces, removeWorkspace, workspace]);

  const value = useMemo(() => {
    const workspaceId = getWorkspaceId(workspace);

    return {
      workspace,
      setWorkspace,
      workspaceId,
      memberRole,
      loading,
      workspaces,
      loadingWorkspaces,
      refreshWorkspaces,
      removeWorkspace,
    };
  }, [
    workspace,
    setWorkspace,
    memberRole,
    loading,
    workspaces,
    loadingWorkspaces,
    refreshWorkspaces,
    removeWorkspace,
  ]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export default WorkspaceProvider;
