import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";

import useWorkspace from "../context/useWorkspace";
import { askAssistant } from "../services/aiService";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_ITEMS = 8;

const initialMessages = [
  {
    role: "assistant",
    content:
      "Hi, I'm TaskFlow Assistant. Ask me for help with your workspace, tasks, projects, and workflow.",
  },
];

function getWorkspaceId(workspace) {
  return workspace?._id || workspace?.id || null;
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Assistant is temporarily unavailable."
  );
}

function getConversationHistory(messages) {
  return messages
    .filter((message) => ["user", "assistant"].includes(message.role))
    .slice(-MAX_HISTORY_ITEMS)
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").slice(0, MAX_MESSAGE_LENGTH),
    }));
}

function TaskFlowAssistant() {
  const { workspace } = useWorkspace();
  const workspaceId = getWorkspaceId(workspace);
  const listRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const remainingCharacters = MAX_MESSAGE_LENGTH - draft.length;
  const canSend = draft.trim().length > 0 && !loading;

  const panelTitle = useMemo(() => {
    return workspace?.name ? `TaskFlow Assistant - ${workspace.name}` : "TaskFlow Assistant";
  }, [workspace?.name]);

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

    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = draft.trim();

    if (!message || loading) return;

    const userMessage = {
      role: "user",
      content: message,
    };
    const history = getConversationHistory(messages);

    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setError("");
    setLoading(true);

    try {
      const response = await askAssistant({
        message,
        workspaceId,
        history,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response?.answer || "I could not produce an answer right now.",
        },
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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
        <div className="fixed inset-x-3 bottom-3 z-50 flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[390px]">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                <Bot size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-[14px] font-bold text-slate-900 dark:text-white">
                  {panelTitle}
                </h2>
                <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
                  Ask for help with your workspace, tasks, and workflow.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
              aria-label="Close TaskFlow Assistant"
              title="Close"
            >
              <X size={17} />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => {
              const isUser = message.role === "user";

              return (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[86%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13px] leading-5 ${
                      isUser
                        ? "rounded-br-md bg-indigo-600 text-white dark:bg-indigo-500"
                        : "rounded-bl-md border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[13px] font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <Loader2 size={14} className="animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-[12px] font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="border-t border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSubmit(event);
                  }
                }}
                rows={1}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder="Ask TaskFlow Assistant..."
                className="max-h-24 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
              />

              <button
                type="submit"
                disabled={!canSend}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 disabled:pointer-events-none disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                aria-label="Send assistant message"
                title="Send"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
            <div className="mt-1 flex justify-end text-[10px] font-medium text-slate-400 dark:text-slate-500">
              {remainingCharacters}
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default TaskFlowAssistant;
