import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, MessageSquarePlus, Send, Sparkles, X } from "lucide-react";
import { useLocation } from "react-router";

import useAuth from "../context/useAuth";
import useWorkspace from "../context/useWorkspace";
import { askAssistant } from "../services/aiService";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_ITEMS = 8;

const initialMessages = [
  {
    role: "assistant",
    content: "Hi, I'm TaskFlow Assistant. I can explain how to use TaskFlow Pro, but I cannot perform actions for you.",
  },
];

const STRING_KEYS = ["answer", "message", "content", "value", "label", "name", "title"];

function safeText(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    return value.map((item) => safeText(item)).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    for (const key of STRING_KEYS) {
      const text = safeText(value[key]);
      if (text) return text;
    }
    return "";
  }

  return String(value || "").trim();
}

function getPageName(pathname = "") {
  const path = String(pathname || "").split("?")[0].split("#")[0].toLowerCase();

  if (path === "/dashboard" || path === "/") return "Dashboard";
  if (path === "/workspaces") return "Workspaces";
  if (path === "/clients") return "Clients";
  if (path === "/projects") return "Projects";
  if (/^\/projects\/[^/]+/.test(path)) return "Project Details";
  if (path === "/tasks") return "Tasks";
  if (/^\/tasks\/[^/]+/.test(path)) return "Task Details";
  if (path === "/chat") return "Chat";
  if (path === "/members") return "Members";
  if (path === "/settings") return "Settings";
  if (path === "/notifications") return "Notifications";
  if (path === "/profile") return "Profile";
  if (path === "/feedback") return "Feedback";
  if (path === "/help") return "Help";

  return "TaskFlow Pro";
}

function getThemeMode() {
  if (typeof document === "undefined") return "";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getErrorMessage(error) {
  const data = error?.response?.data;
  if (error?.response?.status === 429) {
    if (data?.retryAfter) {
      const minutes = Math.ceil(data.retryAfter / 60);
      return `AI Assistant limit reached. Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
    }
    return "AI Assistant limit reached. Please try again later.";
  }

  return "Assistant is temporarily unavailable. Please try again.";
}

function getConversationHistory(messages) {
  return messages
    .filter((message) => ["user", "assistant"].includes(message.role) && message.content)
    .slice(-MAX_HISTORY_ITEMS)
    .map((message) => ({
      role: message.role,
      content: safeText(message.content).slice(0, MAX_MESSAGE_LENGTH),
    }))
    .filter((message) => message.content);
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const content = safeText(message.content) || "I could not produce an answer right now.";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13px] leading-5 ${
          isUser
            ? "rounded-br-md bg-indigo-600 text-white shadow-sm"
            : "rounded-bl-md border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

function TaskFlowAssistant() {
  const { user } = useAuth();
  const { workspace, memberRole } = useWorkspace();
  const location = useLocation();
  const listRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pageName = useMemo(() => getPageName(location.pathname), [location.pathname]);
  const remainingCharacters = MAX_MESSAGE_LENGTH - draft.length;
  const canSend = draft.trim().length > 0 && !loading;

  const assistantContext = useMemo(() => ({
    pathname: location.pathname,
    pageName,
    moduleName: pageName,
    userRole: safeText(user?.role),
    workspaceRole: safeText(memberRole),
    themeMode: getThemeMode(),
  }), [location.pathname, memberRole, pageName, user?.role]);

  const panelTitle = "TaskFlow Assistant";

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const element = listRef.current;
    if (!element) return;

    queueMicrotask(() => {
      element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    });
  }, [loading, messages, open]);

  const resetAssistantChat = useCallback(() => {
    setMessages(initialMessages);
    setDraft("");
    setError("");
    setLoading(false);
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const message = draft.trim();
      if (!message || loading) return;

      const userMessage = { role: "user", content: message };
      const history = getConversationHistory(messages);

      setMessages((prev) => [...prev, userMessage]);
      setDraft("");
      setError("");
      setLoading(true);

      try {
        const response = await askAssistant({
          message,
          history,
          context: assistantContext,
        });

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: safeText(response?.answer) || "I can help explain how to use TaskFlow Pro.",
          },
        ]);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [assistantContext, draft, loading, messages]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed bottom-5 right-5 z-50 inline-flex h-12 items-center gap-2 rounded-full bg-indigo-600 px-4 text-[13px] font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus:ring-offset-slate-950 ${
          open ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        aria-label="Open TaskFlow Assistant"
        title="TaskFlow Assistant"
      >
        <Sparkles size={17} />
        <span className="hidden sm:inline">Assistant</span>
      </button>

      {open && (
        <div className="fixed inset-2 bottom-2 z-50 flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(720px,calc(100dvh-3rem))] sm:w-[420px]">
          <div className="flex items-start justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                <Bot size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-[14px] font-bold text-slate-900 dark:text-white">
                  {panelTitle}
                </h2>
                <p className="mt-0.5 truncate text-[12px] text-slate-500 dark:text-slate-400">
                  {workspace?.name || pageName}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={resetAssistantChat}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                aria-label="Start a new assistant conversation"
                title="Start a new assistant conversation"
              >
                <MessageSquarePlus size={14} />
                <span className="hidden sm:inline">New Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                aria-label="Close assistant"
                title="Close assistant"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-4 dark:bg-slate-950"
          >
            {messages.map((message, index) => (
              <MessageBubble key={`${message.role}-${index}`} message={message} />
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <Loader2 size={14} className="animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-[12px] font-medium text-red-700 dark:border-red-950/50 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:border-indigo-500 dark:focus-within:ring-indigo-950">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    if (canSend) {
                      event.currentTarget.form?.requestSubmit();
                    }
                  }
                }}
                rows={1}
                placeholder="Ask how to use TaskFlow Pro..."
                className="max-h-24 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-2 text-[13px] text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                aria-label="Ask TaskFlow Assistant"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 disabled:pointer-events-none disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                aria-label="Send assistant message"
                title="Send"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
            <div className="mt-1 text-right text-[10px] font-semibold text-slate-400">
              {remainingCharacters}
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default TaskFlowAssistant;
