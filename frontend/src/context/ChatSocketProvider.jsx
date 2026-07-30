import { useEffect, useState, useCallback } from "react";
import ChatSocketContext from "./ChatSocketContext";
import useAuth from "./useAuth";
import useWorkspace from "./useWorkspace";
import { createChatSocket } from "../services/chatService";

function ChatSocketProvider({ children }) {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const workspaceId = workspace?._id || workspace?.id;

  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  
  // Track unread counts per workspace: { [workspaceId]: count }
  const [unreadCounts, setUnreadCounts] = useState({});

  const setUnreadCount = useCallback((wsId, count) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [wsId]: count,
    }));
    
    // Also dispatch a custom event just in case standard event listeners are still used
    window.dispatchEvent(
      new CustomEvent("chatUnreadUpdated", {
        detail: {
          workspaceId: wsId,
          unreadCount: count,
        },
      })
    );
  }, []);

  const totalUnreadCount = Object.values(unreadCounts).reduce((acc, count) => acc + (count || 0), 0);

  useEffect(() => {
    let currentSocket = socket;

    if (!user || !workspaceId) {
      if (currentSocket) {
        currentSocket.disconnect();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Only create one socket connection per user across the app.
    if (!currentSocket) {
      currentSocket = createChatSocket(workspaceId);
      setSocket(currentSocket);

      currentSocket.on("connect", () => {
        setConnected(true);
      });

      currentSocket.on("disconnect", () => {
        setConnected(false);
      });

      currentSocket.on("chatUnreadCount", (payload) => {
        if (payload?.workspaceId) {
          setUnreadCount(payload.workspaceId, payload.unreadCount || 0);
        }
      });

      currentSocket.connect();
    } else {
      // If we switched workspaces, join the new workspace chat room implicitly via the socket event
      if (currentSocket.connected) {
         currentSocket.emit("joinWorkspaceChat", { workspaceId }, (response) => {
             if (response?.success) {
                 setUnreadCount(workspaceId, response.unreadCount || 0);
             }
         });
      }
    }

    return () => {
      // We DO NOT disconnect the socket here on unmount or workspace change, 
      // because we want it to stay alive globally.
      // Disconnection happens if !user (logged out).
    };
  }, [user, workspaceId, setUnreadCount, socket]);

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
