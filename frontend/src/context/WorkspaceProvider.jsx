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
      return;
    }
    setLoadingWorkspaces(true);
    try {
      const data = await getWorkspaces();
      setWorkspaces(normalizeWorkspaceList(data));
    } catch (err) {
      console.error("Failed to refresh workspaces:", err);
    } finally {
      setLoadingWorkspaces(false);
    }
  }, [user]);

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

      // Find if savedWorkspaceId matches one of the user's valid workspaces
      const matchedWorkspace = userWorkspaces.find((w) => {
        const id = w?._id || w?.id || w?.workspace?._id || w?.workspace?.id;
        return id === savedWorkspaceId;
      });

      if (matchedWorkspace) {
        const normalized = normalizeWorkspace(matchedWorkspace);
        const normalizedId = getWorkspaceId(normalized) || savedWorkspaceId;
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
    };
  }, [workspace, setWorkspace, memberRole, loading, workspaces, loadingWorkspaces, refreshWorkspaces]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export default WorkspaceProvider;
