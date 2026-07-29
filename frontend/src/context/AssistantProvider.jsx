import { useCallback, useEffect, useMemo, useState } from "react";
import AssistantContext from "./AssistantContext";

/*
 * The assistant conversation lives here, above <App />, because every
 * protected page renders its own <DashboardLayout>. Routes are flat rather
 * than nested, so navigating from /dashboard to /projects unmounts the whole
 * layout - and with it the assistant and any state it owned. Holding the
 * conversation at the root keeps it alive across route changes, unmounts and
 * re-renders. Only "New Chat" clears it.
 */

const STORAGE_KEY = "taskflow_assistant_session";

const INITIAL_ASSISTANT_MESSAGES = [
  {
    role: "assistant",
    content:
      "Hi, I'm TaskFlow Assistant. I can explain how to use TaskFlow Pro, but I cannot perform actions for you.",
  },
];

function readStoredMessages() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_ASSISTANT_MESSAGES;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return INITIAL_ASSISTANT_MESSAGES;
    }

    const valid = parsed.filter(
      (message) =>
        message &&
        typeof message.content === "string" &&
        ["user", "assistant"].includes(message.role)
    );

    return valid.length > 0 ? valid : INITIAL_ASSISTANT_MESSAGES;
  } catch {
    return INITIAL_ASSISTANT_MESSAGES;
  }
}

export default function AssistantProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(readStoredMessages);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Survives a page refresh for the tab, but never leaks across tabs or
  // outlives the browser session.
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Storage full or blocked - the in-memory conversation still works.
    }
  }, [messages]);

  const resetConversation = useCallback(() => {
    setMessages(INITIAL_ASSISTANT_MESSAGES);
    setDraft("");
    setError("");
    setLoading(false);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
  }, []);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      messages,
      setMessages,
      draft,
      setDraft,
      loading,
      setLoading,
      error,
      setError,
      resetConversation,
    }),
    [open, messages, draft, loading, error, resetConversation]
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}
