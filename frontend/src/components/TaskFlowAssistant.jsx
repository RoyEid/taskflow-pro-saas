import { useCallback, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Bot, Loader2, MessageSquarePlus, Send, Sparkles, X } from "lucide-react";
import { useLocation } from "react-router";

import useAuth from "../context/useAuth";
import useWorkspace from "../context/useWorkspace";
import useAssistant from "../context/useAssistant";
import { springSoft } from "./ui3d/motionTokens";
import { askAssistant } from "../services/aiService";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_ITEMS = 8;

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
            ? "tf-btn-base tf-btn-primary rounded-br-md"
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

  // Conversation state is owned by AssistantProvider at the app root so it
  // survives the layout remount that every route change causes.
  const {
    open,
    setOpen,
    draft,
    setDraft,
    messages,
    setMessages,
    loading,
    setLoading,
    error,
    setError,
    resetConversation,
  } = useAssistant();

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
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) return;
    const element = listRef.current;
    if (!element) return;

    queueMicrotask(() => {
      element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    });
  }, [loading, messages, open]);

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
    [assistantContext, draft, loading, messages, setDraft, setError, setLoading, setMessages]
  );

  /*
   * Rendered through a portal for the same reason the dropdowns are: this
   * component sits inside DashboardLayout, whose glass panels use
   * `backdrop-filter`. That establishes a containing block for fixed-position
   * descendants, so a `fixed bottom-6 right-6` panel anchors to the panel it
   * happens to be nested in rather than the viewport - which is how the window
   * ended up detached from its launcher.
   *
   * Launcher and panel now live in one bottom-right stack, so the panel is
   * always attached to the launcher and scales out of it.
   */
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-stretch gap-3 p-3 sm:inset-x-auto sm:right-0 sm:items-end sm:p-6">
      <AnimatePresence>
        {open && (
          <motion.div
            key="assistant-panel"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={springSoft}
            role="dialog"
            aria-modal="false"
            aria-label={panelTitle}
            className="pointer-events-auto flex h-[min(70dvh,560px)] w-full origin-bottom flex-col overflow-hidden tf-surface tf-hairline tf-elev-4 rounded-2xl sm:h-[min(640px,calc(100dvh-9rem))] sm:w-[420px] sm:origin-bottom-right"
          >
          <div className="tf-bd flex items-start justify-between gap-2 border-b px-4 py-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="tf-bg-3 tf-text-accent mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--tf-r-md)]">
                <Bot size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-[14px] font-bold tf-text">
                  {panelTitle}
                </h2>
                <p className="mt-0.5 truncate text-[12px] tf-text-muted">
                  {workspace?.name || pageName}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={resetConversation}
                className="tf-btn-base tf-btn-ghost tf-size-sm"
                aria-label="Start a new assistant conversation"
                title="Start a new assistant conversation"
              >
                <MessageSquarePlus size={14} />
                <span className="hidden sm:inline">New Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="tf-btn-icon tf-size-sm"
                aria-label="Close assistant"
                title="Close assistant"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          <div
            ref={listRef}
            className="tf-bg-2 flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((message, index) => (
              <MessageBubble key={`${message.role}-${index}`} message={message} />
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="tf-card-base tf-text-muted inline-flex items-center gap-2 rounded-bl-md px-3.5 py-2.5 text-[13px]">
                  <Loader2 size={14} className="animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="tf-text-danger border-t px-4 py-2 text-[12px] font-medium"
              style={{
                backgroundColor: "var(--tf-error-bg)",
                borderColor: "var(--tf-error-border)",
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="tf-bd tf-bg-1 border-t p-3"
          >
            <div className="tf-bd tf-bg-1 flex items-end gap-2 rounded-[var(--tf-r-md)] border p-2 transition focus-within:border-[var(--tf-accent)] focus-within:shadow-[0_0_0_3px_var(--tf-accent-ring)]">
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
                className="tf-text max-h-24 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-2 text-[13px] outline-none placeholder:text-[var(--tf-fg-subtle)]"
                aria-label="Ask TaskFlow Assistant"
              />
              <button
                type="submit"
                disabled={!canSend}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                  canSend
                    ? "bg-amber-600 text-white shadow-md hover:bg-amber-700 active:scale-95 dark:bg-amber-500 dark:hover:bg-amber-600"
                    : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                }`}
                aria-label="Send assistant message"
                title="Send"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} className="translate-x-[0.5px]" />
                )}
              </button>
            </div>
            <div className="tf-text-subtle mt-1 text-right text-[10px] font-semibold">
              {remainingCharacters}
            </div>
          </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Close TaskFlow Assistant" : "Open TaskFlow Assistant"}
        title="TaskFlow Assistant"
        className="tf-btn-base tf-btn-primary pointer-events-auto ml-auto shrink-0 rounded-full font-bold focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
      >
        {open ? <X size={17} /> : <Sparkles size={17} />}
        <span className="hidden sm:inline">Assistant</span>
      </button>
    </div>,
    document.body
  );
}

export default TaskFlowAssistant;
