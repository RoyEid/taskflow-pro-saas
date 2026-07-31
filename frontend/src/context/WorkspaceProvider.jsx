import { useCallback, useEffect, useMemo, useState } from "react";
import WorkspaceContext from "./WorkspaceContext";
import { getWorkspaces } from "../services/workspaceService";
import useAuth from "./useAuth";

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

    if (workspaceId) {
      localStorage.setItem("workspaceId", workspaceId);
    } else {
      localStorage.removeItem("workspaceId");
    }
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

      const savedWorkspaceId = localStorage.getItem("workspaceId");
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
        localStorage.setItem("workspaceId", normalizedId);
        setLoading(false);
        return;
      }

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
        if (fallbackId) {
          localStorage.setItem("workspaceId", fallbackId);
        } else {
          localStorage.removeItem("workspaceId");
        }
      } else {
        setWorkspaceState(null);
        setMemberRole(null);
        localStorage.removeItem("workspaceId");
      }

      setLoading(false);
    }

    loadSavedWorkspace();

    return () => {
      cancelled = true;
    };
  }, [user]);

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
