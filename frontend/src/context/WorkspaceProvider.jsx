import { useCallback, useEffect, useMemo, useState } from "react";
import WorkspaceContext from "./WorkspaceContext";
import { getWorkspaceById } from "../services/workspaceService";
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

  const setWorkspace = useCallback((ws) => {
    const normalizedWorkspace = normalizeWorkspace(ws);
    const workspaceId = getWorkspaceId(normalizedWorkspace);

    setWorkspaceState(normalizedWorkspace);

    if (ws?.member?.role || ws?.data?.member?.role) {
      setMemberRole(ws?.member?.role || ws?.data?.member?.role);
    } else {
      setMemberRole(null);
    }

    if (workspaceId) {
      localStorage.setItem("workspaceId", workspaceId);
    } else {
      localStorage.removeItem("workspaceId");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedWorkspace() {
      await Promise.resolve();

      if (cancelled) return;

      if (!user) {
        setWorkspaceState(null);
        setLoading(false);
        return;
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
          
          if (response?.member?.role || response?.data?.member?.role) {
            setMemberRole(response?.member?.role || response?.data?.member?.role);
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
    };
  }, [workspace, setWorkspace, memberRole, loading]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export default WorkspaceProvider;