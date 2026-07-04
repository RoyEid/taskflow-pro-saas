import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";

import useWorkspace from "../context/useWorkspace";
import { askAssistant, confirmAssistantAction } from "../services/aiService";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_ITEMS = 8;

const initialMessages = [
  {
    role: "assistant",
    content: "Hi, I'm TaskFlow Assistant. What can I help with in TaskFlow Pro?",
  },
];

const ACTION_LABELS = {
  create_workspace: "Create Workspace",
  create_client: "Create Client",
  create_project: "Create Project",
  create_task: "Create Task",
  create_client_and_project: "Create Client and Project",
  create_project_and_task: "Create Project and Task",
  create_client_project_and_task: "Create Client, Project, and Task",
};

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
    .filter((message) => ["user", "assistant"].includes(message.role) && message.content)
    .slice(-MAX_HISTORY_ITEMS)
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").slice(0, MAX_MESSAGE_LENGTH),
    }));
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getNestedValue(source, path) {
  return String(path)
    .split(".")
    .reduce((value, key) => (isPlainObject(value) ? value[key] : undefined), source);
}

function setNestedValue(source, path, value) {
  const parts = String(path).split(".");
  const next = { ...source };
  let cursor = next;

  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    cursor[key] = isPlainObject(cursor[key]) ? { ...cursor[key] } : {};
    cursor = cursor[key];
  }

  cursor[parts[parts.length - 1]] = value;
  return next;
}

function flattenFields(value, prefix = "") {
  if (!isPlainObject(value)) return [];

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(nestedValue)) {
      return flattenFields(nestedValue, path);
    }

    return [{ path, value: nestedValue }];
  });
}

function humanizeField(path) {
  const key = String(path || "").split(".").pop() || "";
  return key
    .replace(/Id$/, "")
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function normalizeInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function formatFieldValue(path, value) {
  if (value === undefined || value === null || value === "") return "";
  if (String(path).toLowerCase().includes("date")) return normalizeInputDate(value);
  return String(value);
}

function hasFieldValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function getProposalTitle(proposal) {
  return proposal?.title || ACTION_LABELS[proposal?.actionType] || "Assistant Action";
}

function getActionButtonLabel(actionType) {
  return ACTION_LABELS[actionType] || "Confirm";
}

function getConfirmPayloadFields(proposal, fields) {
  return isPlainObject(fields) ? fields : proposal?.fields || {};
}

function getCreatedLink(response) {
  const data = response?.data || response || {};
  const created = data.created || {};

  if (!created?.link) return null;

  return {
    href: created.link,
    label: `Open ${created.type || "item"}`,
  };
}

function FieldInput({ detail, value, onChange }) {
  const type = detail.type || "text";
  const options = Array.isArray(detail.options) ? detail.options : [];
  const commonClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

  if (type === "select" || options.length > 0) {
    return (
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className={commonClass}
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option.value || option.id} value={option.value || option.id}>
            {option.label || option.name || option.email || option.value || option.id}
          </option>
        ))}
      </select>
    );
  }

  if (type === "textarea") {
    return (
      <textarea
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className={`${commonClass} resize-none`}
      />
    );
  }

  return (
    <input
      type={type === "date" ? "date" : type === "email" ? "email" : "text"}
      value={type === "date" ? normalizeInputDate(value) : value || ""}
      onChange={(event) => onChange(event.target.value)}
      className={commonClass}
    />
  );
}

function ProposalCard({ proposal, isConfirming, onConfirm, onCancel }) {
  const [fields, setFields] = useState(() => proposal?.fields || {});

  useEffect(() => {
    queueMicrotask(() => {
      setFields(proposal?.fields || {});
    });
  }, [proposal]);



  const missingDetails = useMemo(() => {
    if (Array.isArray(proposal?.missingFieldDetails)) return proposal.missingFieldDetails;
    return (proposal?.missingFields || []).map((field) => ({
      field,
      label: humanizeField(field),
      type: "text",
    }));
  }, [proposal]);

  const visibleFields = useMemo(() => {
    const missingSet = new Set(missingDetails.map((detail) => detail.field));

    return flattenFields(fields).filter(({ path, value }) => {
      if (missingSet.has(path)) return false;
      if (!hasFieldValue(value)) return false;
      return !["workspaceId"].includes(path);
    });
  }, [fields, missingDetails]);

  const missingComplete = missingDetails.every((detail) => {
    return hasFieldValue(getNestedValue(fields, detail.field));
  });

  const canConfirm = missingComplete && !isConfirming;

  const handleFieldChange = useCallback((field, value) => {
    setFields((prev) => setNestedValue(prev, field, value));
  }, []);

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return;
    onConfirm({
      actionType: proposal.actionType,
      payload: getConfirmPayloadFields(proposal, fields),
    });
  }, [canConfirm, fields, onConfirm, proposal]);

  return (
    <div className="w-full overflow-hidden rounded-2xl rounded-bl-md border border-indigo-200 bg-white shadow-sm dark:border-indigo-900/60 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-3.5 py-2 dark:border-indigo-900/40 dark:bg-indigo-950/30">
        <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-300" />
        <span className="min-w-0 truncate text-[12px] font-bold text-indigo-700 dark:text-indigo-200">
          {getProposalTitle(proposal)}
        </span>
      </div>

      <div className="space-y-3 px-3.5 py-3">
        {Array.isArray(proposal?.steps) && proposal.steps.length > 0 && (
          <div className="space-y-1.5">
            {proposal.steps.map((step, index) => (
              <div
                key={`${step.type || "step"}-${index}`}
                className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[12px] font-medium text-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                  {index + 1}
                </span>
                <span className="min-w-0 truncate">{step.label}</span>
              </div>
            ))}
          </div>
        )}

        {visibleFields.length > 0 && (
          <div className="grid gap-2">
            {visibleFields.slice(0, 8).map(({ path, value }) => (
              <div
                key={path}
                className="rounded-lg border border-slate-200 px-2.5 py-2 dark:border-slate-800"
              >
                <div className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500">
                  {humanizeField(path)}
                </div>
                <div className="mt-0.5 break-words text-[12px] font-medium text-slate-800 dark:text-slate-100">
                  {formatFieldValue(path, value)}
                </div>
              </div>
            ))}
          </div>
        )}

        {missingDetails.length > 0 && (
          <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 dark:border-amber-900/60 dark:bg-amber-950/20">
            {missingDetails.map((detail) => (
              <label key={detail.field} className="block space-y-1">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-200">
                  {detail.label || humanizeField(detail.field)}
                </span>
                <FieldInput
                  detail={detail}
                  value={getNestedValue(fields, detail.field)}
                  onChange={(value) => handleFieldChange(detail.field, value)}
                />
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-200 px-3.5 py-2.5 dark:border-slate-800 sm:flex-row">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-[12px] font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:pointer-events-none disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {isConfirming ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Check size={13} />
              {getActionButtonLabel(proposal?.actionType)}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isConfirming}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <XCircle size={13} />
          Cancel
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13px] leading-5 ${
          isUser
            ? "rounded-br-md bg-indigo-600 text-white dark:bg-indigo-500"
            : "rounded-bl-md border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        }`}
      >
        {message.content}
        {message.link && (
          <a
            href={message.link.href}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-[12px] font-bold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-950 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
          >
            <FileText size={12} />
            {message.link.label}
          </a>
        )}
      </div>
    </div>
  );
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
  const [activeProposal, setActiveProposal] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const remainingCharacters = MAX_MESSAGE_LENGTH - draft.length;
  const canSend = draft.trim().length > 0 && !loading && !isConfirming;

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
    const element = listRef.current;
    if (!element) return;

    queueMicrotask(() => {
      element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    });
  }, [activeProposal, messages, open]);

  const resetAssistantChat = useCallback(() => {
    setMessages(initialMessages);
    setDraft("");
    setError("");
    setActiveProposal(null);
    setPendingAction(null);
    setLoading(false);
    setIsConfirming(false);
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const message = draft.trim();
      if (!message || loading || isConfirming) return;

      const userMessage = { role: "user", content: message };
      const history = getConversationHistory(messages);

      setMessages((prev) => [...prev, userMessage]);
      setDraft("");
      setError("");
      setActiveProposal(null);
      setLoading(true);

      try {
        const response = await askAssistant({
          message,
          workspaceId,
          history,
          pendingAction,
        });

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response?.answer || "I could not produce an answer right now.",
          },
        ]);

        if (response?.type === "action_proposal" && response?.proposal) {
          setActiveProposal(response.proposal);
          setPendingAction(null);
        } else if (response?.type === "missing_fields") {
          if (response?.pendingAction) {
            setPendingAction(response.pendingAction);
          } else {
            setPendingAction({
              actionType: response.actionType || "create_task",
              collectedFields: {},
            });
          }
        } else {
          setPendingAction(null);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [draft, isConfirming, loading, messages, pendingAction, workspaceId]
  );

  const handleConfirmAction = useCallback(
    async ({ actionType, payload }) => {
      setIsConfirming(true);
      setError("");

      try {
        const response = await confirmAssistantAction({
          actionType,
          workspaceId: payload?.workspaceId || workspaceId,
          payload,
        });
        const createdLink = getCreatedLink(response);

        setActiveProposal(null);
        setPendingAction(null);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response?.message || "Created successfully.",
            link: createdLink,
          },
        ]);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsConfirming(false);
      }
    },
    [workspaceId]
  );

  const handleCancelProposal = useCallback(() => {
    setActiveProposal(null);
    setPendingAction(null);
    setError("");
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Cancelled. Nothing was created.",
      },
    ]);
  }, []);

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
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                <Bot size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-[14px] font-bold text-slate-900 dark:text-white">
                  {panelTitle}
                </h2>
                <p className="mt-0.5 truncate text-[12px] text-slate-500 dark:text-slate-400">
                  {workspace?.name || "No workspace selected"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={resetAssistantChat}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                aria-label="New assistant chat"
                title="New chat"
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                aria-label="Close TaskFlow Assistant"
                title="Close"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <MessageBubble key={`${message.role}-${index}`} message={message} />
            ))}

            {activeProposal && !loading && (
              <div className="flex justify-start">
                <ProposalCard
                  proposal={activeProposal}
                  onConfirm={handleConfirmAction}
                  onCancel={handleCancelProposal}
                  isConfirming={isConfirming}
                />
              </div>
            )}

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
              <span>{remainingCharacters}</span>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default TaskFlowAssistant;
