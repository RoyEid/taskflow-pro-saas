import { useCallback, useEffect, useMemo, useState } from "react";

import ChatSocketContext from "./ChatSocketContext";
import useAuth from "./useAuth";
import useWorkspace from "./useWorkspace";
import {
  createChatSocket,
  getChatUnreadCount,
} from "../services/chatService";

function ChatSocketProvider({ children }) {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  const userId = user?._id || user?.id;
  const workspaceId = workspace?._id || workspace?.id;

  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  const setUnreadCount = useCallback((wsId, count) => {
    if (!wsId) return;

    const normalizedWorkspaceId = String(wsId);
    const normalizedCount = Math.max(Number(count) || 0, 0);

    setUnreadCounts((previous) => ({
      ...previous,
      [normalizedWorkspaceId]: normalizedCount,
    }));

    window.dispatchEvent(
      new CustomEvent("chatUnreadUpdated", {
        detail: {
          workspaceId: normalizedWorkspaceId,
          unreadCount: normalizedCount,
        },
      }),
    );
  }, []);

  /*
   * Keep one authenticated socket connected while the user is signed in.
   * The backend places this socket in the user's private room so unread-count
   * events work everywhere in the application. Workspace chat rooms are joined
   * only by the Chat page itself.
   */
  useEffect(() => {
    if (!userId) {
      setSocket((currentSocket) => {
        currentSocket?.disconnect();
        return null;
      });
      setConnected(false);
      setUnreadCounts({});
      return undefined;
    }

    const currentSocket = createChatSocket();

    const handleConnect = () => {
      setConnected(true);
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleUnreadCount = (payload) => {
      if (!payload?.workspaceId) return;

      setUnreadCount(payload.workspaceId, payload.unreadCount || 0);
    };

    const handleConnectError = (error) => {
      console.error(
        "[Chat Socket] Connection failed:",
        error?.message || error,
      );
    };

    currentSocket.on("connect", handleConnect);
    currentSocket.on("disconnect", handleDisconnect);
    currentSocket.on("chatUnreadCount", handleUnreadCount);
    currentSocket.on("connect_error", handleConnectError);

    setSocket(currentSocket);
    currentSocket.connect();

    return () => {
      currentSocket.off("connect", handleConnect);
      currentSocket.off("disconnect", handleDisconnect);
      currentSocket.off("chatUnreadCount", handleUnreadCount);
      currentSocket.off("connect_error", handleConnectError);
      currentSocket.disconnect();

      setSocket((activeSocket) =>
        activeSocket === currentSocket ? null : activeSocket,
      );
      setConnected(false);
    };
  }, [userId, setUnreadCount]);

  /*
   * Load the stored count for the currently selected workspace. This request
   * does not join the chat room and does not mark messages as read.
   */
  useEffect(() => {
    if (!userId || !workspaceId) return undefined;

    let cancelled = false;

    getChatUnreadCount(workspaceId)
      .then((data) => {
        if (!cancelled) {
          setUnreadCount(workspaceId, data?.unreadCount || 0);
        }
      })
      .catch((error) => {
        console.error(
          "[Chat Unread] Failed to load unread count:",
          error?.response?.data?.message || error?.message,
        );
      });

    return () => {
      cancelled = true;
    };
  }, [userId, workspaceId, setUnreadCount]);

  const totalUnreadCount = useMemo(
    () =>
      Object.values(unreadCounts).reduce(
        (total, count) => total + (Number(count) || 0),
        0,
      ),
    [unreadCounts],
  );

  const value = {
    socket,
    connected,
    unreadCounts,
    totalUnreadCount,
    setUnreadCount,
    activeWorkspaceId: workspaceId,
  };

  return (
    <ChatSocketContext.Provider value={value}>
      {children}
    </ChatSocketContext.Provider>
  );
}

export default ChatSocketProvider;
