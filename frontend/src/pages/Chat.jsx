import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Archive,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Edit3,
  FileText,
  Image,
  Mic,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  Smile,
  Square,
  Trash2,
  UserPlus,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import DashboardLayout from "../layouts/DashboardLayout";

const STICKER_MAP = {
  thumbs_up: "👍",
  clap: "👏",
  fire: "🔥",
  laugh: "😂",
  love: "😍",
  heart: "❤️",
  done: "✅",
  thanks: "🙏",
  gasp: "😮",
  cry: "😢",
  party: "🎉",
  flex: "💪",
  eyes: "👀",
  rocket: "🚀",
  star: "⭐",
  hundred: "💯",
};
import useAuth from "../context/useAuth";
import useWorkspace from "../context/useWorkspace";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import {
  createChatSocket,
  CHAT_PAGE_SIZE,
  deleteMessage as deleteMessageRequest,
  editMessage as editMessageRequest,
  getChatMeta,
  getMessageContext,
  getRecentMessages,
  markChatRead,
  searchMessages,
  startNewChat as startNewChatRequest,
  uploadChatFile,
} from "../services/chatService";
import { confirmAction, confirmDelete, showError, showSuccess } from "../utils/alerts";
import { getToken } from "../utils/tokenStorage";

const EDIT_MESSAGE_WINDOW_MS = 15 * 60 * 1000;
const DELETE_MESSAGE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const DELETED_MESSAGE_TEXT = "This message was deleted.";
const CHAT_MESSAGE_MAX_LENGTH = 2000;
const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const SUPPORTED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const AUDIO_FILE_EXTENSIONS = new Set(["webm", "ogg", "mp3", "m4a", "mp4", "wav", "aac"]);

function normalizeMimeType(value = "") {
  return String(value).split(";")[0].trim().toLowerCase();
}

function getFileExtension(value = "") {
  const cleanValue = String(value).split("?")[0].split("#")[0];
  const fileName = cleanValue.split("/").pop() || "";
  const extension = fileName.includes(".") ? fileName.split(".").pop() : "";

  return extension.toLowerCase();
}

function getMessageMediaUrl(message) {
  return message?.fileUrl || message?.audioUrl || message?.imageUrl || "";
}

function isSupportedImageMedia({ messageType, mimeType, fileName, fileUrl } = {}) {
  const type = String(messageType || "").toLowerCase();
  const cleanMime = normalizeMimeType(mimeType);

  return (
    type === "image" ||
    SUPPORTED_IMAGE_MIME_TYPES.has(cleanMime) ||
    SUPPORTED_IMAGE_EXTENSIONS.has(getFileExtension(fileName)) ||
    SUPPORTED_IMAGE_EXTENSIONS.has(getFileExtension(fileUrl))
  );
}

function isAudioMedia({ messageType, mimeType, fileName, fileUrl } = {}) {
  const type = String(messageType || "").toLowerCase();
  const cleanMime = normalizeMimeType(mimeType);

  return (
    type === "audio" ||
    cleanMime.startsWith("audio/") ||
    AUDIO_FILE_EXTENSIONS.has(getFileExtension(fileName)) ||
    AUDIO_FILE_EXTENSIONS.has(getFileExtension(fileUrl))
  );
}

function getMessageKind(message) {
  const messageType = String(message?.messageType || message?.type || "").toLowerCase();
  const fileUrl = getMessageMediaUrl(message);

  if (messageType === "sticker") return "sticker";
  if (isAudioMedia({ ...message, messageType, fileUrl })) return "audio";
  if (isSupportedImageMedia({ ...message, messageType, fileUrl })) return "image";
  if (messageType === "file" || fileUrl) return "file";

  return "text";
}

function getAudioExtension(mimeType) {
  const cleanMime = normalizeMimeType(mimeType);

  if (cleanMime === "audio/ogg") return "ogg";
  if (cleanMime === "audio/mp4" || cleanMime === "audio/x-m4a" || cleanMime === "audio/m4a") return "m4a";
  if (cleanMime === "audio/wav" || cleanMime === "audio/x-wav") return "wav";
  if (cleanMime === "audio/aac") return "aac";
  if (cleanMime === "audio/mpeg" || cleanMime === "audio/mp3") return "mp3";

  return "webm";
}

function formatDuration(seconds) {
  const normalizedSeconds = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(normalizedSeconds / 60);
  const remainder = normalizedSeconds % 60;

  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function formatFileSize(fileSize) {
  const size = Number(fileSize) || 0;

  if (!size) return "";
  if (size > 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;

  return `${(size / 1024).toFixed(1)} KB`;
}

function getWorkspaceId(workspace) {
  return workspace?._id || workspace?.id || null;
}

function getEntityId(value) {
  if (!value) return null;

  if (typeof value !== "object") {
    return value;
  }

  if (value._id) return getEntityId(value._id);
  if (value.id) return getEntityId(value.id);
  if (value.$oid) return value.$oid;

  return null;
}

function idsEqual(left, right) {
  const leftId = getEntityId(left);
  const rightId = getEntityId(right);

  return Boolean(leftId && rightId && String(leftId) === String(rightId));
}

function getUserId(user) {
  return getEntityId(user);
}

function getMessageId(message) {
  return message?._id || message?.id || null;
}

function getSender(message) {
  if (message?.sender && typeof message.sender === "object") {
    return message.sender;
  }

  return null;
}

function getSenderId(message) {
  const sender = getSender(message);
  return getEntityId(sender) || getEntityId(message?.sender);
}

function getReadUserId(read) {
  return getEntityId(read?.user);
}

function getMemberUser(member) {
  if (member?.user && typeof member.user === "object") {
    return member.user;
  }

  return null;
}

function getMemberUserId(member) {
  return getUserId(getMemberUser(member)) || getEntityId(member?.user);
}

function normalizeSearchResults(data) {
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data?.results)) return data.data.results;
  if (Array.isArray(data?.messages)) return data.messages;
  return [];
}

function getSearchTotal(data, results) {
  const total = data?.total ?? data?.data?.total;
  return typeof total === "number" ? total : results.length;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMessageContent(content, searchTerm, isActiveResult = false) {
  const text = String(content || "");
  const term = String(searchTerm || "").trim();

  if (!term || !text) {
    return text;
  }

  const regex = new RegExp(`(${escapeRegex(term)})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === term.toLowerCase()) {
      return (
        <mark
          key={`${part}-${index}`}
          className={
            isActiveResult
              ? "rounded px-0.5 bg-yellow-300 text-slate-900 dark:bg-yellow-400 dark:text-slate-900"
              : "rounded px-0.5 bg-yellow-200/90 text-inherit dark:bg-yellow-500/50"
          }
        >
          {part}
        </mark>
      );
    }

    return part;
  });
}

function sortMessagesByDate(items) {
  return [...items].sort((left, right) => {
    const leftTime = left?.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right?.createdAt ? new Date(right.createdAt).getTime() : 0;
    return leftTime - rightTime;
  });
}
function normalizeMessages(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.messages)) return data.messages;
  if (Array.isArray(data?.data?.messages)) return data.data.messages;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function normalizeMembers(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.members)) return data.members;
  if (Array.isArray(data?.data?.members)) return data.data.members;
  return [];
}

function normalizeOnlineUsers(users) {
  if (!Array.isArray(users)) return [];
  return users.map((user) => String(getUserId(user))).filter(Boolean);
}

function getInitials(name = "") {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return initials || "U";
}

function formatMessageTime(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDateKey(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatMessageDateSeparator(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (getDateKey(date) === getDateKey(today)) {
    return "Today";
  }

  if (getDateKey(date) === getDateKey(yesterday)) {
    return "Yesterday";
  }

  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getDateSeparatorLabel(message, previousMessage) {
  if (!message?.createdAt) {
    return "";
  }

  if (!previousMessage?.createdAt) {
    return formatMessageDateSeparator(message.createdAt);
  }

  return getDateKey(message.createdAt) === getDateKey(previousMessage.createdAt)
    ? ""
    : formatMessageDateSeparator(message.createdAt);
}

function isDeletedMessage(message) {
  return Boolean(message?.isDeleted || message?.deletedAt);
}

function isWithinMessageWindow(message, windowMs, now) {
  const createdAt = message?.createdAt ? new Date(message.createdAt).getTime() : null;

  if (!createdAt || Number.isNaN(createdAt)) {
    return false;
  }

  return now - createdAt <= windowMs;
}

function Chat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workspace, memberRole } = useWorkspace();

  const workspaceId = getWorkspaceId(workspace);
  const currentUserId = getUserId(user);

  const socketRef = useRef(null);
  const messageListRef = useRef(null);
  const bottomRef = useRef(null);
  const messageElementRefs = useRef(new Map());
  const typingTimeoutRef = useRef(null);
  const skipNextAutoScrollRef = useRef(false);
  const searchNavigationRef = useRef(false);
  const pendingScrollMessageIdRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordingCancelledRef = useRef(false);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const startTimeRef = useRef(null);

  const getAuthenticatedUrl = (url, download = false) => {
    const rawUrl = String(url || "").trim();

    if (!rawUrl) return "";
    if (rawUrl.startsWith("blob:") || rawUrl.startsWith("data:")) return rawUrl;

    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const origin = apiBase.replace(/\/api\/?$/, "");
    const token = getToken();

    try {
      const mediaUrl = /^https?:\/\//i.test(rawUrl)
        ? new URL(rawUrl)
        : new URL(rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`, origin);

      if (token) {
        mediaUrl.searchParams.set("token", token);
      }

      if (download) {
        mediaUrl.searchParams.set("download", "true");
      }

      return mediaUrl.toString();
    } catch {
      return rawUrl;
    }
  };

  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [draft, setDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [jumpingToResult, setJumpingToResult] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [archiveNotice, setArchiveNotice] = useState("");
  const [error, setError] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [permissionNow, setPermissionNow] = useState(() => Date.now());

  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [tempAudioBlob, setTempAudioBlob] = useState(null);
  const [tempAudioUrl, setTempAudioUrl] = useState("");
  const [tempAudioDuration, setTempAudioDuration] = useState(0);

  useEffect(() => {
    queueMicrotask(() => {
      setMessages([]);
      setMembers([]);
      setOnlineUserIds([]);
      setTypingUsers([]);
      setSearchTerm("");
      setSearchResults([]);
      setSearchTotal(0);
      setActiveSearchIndex(-1);
      setSearching(false);
      setJumpingToResult(false);
      setSearchFocused(false);
      setUnreadCount(0);
      setHasMoreMessages(false);
      setEditingMessageId(null);
      setEditDraft("");
      setSavingEdit(false);
      setDeletingMessageId(null);

      setShowStickerPicker(false);
      setIsUploading(false);
      setUploadProgress(0);
      setIsRecording(false);
      setRecordingDuration(0);
      setTempAudioBlob(null);
      setTempAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
      setTempAudioDuration(0);
    });

    recordingCancelledRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore recorder stop errors
      }
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, [workspaceId]);

  const [prevSearchTerm, setPrevSearchTerm] = useState(searchTerm);
  if (searchTerm !== prevSearchTerm) {
    setPrevSearchTerm(searchTerm);
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchTotal(0);
      setActiveSearchIndex(-1);
      setSearching(false);
      setJumpingToResult(false);
    }
  }

  const workspaceName = workspace?.name || "Workspace";
  const trimmedSearchTerm = searchTerm.trim();
  const isSearchMode = trimmedSearchTerm.length > 0;
  const navigableSearchCount = searchResults.length;
  const searchCounterLabel =
    navigableSearchCount > 0 && activeSearchIndex >= 0
      ? `${activeSearchIndex + 1} of ${navigableSearchCount}`
      : isSearchMode && !searching
        ? "0 of 0"
        : "";
  const activeSearchMessageId =
    activeSearchIndex >= 0 ? getMessageId(searchResults[activeSearchIndex]) : null;

  const currentMemberRole = useMemo(() => {
    if (memberRole) return memberRole;

    const currentMember = members.find((member) => {
      return idsEqual(getMemberUserId(member), currentUserId);
    });

    return currentMember?.role || "member";
  }, [currentUserId, memberRole, members]);

  const canStartNewChat = currentMemberRole === "owner";
  const canInviteMembers = ["owner", "admin"].includes(currentMemberRole);
  const isOnlyMemberWorkspace = members.length === 1;

  const onlineSet = useMemo(() => {
    return new Set(onlineUserIds.map((id) => String(id)));
  }, [onlineUserIds]);

  const connectionLabel = connected ? "Live" : "Offline";

  const mergeMessages = useCallback((incomingMessages) => {
    if (!Array.isArray(incomingMessages) || incomingMessages.length === 0) return;

    setMessages((prev) => {
      const existingIds = new Set(prev.map((message) => getMessageId(message)).filter(Boolean));
      const uniqueIncoming = incomingMessages.filter((message) => {
        const messageId = getMessageId(message);
        return !messageId || !existingIds.has(messageId);
      });

      if (uniqueIncoming.length === 0) {
        return prev;
      }

      return sortMessagesByDate([...prev, ...uniqueIncoming]);
    });
  }, [setMessages]);

  const scrollToMessageElement = useCallback((messageId) => {
    if (!messageId) return;

    const element = messageElementRefs.current.get(String(messageId));

    if (element && messageListRef.current) {
      skipNextAutoScrollRef.current = true;
      const container = messageListRef.current;
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      const scrollOffset = (elementRect.top - containerRect.top) + container.scrollTop - (containerRect.height / 2) + (elementRect.height / 2);

      container.scrollTo({
        top: scrollOffset,
        behavior: "smooth"
      });
    }
  }, []);

  const isMessageLoaded = useCallback(
    (messageId) => {
      if (!messageId) return false;

      return messages.some((message) => idsEqual(getMessageId(message), messageId));
    },
    [messages]
  );

  const ensureSearchResultLoaded = useCallback(
    async (result) => {
      const messageId = getMessageId(result);

      if (!messageId || !workspaceId) {
        return false;
      }

      if (isMessageLoaded(messageId)) {
        return true;
      }

      setJumpingToResult(true);

      try {
        const data = await getMessageContext(workspaceId, messageId);
        const contextMessages = normalizeMessages(data);

        skipNextAutoScrollRef.current = true;
        mergeMessages(contextMessages);

        if (typeof data?.hasMoreBefore === "boolean") {
          setHasMoreMessages((prev) => prev || Boolean(data.hasMoreBefore));
        }

        return true;
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load search result.");
        return false;
      } finally {
        setJumpingToResult(false);
      }
    },
    [isMessageLoaded, mergeMessages, workspaceId, setError, setHasMoreMessages, setJumpingToResult]
  );

  const goToSearchResult = useCallback(
    (index) => {
      if (index < 0 || index >= searchResults.length) return;
      setActiveSearchIndex(index);
    },
    [searchResults.length, setActiveSearchIndex]
  );

  const handleNextSearchResult = useCallback(() => {
    if (navigableSearchCount === 0) return;
    if (activeSearchIndex === navigableSearchCount - 1) {
      goToSearchResult(0);
    } else {
      goToSearchResult(activeSearchIndex + 1);
    }
  }, [activeSearchIndex, goToSearchResult, navigableSearchCount]);

  const handlePreviousSearchResult = useCallback(() => {
    if (navigableSearchCount === 0) return;
    if (activeSearchIndex === 0) {
      goToSearchResult(navigableSearchCount - 1);
    } else {
      goToSearchResult(activeSearchIndex - 1);
    }
  }, [activeSearchIndex, goToSearchResult, navigableSearchCount]);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setSearchResults([]);
    setSearchTotal(0);
    setActiveSearchIndex(-1);
    setSearching(false);
    setJumpingToResult(false);
  }, [setActiveSearchIndex, setJumpingToResult, setSearchResults, setSearchTerm, setSearchTotal, setSearching]);

  const notifyUnreadUpdated = useCallback((count) => {
    if (!workspaceId) return;

    window.dispatchEvent(
      new CustomEvent("chatUnreadUpdated", {
        detail: {
          workspaceId,
          unreadCount: count,
        },
      })
    );
  }, [workspaceId]);

  const appendMessage = useCallback((message) => {
    if (!message) return;

    setArchiveNotice("");
    setMessages((prev) => {
      const messageId = getMessageId(message);

      if (messageId && prev.some((item) => idsEqual(getMessageId(item), messageId))) {
        return prev;
      }

      return [...prev, message];
    });
  }, [setArchiveNotice, setMessages]);

  const prependMessages = useCallback((olderMessages) => {
    if (!Array.isArray(olderMessages) || olderMessages.length === 0) return;

    setMessages((prev) => {
      const existingIds = new Set(prev.map((message) => getMessageId(message)).filter(Boolean));
      const uniqueOlderMessages = olderMessages.filter((message) => {
        const messageId = getMessageId(message);
        return !messageId || !existingIds.has(messageId);
      });

      return [...uniqueOlderMessages, ...prev];
    });
  }, [setMessages]);

  const updateMessageInList = useCallback((updatedMessage) => {
    const updatedMessageId = getMessageId(updatedMessage);

    if (!updatedMessageId) return;

    const replaceMessage = (items) =>
      items.map((message) =>
        idsEqual(getMessageId(message), updatedMessageId) ? updatedMessage : message
      );

    setMessages(replaceMessage);
    setSearchResults((prev) =>
      prev.map((result) =>
        idsEqual(getMessageId(result), updatedMessageId)
          ? {
              ...result,
              content: updatedMessage.content,
            }
          : result
      )
    );
  }, [setMessages, setSearchResults]);

  const addReaderToMessages = useCallback((reader, readAt) => {
    const readerId = getUserId(reader);

    if (!readerId) return;

    setMessages((prev) => {
      return prev.map((message) => {
        const readBy = Array.isArray(message.readBy) ? message.readBy : [];

        if (readBy.some((read) => idsEqual(getReadUserId(read), readerId))) {
          return message;
        }

        return {
          ...message,
          readBy: [
            ...readBy,
            {
              user: reader,
              readAt,
            },
          ],
        };
      });
    });
  }, [setMessages]);

  const clearTypingTimer = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  const emitTyping = useCallback((isTyping) => {
    if (!workspaceId || !socketRef.current?.connected) return;

    socketRef.current.emit("typing", {
      workspaceId,
      isTyping,
    });
  }, [workspaceId]);

  const stopTypingSoon = useCallback(() => {
    clearTypingTimer();
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
      typingTimeoutRef.current = null;
    }, 1500);
  }, [clearTypingTimer, emitTyping]);

  useEffect(() => {
    if (skipNextAutoScrollRef.current || searchNavigationRef.current) {
      skipNextAutoScrollRef.current = false;
      return;
    }

    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  useEffect(() => {
    const pendingMessageId = pendingScrollMessageIdRef.current;

    if (!pendingMessageId || !isMessageLoaded(pendingMessageId)) {
      return;
    }

    window.requestAnimationFrame(() => {
      scrollToMessageElement(pendingMessageId);
      pendingScrollMessageIdRef.current = null;
    });
  }, [messages, isMessageLoaded, scrollToMessageElement]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setPermissionNow(Date.now());
    }, 30000);

    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!workspaceId || !trimmedSearchTerm) {
      return undefined;
    }

    let cancelled = false;
    const timerId = window.setTimeout(async () => {
      setSearching(true);
      setActiveSearchIndex(-1);

      try {
        const data = await searchMessages(workspaceId, trimmedSearchTerm, 50);

        if (!cancelled) {
          const results = normalizeSearchResults(data);
          setSearchResults(results);
          setSearchTotal(getSearchTotal(data, results));
          setActiveSearchIndex(results.length > 0 ? 0 : -1);
        }
      } catch (err) {
        if (!cancelled) {
          setSearchResults([]);
          setSearchTotal(0);
          setActiveSearchIndex(-1);
          setError(err?.response?.data?.message || "Failed to search messages.");
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [workspaceId, trimmedSearchTerm]);

  useEffect(() => {
    if (activeSearchIndex < 0 || !searchResults[activeSearchIndex]) {
      return undefined;
    }

    let cancelled = false;
    searchNavigationRef.current = true;

    void (async () => {
      const result = searchResults[activeSearchIndex];
      const messageId = getMessageId(result);

      if (isMessageLoaded(messageId)) {
        if (!cancelled) {
          scrollToMessageElement(messageId);
          searchNavigationRef.current = false;
        }
      } else {
        const loaded = await ensureSearchResultLoaded(result);

        if (cancelled || !loaded) {
          searchNavigationRef.current = false;
          return;
        }

        pendingScrollMessageIdRef.current = messageId;
        window.setTimeout(() => {
          searchNavigationRef.current = false;
        }, 300);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeSearchIndex, ensureSearchResultLoaded, searchResults, isMessageLoaded, scrollToMessageElement]);

  useEffect(() => {
    if (!workspaceId) {
      return undefined;
    }

    let cancelled = false;
    const socket = createChatSocket();
    socketRef.current = socket;

    const clearUnread = async () => {
      try {
        await markChatRead(workspaceId);
        if (!cancelled) {
          setUnreadCount(0);
          notifyUnreadUpdated(0);
        }
      } catch {
        // Socket join also attempts to clear unread state.
      }
    };

    const loadChat = async () => {
      setLoading(true);
      setError("");
      setArchiveNotice("");

      try {
        const [messagesData, metaData] = await Promise.all([
          getRecentMessages(workspaceId, { limit: CHAT_PAGE_SIZE }),
          getChatMeta(workspaceId),
        ]);

        if (!cancelled) {
          setMessages(normalizeMessages(messagesData));
          setHasMoreMessages(Boolean(messagesData?.hasMore));
          setMembers(normalizeMembers(metaData));
          setUnreadCount(metaData?.unreadCount || 0);
          notifyUnreadUpdated(metaData?.unreadCount || 0);
        }

        await clearUnread();
      } catch (err) {
        if (!cancelled) {
          setMessages([]);
          setHasMoreMessages(false);
          setMembers([]);
          setError(err?.response?.data?.message || "Failed to load chat.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const joinWorkspaceChat = () => {
      socket.emit("joinWorkspaceChat", { workspaceId }, (response) => {
        if (cancelled) return;

        if (!response?.success) {
          setConnected(false);
          setError(response?.message || "Unable to join workspace chat.");
          return;
        }

        setConnected(true);
        setOnlineUserIds(normalizeOnlineUsers(response.onlineUsers));
        setUnreadCount(response.unreadCount || 0);
        notifyUnreadUpdated(response.unreadCount || 0);
      });
    };

    const handleConnect = () => {
      if (!cancelled) {
        joinWorkspaceChat();
      }
    };

    const handleDisconnect = () => {
      if (!cancelled) {
        setConnected(false);
      }
    };

    const handleReceiveMessage = (message) => {
      const messageWorkspaceId =
        typeof message?.workspace === "object"
          ? getWorkspaceId(message.workspace)
          : message?.workspace;

      if (String(messageWorkspaceId) === String(workspaceId)) {
        appendMessage(message);
        setUnreadCount(0);
        notifyUnreadUpdated(0);
      }
    };

    const handleMessageUpdated = (message) => {
      const messageWorkspaceId =
        typeof message?.workspace === "object"
          ? getWorkspaceId(message.workspace)
          : message?.workspace;

      if (String(messageWorkspaceId) === String(workspaceId)) {
        updateMessageInList(message);

        if (isDeletedMessage(message) && idsEqual(getMessageId(message), editingMessageId)) {
          setEditingMessageId(null);
          setEditDraft("");
          setSavingEdit(false);
        }
      }
    };

    const handlePresence = (presence) => {
      if (String(presence?.workspaceId) !== String(workspaceId)) return;
      setOnlineUserIds(normalizeOnlineUsers(presence.onlineUsers));
    };

    const handleTyping = (typing) => {
      if (String(typing?.workspaceId) !== String(workspaceId)) return;

      const typingUserId = getUserId(typing.user);

      if (!typingUserId || idsEqual(typingUserId, currentUserId)) {
        return;
      }

      setTypingUsers((prev) => {
        const withoutUser = prev.filter((item) => !idsEqual(getUserId(item), typingUserId));

        if (!typing.isTyping) {
          return withoutUser;
        }

        return [...withoutUser, typing.user];
      });

      if (typing.isTyping) {
        setTimeout(() => {
          setTypingUsers((prev) =>
            prev.filter((item) => !idsEqual(getUserId(item), typingUserId))
          );
        }, 2500);
      }
    };

    const handleMessagesRead = (payload) => {
      if (String(payload?.workspaceId) !== String(workspaceId)) return;
      addReaderToMessages(payload.user, payload.readAt);
    };

    const handleUnreadCount = (payload) => {
      if (String(payload?.workspaceId) !== String(workspaceId)) return;
      setUnreadCount(payload.unreadCount || 0);
      notifyUnreadUpdated(payload.unreadCount || 0);
    };

    const handleChatArchived = (payload) => {
      if (String(payload?.workspaceId) !== String(workspaceId)) return;

      const archivedByName = payload.archivedBy?.name || "the workspace owner";
      setMessages([]);
      setHasMoreMessages(false);
      setArchiveNotice(`Chat history was archived by ${archivedByName}.`);
      setUnreadCount(0);
      notifyUnreadUpdated(0);
    };

    const handleChatError = (chatError) => {
      if (!cancelled) {
        setError(chatError?.message || "Chat request failed.");
      }
    };

    const handleConnectError = (connectError) => {
      if (!cancelled) {
        setConnected(false);
        setError(connectError?.message || "Unable to connect to chat.");
      }
    };

    loadChat();

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageEdited", handleMessageUpdated);
    socket.on("messageDeleted", handleMessageUpdated);
    socket.on("workspaceChatPresence", handlePresence);
    socket.on("workspaceChatTyping", handleTyping);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("chatUnreadCount", handleUnreadCount);
    socket.on("workspaceChatArchived", handleChatArchived);
    socket.on("chatError", handleChatError);
    socket.on("connect_error", handleConnectError);
    socket.connect();

    return () => {
      cancelled = true;
      clearTypingTimer();
      emitTyping(false);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageEdited", handleMessageUpdated);
      socket.off("messageDeleted", handleMessageUpdated);
      socket.off("workspaceChatPresence", handlePresence);
      socket.off("workspaceChatTyping", handleTyping);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("chatUnreadCount", handleUnreadCount);
      socket.off("workspaceChatArchived", handleChatArchived);
      socket.off("chatError", handleChatError);
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    addReaderToMessages,
    appendMessage,
    clearTypingTimer,
    currentUserId,
    editingMessageId,
    emitTyping,
    notifyUnreadUpdated,
    updateMessageInList,
    workspaceId,
  ]);

  const handleDraftChange = (e) => {
    setDraft(e.target.value);

    if (e.target.value.trim()) {
      emitTyping(true);
      stopTypingSoon();
    } else {
      clearTypingTimer();
      emitTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const content = draft.trim();

    if (!content || sending) return;

    if (!workspaceId) {
      setError("Please select a workspace before sending a message.");
      return;
    }

    if (!socketRef.current?.connected) {
      setError("Chat is not connected yet.");
      return;
    }

    setSending(true);
    setError("");
    clearTypingTimer();
    emitTyping(false);

    socketRef.current.emit("sendMessage", { workspaceId, content }, (response) => {
      setSending(false);

      if (!response?.success) {
        setError(response?.message || "Failed to send message.");
        return;
      }

      setDraft("");
      appendMessage(response.message);
    });
  };

  const handleSendSticker = (stickerId) => {
    if (!workspaceId || !socketRef.current?.connected) return;

    setShowStickerPicker(false);

    socketRef.current.emit(
      "sendMessage",
      { workspaceId, messageType: "sticker", stickerId },
      (response) => {
        if (!response?.success) {
          setError(response?.message || "Failed to send sticker.");
          return;
        }
        appendMessage(response.message);
      }
    );
  };

  const handleAttachFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const limitBytes = 10 * 1024 * 1024;
    if (file.size > limitBytes) {
      setError("File exceeds the maximum size limit of 10MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      const response = await uploadChatFile(workspaceId, file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });

      const { fileUrl, fileName, fileSize, mimeType } = response;
      const normalizedMimeType = normalizeMimeType(mimeType || file.type);
      const messageType = isSupportedImageMedia({
        mimeType: normalizedMimeType,
        fileName: fileName || file.name,
        fileUrl,
      })
        ? "image"
        : "file";

      socketRef.current.emit(
        "sendMessage",
        {
          workspaceId,
          messageType,
          fileUrl,
          fileName,
          fileSize,
          mimeType: normalizedMimeType,
        },
        (sendRes) => {
          if (!sendRes?.success) {
            setError(sendRes?.message || "Failed to send attachment.");
            return;
          }
          appendMessage(sendRes.message);
        }
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to upload file.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const clearRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const stopRecordingTracks = useCallback((stream = recordingStreamRef.current) => {
    if (!stream) return;

    stream.getTracks().forEach((track) => track.stop());

    if (recordingStreamRef.current === stream) {
      recordingStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      recordingCancelledRef.current = true;
      clearRecordingTimer();

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          stopRecordingTracks();
        }
      } else {
        stopRecordingTracks();
      }
    };
  }, [clearRecordingTimer, stopRecordingTracks]);

  useEffect(() => {
    return () => {
      if (tempAudioUrl) {
        URL.revokeObjectURL(tempAudioUrl);
      }
    };
  }, [tempAudioUrl]);

  const startVoiceRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Audio recording is unsupported on this browser.");
      return;
    }

    let stream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      recordingCancelledRef.current = false;
      audioChunksRef.current = [];
      setError("");

      if (tempAudioUrl) {
        URL.revokeObjectURL(tempAudioUrl);
      }
      setTempAudioBlob(null);
      setTempAudioUrl("");
      setTempAudioDuration(0);

      let options = {};
      let mimeType = "";
      const canCheckMimeType = typeof MediaRecorder.isTypeSupported === "function";

      if (canCheckMimeType && MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
        options = { mimeType };
      } else if (canCheckMimeType && MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
        options = { mimeType };
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      const actualMimeType = mediaRecorder.mimeType || mimeType || "audio/webm";

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        recordingCancelledRef.current = true;
        stopRecordingTracks(stream);
        clearRecordingTimer();
        setIsRecording(false);
        setRecordingDuration(0);
        setError("Audio recording failed. Please try again.");
      };

      mediaRecorder.onstop = async () => {
        stopRecordingTracks(stream);
        mediaRecorderRef.current = null;
        clearRecordingTimer();

        if (recordingCancelledRef.current) {
          audioChunksRef.current = [];
          startTimeRef.current = null;
          return;
        }

        if (!audioChunksRef.current || audioChunksRef.current.length === 0) {
          setError("No audio data recorded.");
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
        if (audioBlob.size === 0) {
          setError("Recorded audio is empty.");
          return;
        }

        const duration = startTimeRef.current
          ? Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
          : 0;

        if (duration <= 0) {
          setError("Audio note duration is too short.");
          return;
        }

        setTempAudioBlob(audioBlob);
        setTempAudioUrl(URL.createObjectURL(audioBlob));
        setTempAudioDuration(duration);
        startTimeRef.current = null;
      };

      startTimeRef.current = Date.now();
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      stopRecordingTracks(stream);
      mediaRecorderRef.current = null;
      recordingCancelledRef.current = false;
      setError("Microphone permission denied or audio recording is unsupported on this browser.");
    }
  };

  const stopVoiceRecording = () => {
    recordingCancelledRef.current = false;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      if (typeof mediaRecorderRef.current.requestData === "function") {
        try {
          mediaRecorderRef.current.requestData();
        } catch {
          // ignore browsers that cannot flush recorder data here
        }
      }
      mediaRecorderRef.current.stop();
    } else {
      stopRecordingTracks();
      mediaRecorderRef.current = null;
    }

    setIsRecording(false);
    clearRecordingTimer();
  };

  const cancelVoiceRecording = () => {
    recordingCancelledRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      audioChunksRef.current = [];
      mediaRecorderRef.current.stop();
    } else {
      stopRecordingTracks();
      mediaRecorderRef.current = null;
    }
    if (tempAudioUrl) {
      URL.revokeObjectURL(tempAudioUrl);
    }
    setTempAudioBlob(null);
    setTempAudioUrl("");
    setTempAudioDuration(0);
    setIsRecording(false);
    setRecordingDuration(0);
    startTimeRef.current = null;
    clearRecordingTimer();
  };

  const sendRecordedVoiceNote = async () => {
    if (!tempAudioBlob || tempAudioBlob.size === 0) {
      setError("No recorded audio to send.");
      return;
    }

    if (!tempAudioDuration || tempAudioDuration <= 0) {
      setError("Recorded audio is too short to send.");
      return;
    }

    if (!workspaceId) {
      setError("Please select a workspace before sending.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      const mimeType = tempAudioBlob.type || "audio/webm";
      const fileExt = getAudioExtension(mimeType);
      const audioFile = new File([tempAudioBlob], `voice_note_${Date.now()}.${fileExt}`, {
        type: mimeType,
      });

      const response = await uploadChatFile(workspaceId, audioFile, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });

      const { fileUrl, fileName, fileSize, mimeType: uploadedMimeType } = response;
      const duration = tempAudioDuration;

      socketRef.current.emit(
        "sendMessage",
        {
          workspaceId,
          messageType: "audio",
          fileUrl,
          fileName,
          fileSize,
          mimeType: uploadedMimeType || normalizeMimeType(mimeType) || "audio/webm",
          audioDuration: duration,
        },
        (sendRes) => {
          if (!sendRes?.success) {
            setError(sendRes?.message || "Failed to send voice note.");
            return;
          }
          appendMessage(sendRes.message);

          if (tempAudioUrl) {
            URL.revokeObjectURL(tempAudioUrl);
          }
          setTempAudioBlob(null);
          setTempAudioUrl("");
          setTempAudioDuration(0);
        }
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to upload voice note.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const canEditMessage = (message) => {
    if (isDeletedMessage(message)) return false;
    if (getMessageKind(message) !== "text") return false;
    if (!idsEqual(getSenderId(message), currentUserId)) return false;

    return isWithinMessageWindow(message, EDIT_MESSAGE_WINDOW_MS, permissionNow);
  };

  const canDeleteMessage = (message) => {
    if (isDeletedMessage(message)) return false;

    if (currentMemberRole === "owner") {
      return true;
    }

    if (!idsEqual(getSenderId(message), currentUserId)) {
      return false;
    }

    return isWithinMessageWindow(message, DELETE_MESSAGE_WINDOW_MS, permissionNow);
  };

  const beginEditingMessage = (message) => {
    if (!canEditMessage(message)) return;

    setError("");
    setEditingMessageId(getMessageId(message));
    setEditDraft(message.content || "");
  };

  const cancelEditingMessage = () => {
    setEditingMessageId(null);
    setEditDraft("");
    setSavingEdit(false);
  };

  const requestMessageEdit = (messageId, content) => {
    if (socketRef.current?.connected) {
      return new Promise((resolve, reject) => {
        socketRef.current.emit("editMessage", { workspaceId, messageId, content }, (response) => {
          if (!response?.success) {
            reject(new Error(response?.message || "Failed to edit message."));
            return;
          }

          resolve(response);
        });
      });
    }

    return editMessageRequest(workspaceId, messageId, content);
  };

  const requestMessageDelete = (messageId) => {
    if (socketRef.current?.connected) {
      return new Promise((resolve, reject) => {
        socketRef.current.emit("deleteMessage", { workspaceId, messageId }, (response) => {
          if (!response?.success) {
            reject(new Error(response?.message || "Failed to delete message."));
            return;
          }

          resolve(response);
        });
      });
    }

    return deleteMessageRequest(workspaceId, messageId);
  };

  const handleEditSubmit = async (e, message) => {
    e.preventDefault();

    const messageId = getMessageId(message);
    const content = editDraft.trim();

    if (!messageId || savingEdit) return;

    if (!content) {
      setError("Message content is required.");
      return;
    }

    if (content.length > CHAT_MESSAGE_MAX_LENGTH) {
      setError(`Message cannot exceed ${CHAT_MESSAGE_MAX_LENGTH} characters.`);
      return;
    }

    if (content === message.content) {
      cancelEditingMessage();
      return;
    }

    setSavingEdit(true);
    setError("");

    try {
      const response = await requestMessageEdit(messageId, content);
      updateMessageInList(response.message);
      cancelEditingMessage();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to edit message.");
      setSavingEdit(false);
    }
  };

  const handleDeleteMessage = async (message) => {
    const messageId = getMessageId(message);

    if (!messageId || deletingMessageId || !canDeleteMessage(message)) return;

    const confirmed = await confirmDelete({
      title: "Delete message?",
      text: "This keeps the message in chat as a deleted-message placeholder.",
      confirmButtonText: "Delete",
    });

    if (!confirmed) return;

    setDeletingMessageId(messageId);
    setError("");

    try {
      const response = await requestMessageDelete(messageId);
      updateMessageInList(response.message);

      if (idsEqual(editingMessageId, messageId)) {
        cancelEditingMessage();
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to delete message.");
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleLoadOlderMessages = async () => {
    if (!workspaceId || loadingOlder || messages.length === 0) return;

    const oldestMessage = messages[0];
    const container = messageListRef.current;
    const previousScrollHeight = container?.scrollHeight || 0;
    const previousScrollTop = container?.scrollTop || 0;

    setLoadingOlder(true);
    setError("");

    try {
      const data = await getRecentMessages(workspaceId, {
        limit: CHAT_PAGE_SIZE,
        beforeMessageId: getMessageId(oldestMessage),
        beforeDate: oldestMessage?.createdAt,
      });
      const olderMessages = normalizeMessages(data);

      skipNextAutoScrollRef.current = true;
      prependMessages(olderMessages);
      setHasMoreMessages(Boolean(data?.hasMore));

      setTimeout(() => {
        if (!container) return;

        const nextScrollHeight = container.scrollHeight;
        container.scrollTop = nextScrollHeight - previousScrollHeight + previousScrollTop;
      }, 0);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load older messages.");
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleStartNewChat = async () => {
    if (!workspaceId || archiving) return;

    const confirmed = await confirmAction({
      title: "Start New Chat",
      text: "Archive the current workspace chat history and start with an empty conversation?",
      confirmButtonText: "Start New Chat",
    });

    if (!confirmed) return;

    setArchiving(true);
    setError("");

    const handleArchiveSuccess = (archive, archivedBy = user) => {
      setMessages([]);
      setHasMoreMessages(false);
      cancelEditingMessage();
      setArchiveNotice(`Chat history was archived by ${archivedBy?.name || "you"}.`);
      setUnreadCount(0);
      notifyUnreadUpdated(0);
      showSuccess("Chat history archived. New messages will start a fresh chat.");
    };

    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit("startNewChat", { workspaceId }, (response) => {
          setArchiving(false);

          if (!response?.success) {
            setError(response?.message || "Failed to start a new chat.");
            showError(response?.message || "Failed to start a new chat.");
            return;
          }

          handleArchiveSuccess(response.archive);
        });
      } else {
        const data = await startNewChatRequest(workspaceId);
        handleArchiveSuccess(data?.archive);
        setArchiving(false);
      }
    } catch (err) {
      setArchiving(false);
      showError(err?.response?.data?.message || "Failed to start a new chat.");
    }
  };

  const getSeenLabel = (message) => {
    const otherReaders = (message.readBy || []).filter((read) => {
      const readerId = getReadUserId(read);
      return readerId && !idsEqual(readerId, currentUserId);
    });

    if (otherReaders.length === 0) {
      return "Sent";
    }

    if (otherReaders.length === 1) {
      return "Seen";
    }

    return `Seen by ${otherReaders.length}`;
  };

  const typingLabel = useMemo(() => {
    if (typingUsers.length === 0) return "";
    if (typingUsers.length === 1) return `${typingUsers[0].name} is typing...`;
    return `${typingUsers.length} people are typing...`;
  }, [typingUsers]);

  if (!workspace) {
    return (
      <DashboardLayout>
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Workspace Chat
          </h2>
          <p className="mt-1 text-[14px] text-slate-500 dark:text-slate-400">
            Chat with members in the selected workspace.
          </p>
        </div>

        <div className="mt-10">
          <EmptyState
            title="No workspace selected"
            description="Please select a workspace to open chat."
            action="Go to Workspaces"
            onAction={() => navigate("/workspaces")}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Workspace Chat
          </h2>
          <p className="mt-1 text-[14px] text-slate-500 dark:text-slate-400">
            {workspaceName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <span className="inline-flex h-9 items-center rounded-lg border border-red-200 bg-red-50 px-3 text-[12px] font-bold text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {unreadCount} unread
            </span>
          )}

          {canStartNewChat && (
            <button
              type="button"
              onClick={handleStartNewChat}
              disabled={archiving}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Archive size={14} />
              {archiving ? "Archiving..." : "Start New Chat"}
            </button>
          )}

          <div
            className={`inline-flex h-9 w-fit items-center gap-2 rounded-lg border px-3 text-[12px] font-semibold ${
              connected
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                : "border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
            }`}
          >
            {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {connectionLabel}
          </div>
        </div>
      </div>

      {isOnlyMemberWorkspace && (
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
          <span>
            You are the only member in this workspace. Invite members to start a team conversation.
          </span>
          {canInviteMembers && (
            <button
              type="button"
              onClick={() => navigate("/members")}
              className="inline-flex h-9 w-fit items-center gap-2 rounded-lg bg-amber-600 px-3 text-[12px] font-bold text-white transition hover:bg-amber-700"
            >
              <UserPlus size={14} />
              Invite members
            </button>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section className="flex min-h-[560px] max-h-[calc(100vh-180px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800/70 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                <MessageSquare size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-bold text-slate-900 dark:text-white">
                  {workspaceName}
                </h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                  {isSearchMode
                    ? searching
                      ? "Searching..."
                      : searchTotal > searchResults.length
                        ? `${searchTotal} matches (${searchResults.length} loaded)`
                        : searchTotal > 0
                          ? `${searchTotal} matches`
                          : "No matches"
                    : "Recent workspace messages"}
                </p>
              </div>
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              {isSearchMode && (
                <div className="flex items-center gap-1">
                  <span className="min-w-[52px] text-center text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                    {searchCounterLabel}
                  </span>
                  <button
                    type="button"
                    title="Previous result"
                    aria-label="Previous result"
                    onClick={handlePreviousSearchResult}
                    disabled={
                      searching ||
                      jumpingToResult ||
                      navigableSearchCount === 0
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    title="Next result"
                    aria-label="Next result"
                    onClick={handleNextSearchResult}
                    disabled={
                      searching ||
                      jumpingToResult ||
                      navigableSearchCount === 0
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              )}

              <div className="relative w-full sm:w-72">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      clearSearch();
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="Search messages"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                {(searchTerm || searchFocused) && (
                  <button
                    type="button"
                    title="Clear search"
                    aria-label="Clear search"
                    onMouseDown={(e) => {
                      e.preventDefault();
                    }}
                    onClick={() => {
                      clearSearch();
                      if (!searchTerm) {
                        document.activeElement?.blur();
                      }
                    }}
                    className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 sm:px-6">
              {error}
            </div>
          )}

          {archiveNotice && (
            <div className="border-b border-indigo-100 bg-indigo-50 px-4 py-3 text-[13px] font-medium text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300 sm:px-6">
              {archiveNotice}
            </div>
          )}

          <div ref={messageListRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            {loading && messages.length === 0 ? (
              <LoadingState message="Loading chat..." />
            ) : messages.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <EmptyState
                  icon={<MessageSquare size={44} className="mb-4 text-slate-300 dark:text-slate-600" />}
                  title={
                    isOnlyMemberWorkspace
                      ? "You are the only member in this workspace"
                      : "No messages yet"
                  }
                  description={
                    isOnlyMemberWorkspace
                      ? "Invite members to start a team conversation."
                      : "Start the workspace conversation with a quick update."
                  }
                  action={isOnlyMemberWorkspace && canInviteMembers ? "Invite members" : undefined}
                  onAction={isOnlyMemberWorkspace && canInviteMembers ? () => navigate("/members") : undefined}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {hasMoreMessages && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleLoadOlderMessages}
                      disabled={loadingOlder || jumpingToResult}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {loadingOlder ? "Loading..." : "Load older messages"}
                    </button>
                  </div>
                )}

                {messages.map((message, index) => {
                  const messageId = getMessageId(message);
                  const previousMessage = messages[index - 1];
                  const dateSeparatorLabel = getDateSeparatorLabel(message, previousMessage);
                  const sender = getSender(message);
                  const senderName = sender?.name || "Unknown User";
                  const isOwnMessage = idsEqual(getSenderId(message), currentUserId);
                  const messageDeleted = isDeletedMessage(message);
                  const editingThisMessage = idsEqual(editingMessageId, messageId);
                  const canEditThisMessage = canEditMessage(message);
                  const canDeleteThisMessage = canDeleteMessage(message);
                  const showMessageActions = canEditThisMessage || canDeleteThisMessage;
                  const displayContent = messageDeleted ? DELETED_MESSAGE_TEXT : message.content;
                  const displayContentText = String(displayContent || "");
                  const messageKind = getMessageKind(message);
                  const mediaUrl = getMessageMediaUrl(message);
                  const authenticatedMediaUrl = getAuthenticatedUrl(mediaUrl);
                  const isActiveSearchResult =
                    isSearchMode && activeSearchMessageId && idsEqual(messageId, activeSearchMessageId);
                  const shouldHighlightSearch =
                    isSearchMode &&
                    !messageDeleted &&
                    displayContentText.toLowerCase().includes(trimmedSearchTerm.toLowerCase());
                  const bubbleClassName = messageDeleted
                    ? "whitespace-pre-wrap break-words rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-[13px] italic leading-6 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                    : messageKind === "sticker"
                      ? `text-5xl select-none p-1 transition-transform hover:scale-110 active:scale-95 duration-200 ${
                          isActiveSearchResult ? "ring-2 ring-yellow-400 rounded-xl" : ""
                        }`
                      : `whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[13px] leading-6 shadow-sm ${
                          isOwnMessage
                            ? "rounded-br-md bg-indigo-600 text-white dark:bg-indigo-500"
                            : "rounded-bl-md border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                        } ${isActiveSearchResult ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900" : ""}`;

                  return (
                    <Fragment key={messageId || `${senderName}-${message.createdAt}`}>
                      {dateSeparatorLabel && (
                        <div className="flex justify-center">
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                            {dateSeparatorLabel}
                          </span>
                        </div>
                      )}

                      <div
                        ref={(element) => {
                          if (!messageId) return;

                          if (element) {
                            messageElementRefs.current.set(String(messageId), element);
                          } else {
                            messageElementRefs.current.delete(String(messageId));
                          }
                        }}
                        data-message-id={messageId || undefined}
                        className={`flex gap-3 ${isOwnMessage ? "justify-end" : "justify-start"} ${
                          isActiveSearchResult ? "rounded-xl bg-yellow-50/70 px-1 py-1 dark:bg-yellow-500/10" : ""
                        }`}
                      >
                      {!isOwnMessage && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[12px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {getInitials(senderName)}
                        </div>
                      )}

                      <div className={`max-w-[82%] sm:max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"} flex flex-col`}>
                        <div className="mb-1 flex max-w-full items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="truncate font-semibold">
                            {isOwnMessage ? "You" : senderName}
                          </span>
                          <span className="shrink-0">{formatMessageTime(message.createdAt)}</span>
                          {message.editedAt && !messageDeleted && (
                            <span className="shrink-0 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                              edited
                            </span>
                          )}
                        </div>

                        {editingThisMessage ? (
                          <form
                            onSubmit={(e) => handleEditSubmit(e, message)}
                            className="w-full rounded-2xl border border-indigo-200 bg-white p-2 shadow-sm dark:border-indigo-900/70 dark:bg-slate-950"
                          >
                            <textarea
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              maxLength={CHAT_MESSAGE_MAX_LENGTH}
                              rows={3}
                              autoFocus
                              className="min-h-20 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] leading-6 text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                            />
                            <div className="mt-2 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                title="Cancel edit"
                                aria-label="Cancel edit"
                                onClick={cancelEditingMessage}
                                disabled={savingEdit}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                              >
                                <X size={14} />
                              </button>
                              <button
                                type="submit"
                                title="Save edit"
                                aria-label="Save edit"
                                disabled={savingEdit || !editDraft.trim()}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className={bubbleClassName}>
                            {messageDeleted ? (
                              displayContent
                            ) : messageKind === "image" && mediaUrl ? (
                              <div className="flex max-w-full flex-col gap-1">
                                <img
                                  src={authenticatedMediaUrl}
                                  alt={message.fileName || "Chat image"}
                                  loading="lazy"
                                  className="block max-h-72 max-w-full rounded-lg object-contain cursor-pointer transition hover:opacity-95 sm:max-w-sm"
                                  onClick={() => window.open(authenticatedMediaUrl, "_blank", "noopener,noreferrer")}
                                  onError={() => setError("Image preview could not be loaded. Try opening it again or refreshing the chat.")}
                                />
                                {message.fileName && (
                                  <span className="text-[11px] opacity-70 truncate block max-w-xs">
                                    {message.fileName}
                                  </span>
                                )}
                              </div>
                            ) : messageKind === "file" && mediaUrl ? (
                              <div className="flex items-center gap-3 min-w-[200px] max-w-sm rounded-lg bg-slate-100/50 p-2.5 dark:bg-slate-900/50">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                                  <FileText size={20} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                                    {message.fileName}
                                  </p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {formatFileSize(message.fileSize)}
                                  </p>
                                </div>
                                <a
                                  href={getAuthenticatedUrl(mediaUrl, true)}
                                  download={message.fileName}
                                  title="Download file"
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-slate-200/50 hover:text-slate-850 dark:hover:bg-slate-800/50 dark:hover:text-slate-150 text-slate-500 dark:text-slate-400 transition"
                                >
                                  <Download size={16} />
                                </a>
                              </div>
                            ) : messageKind === "sticker" ? (
                              STICKER_MAP[message.stickerId] || "✨"
                            ) : messageKind === "audio" && mediaUrl ? (
                              <div className="flex flex-col gap-1.5 min-w-[240px]">
                                <audio
                                  controls
                                  preload="metadata"
                                  className="h-9 w-full outline-none"
                                  onError={() => setError("Voice note could not be loaded. Please refresh the chat and try again.")}
                                >
                                  <source src={authenticatedMediaUrl} type={normalizeMimeType(message.mimeType) || undefined} />
                                </audio>
                                {(message.audioDuration || message.duration) && (
                                  <span className="text-[10px] opacity-70">
                                    Voice note • {formatDuration(message.audioDuration || message.duration)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              shouldHighlightSearch
                                ? highlightMessageContent(
                                    displayContent,
                                    trimmedSearchTerm,
                                    isActiveSearchResult
                                  )
                                : displayContent
                            )}
                          </div>
                        )}

                        {showMessageActions && !editingThisMessage && (
                          <div className={`mt-1 flex items-center gap-1 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                            {canEditThisMessage && (
                              <button
                                type="button"
                                title="Edit message"
                                aria-label="Edit message"
                                onClick={() => beginEditingMessage(message)}
                                disabled={savingEdit || idsEqual(deletingMessageId, messageId)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                              >
                                <Edit3 size={14} />
                              </button>
                            )}
                            {canDeleteThisMessage && (
                              <button
                                type="button"
                                title="Delete message"
                                aria-label="Delete message"
                                onClick={() => handleDeleteMessage(message)}
                                disabled={savingEdit || idsEqual(deletingMessageId, messageId)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        )}

                        {isOwnMessage && (
                          <span className="mt-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                            {getSeenLabel(message)}
                          </span>
                        )}
                      </div>
                      </div>
                    </Fragment>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="min-h-7 px-4 text-[12px] font-medium text-indigo-500 dark:text-indigo-300 sm:px-6">
            {typingLabel}
          </div>

          <form
            onSubmit={handleSubmit}
            className="relative border-t border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800/70 dark:bg-slate-950/30 sm:p-4"
          >
            {showStickerPicker && (
              <div className="absolute bottom-20 left-4 z-50 grid grid-cols-4 gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-950 sm:left-6">
                {Object.entries(STICKER_MAP).map(([id, emoji]) => (
                  <button
                    key={id}
                    type="button"
                    title={`Send sticker ${id}`}
                    onClick={() => handleSendSticker(id)}
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-2xl hover:bg-slate-100 transition active:scale-[0.92] dark:hover:bg-slate-800"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900">
              <input
                type="file"
                id="chat-file-upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                onChange={handleAttachFile}
                className="hidden"
                disabled={isUploading || isRecording || !connected}
              />

              <input
                type="file"
                id="chat-image-upload"
                accept="image/*"
                onChange={handleAttachFile}
                className="hidden"
                disabled={isUploading || isRecording || !connected}
              />

              {!isRecording && !isUploading && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowStickerPicker((prev) => !prev)}
                    disabled={!connected}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition dark:text-slate-400 dark:hover:bg-slate-800"
                    title="Send sticker"
                  >
                    <Smile size={18} />
                  </button>

                  <label
                    htmlFor="chat-image-upload"
                    className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition dark:text-slate-400 dark:hover:bg-slate-800"
                    title="Attach picture"
                  >
                    <Image size={18} />
                  </label>

                  <label
                    htmlFor="chat-file-upload"
                    className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition dark:text-slate-400 dark:hover:bg-slate-800"
                    title="Attach document/file"
                  >
                    <Paperclip size={18} />
                  </label>
                </>
              )}

              {isUploading ? (
                <div className="flex-1 flex items-center gap-2.5 px-3 py-2 text-[13px] text-indigo-600 dark:text-indigo-400 font-semibold select-none">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  <span>Uploading file... {uploadProgress}%</span>
                </div>
              ) : isRecording ? (
                <div className="flex-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 px-2 py-2 text-[13px] text-red-500 font-semibold animate-pulse select-none">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                    <span>Recording audio: {formatDuration(recordingDuration)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={cancelVoiceRecording}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition active:scale-95"
                      title="Cancel recording"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={stopVoiceRecording}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition active:scale-95"
                      title="Stop recording"
                    >
                      <Square size={16} />
                    </button>
                  </div>
                </div>
              ) : tempAudioBlob ? (
                <div className="flex-1 flex items-center justify-between gap-3">
                  <div className="flex-1 flex items-center gap-2">
                    <audio src={tempAudioUrl} controls className="h-9 w-full outline-none" />
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                      Preview ({formatDuration(tempAudioDuration)})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={cancelVoiceRecording}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition active:scale-95"
                      title="Delete recording"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={sendRecordedVoiceNote}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition active:scale-95"
                      title="Send voice note"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <textarea
                    value={draft}
                    onChange={handleDraftChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    rows={1}
                    maxLength={2000}
                    placeholder="Write a message..."
                    className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />

                  {!isRecording && !isUploading && (
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      disabled={!connected}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition dark:text-slate-400 dark:hover:bg-slate-800"
                      title="Record voice note"
                    >
                      <Mic size={18} />
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={!draft.trim() || sending || !connected}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    aria-label="Send message"
                    title="Send message"
                  >
                    <Send size={16} />
                  </button>
                </>
              )}
            </div>
          </form>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-slate-900 dark:text-white">
              Members
            </h3>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {onlineUserIds.length}/{members.length} online
            </span>
          </div>

          <div className="space-y-3">
            {members.map((member) => {
              const memberUser = getMemberUser(member);
              const memberUserId = getMemberUserId(member);
              const memberName = memberUser?.name || "Unknown User";
              const isOnline = onlineSet.has(String(memberUserId));

              return (
                <div key={member._id || memberUserId} className="flex items-center gap-3">
                  <div className="relative">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-[12px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {getInitials(memberName)}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${
                        isOnline ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                      {memberName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isOnline ? "Online" : "Offline"} · {member.role}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}

export default Chat;
