import { useCallback, useEffect, useMemo, useState } from "react";
import WorkspaceContext from "./WorkspaceContext";
import { getWorkspaceById, getWorkspaces } from "../services/workspaceService";
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
      setWorkspaces(data || []);
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
      try {
        const wsData = await getWorkspaces();
        if (!cancelled) {
          setWorkspaces(wsData || []);
        }
      } catch (err) {
        console.error("Failed to load workspaces list:", err);
      } finally {
        if (!cancelled) {
          setLoadingWorkspaces(false);
        }
      }

      const savedWorkspaceId = localStorage.getItem("workspaceId");

      if (!savedWorkspaceId) {
        setWorkspaceState(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await getWorkspaceById(savedWorkspaceId);

        if (cancelled) return;

        const normalizedWorkspace = normalizeWorkspace(response);
        const normalizedWorkspaceId = getWorkspaceId(normalizedWorkspace);

        if (normalizedWorkspace && normalizedWorkspaceId) {
          setWorkspaceState(normalizedWorkspace);
          
          const role = response?.role || response?.member?.role || response?.data?.member?.role || response?.membership?.role || response?.userRole;
          if (role) {
            setMemberRole(role.toLowerCase());
          }
          
          localStorage.setItem("workspaceId", normalizedWorkspaceId);
        } else {
          setWorkspaceState(null);
          setMemberRole(null);
          localStorage.removeItem("workspaceId");
        }
      } catch {
        if (!cancelled) {
          setWorkspaceState(null);
          localStorage.removeItem("workspaceId");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
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