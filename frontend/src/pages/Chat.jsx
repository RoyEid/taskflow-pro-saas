import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Archive,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  Image,
  Maximize2,
  Mic,
  MessageSquare,
  Paperclip,
  Pause,
  Play,
  Search,
  Send,
  Smile,
  Square,
  Trash2,
  UserPlus,
  Users,
  Wifi,
  WifiOff,
  X,
  AlertCircle,
  Loader2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import DashboardLayout from "../layouts/DashboardLayout";
import { easeOutFast } from "../components/ui3d/motionTokens";

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

const EDIT_MESSAGE_WINDOW_MS = 15 * 60 * 1000;
const DELETE_MESSAGE_WINDOW_MS = 60 * 60 * 1000;
const DELETED_MESSAGE_TEXT = "This message was deleted.";
const CHAT_MESSAGE_MAX_LENGTH = 2000;

function normalizeMimeType(mimeType) {
  if (!mimeType) return "";
  return String(mimeType).toLowerCase().trim();
}

function isSupportedImageMedia({ mimeType, fileName, fileUrl }) {
  if (mimeType && mimeType.startsWith("image/")) return true;
  const nameOrUrl = String(fileName || fileUrl || "").toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(nameOrUrl);
}

function getAudioExtension(mimeType) {
  const norm = normalizeMimeType(mimeType);
  if (norm.includes("webm")) return "webm";
  if (norm.includes("mp3")) return "mp3";
  if (norm.includes("wav")) return "wav";
  if (norm.includes("ogg")) return "ogg";
  if (norm.includes("aac")) return "aac";
  if (norm.includes("m4a")) return "m4a";
  if (norm.includes("mp4")) return "mp4";
  return "webm";
}

function getMessageKind(message) {
  if (message?.isDeleted || message?.deletedAt) return "deleted";
  if (message?.messageType) return message.messageType;
  if (message?.fileUrl) {
    const mime = normalizeMimeType(message.mimeType);
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("audio/")) return "audio";
    return "file";
  }
  if (message?.stickerId) return "sticker";
  return "text";
}

function getMessageMediaUrl(message) {
  return message?.fileUrl || message?.mediaUrl || message?.url || "";
}

function getManagedAttachmentUrl(url) {
  const rawUrl = String(url || "").trim();

  if (!rawUrl || rawUrl.startsWith("blob:") || rawUrl.startsWith("data:")) {
    return null;
  }

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const apiOrigin = apiBase.replace(/\/api\/?$/, "");

  try {
    const parsedUrl = /^https?:\/\//i.test(rawUrl)
      ? new URL(rawUrl)
      : new URL(rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`, apiOrigin);

    if (
      !/^\/api\/workspaces\/[^/]+\/messages\/attachments\/[^/]+$/i.test(
        parsedUrl.pathname,
      )
    ) {
      return null;
    }

    return new URL(
      `${parsedUrl.pathname}${parsedUrl.search}`,
      apiOrigin,
    ).toString();
  } catch {
    return null;
  }
}

async function fetchAttachmentBlob(url) {
  const requestUrl = getManagedAttachmentUrl(url);

  if (!requestUrl) {
    throw new Error("Attachment is not hosted by TaskFlow Pro.");
  }

  const token = getToken();
  if (!token) {
    throw new Error("Please sign in again to open this attachment.");
  }

  const response = await fetch(requestUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let message = `Attachment request failed (${response.status}).`;
    try {
      const errorBody = await response.json();
      message = errorBody?.message || errorBody?.error || message;
    } catch {
      // The endpoint may return an empty or binary error response.
    }
    throw new Error(message);
  }

  return response.blob();
}

function useAuthenticatedMediaUrl(url) {
  const [retryKey, setRetryKey] = useState(0);
  const [result, setResult] = useState({
    requestKey: "",
    resolvedUrl: "",
    error: null,
  });
  const rawUrl = String(url || "").trim();
  const managedUrl = getManagedAttachmentUrl(rawUrl);
  const requestKey = managedUrl ? `${managedUrl}:${retryKey}` : "";

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    if (!managedUrl) {
      return undefined;
    }

    fetchAttachmentBlob(managedUrl)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setResult({ requestKey, resolvedUrl: objectUrl, error: null });
      })
      .catch((error) => {
        if (!active) return;
        setResult({ requestKey, resolvedUrl: "", error });
      });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [managedUrl, requestKey]);

  if (!managedUrl) {
    return {
      resolvedUrl: rawUrl,
      loading: false,
      error: rawUrl ? null : new Error("Attachment URL is missing."),
      retry: () => setRetryKey((key) => key + 1),
    };
  }

  const currentResult = result.requestKey === requestKey;

  return {
    resolvedUrl: currentResult ? result.resolvedUrl : "",
    loading: !currentResult,
    error: currentResult ? result.error : null,
    retry: () => setRetryKey((key) => key + 1),
  };
}

async function downloadFile(url, fileName) {
  if (!url) throw new Error("Attachment URL is missing.");

  const managedUrl = getManagedAttachmentUrl(url);
  let objectUrl = "";
  let downloadUrl = url;

  if (managedUrl) {
    const blob = await fetchAttachmentBlob(managedUrl);
    objectUrl = URL.createObjectURL(blob);
    downloadUrl = objectUrl;
  }

  const a = document.createElement("a");
  a.href = downloadUrl;
  if (fileName) {
    a.download = fileName;
  }
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (objectUrl) {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}

async function openFile(url) {
  if (!url) throw new Error("Attachment URL is missing.");

  const managedUrl = getManagedAttachmentUrl(url);
  if (!managedUrl) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  const previewWindow = window.open("about:blank", "_blank");
  if (previewWindow) {
    previewWindow.opener = null;
  }

  try {
    const blob = await fetchAttachmentBlob(managedUrl);
    const objectUrl = URL.createObjectURL(blob);

    if (previewWindow) {
      previewWindow.location.replace(objectUrl);
    } else {
      const a = document.createElement("a");
      a.href = objectUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    previewWindow?.close();
    throw error;
  }
}

const WAVEFORM_BARS = [
  35, 60, 45, 80, 55, 90, 70, 40, 65, 85, 50, 75, 40, 95, 60, 80, 45, 70, 50,
  85, 40, 60, 75, 50,
];

function formatAudioTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0 || seconds === Infinity) {
    return "0:00";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function CustomAudioPlayer({ src, duration, isOwnMessage, isPreview = false }) {
  const media = useAuthenticatedMediaUrl(src);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      setLoadError(false);
      audioRef.current.play().catch((err) => {
        console.error("Audio playback error:", err);
        setIsBuffering(false);
        setLoadError(true);
      });
    }
  };

  const retryPlayback = (e) => {
    e.stopPropagation();

    if (media.error) {
      setLoadError(false);
      setIsBuffering(true);
      media.retry();
      return;
    }

    if (!audioRef.current) return;

    setLoadError(false);
    setIsBuffering(true);
    audioRef.current.load();
    audioRef.current.play().catch((err) => {
      console.error("Audio playback retry error:", err);
      setIsBuffering(false);
      setLoadError(true);
    });
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (
        !totalDuration &&
        audioRef.current.duration &&
        audioRef.current.duration !== Infinity
      ) {
        setTotalDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (
      audioRef.current &&
      audioRef.current.duration &&
      audioRef.current.duration !== Infinity
    ) {
      setTotalDuration(audioRef.current.duration);
    }
    setLoadError(false);
    setIsBuffering(false);
  };

  const handleSeek = (e, barIndex) => {
    e.stopPropagation();
    if (!audioRef.current || !totalDuration) return;

    const fraction = (barIndex + 1) / WAVEFORM_BARS.length;
    const newTime = fraction * totalDuration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progressFraction = totalDuration > 0 ? currentTime / totalDuration : 0;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl p-2.5 sm:p-3 transition-all ${
        isPreview
          ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
          : isOwnMessage
            ? "bg-white/10 text-white backdrop-blur-xs"
            : "bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
      }`}
    >
      <audio
        ref={audioRef}
        src={media.resolvedUrl || undefined}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onError={() => {
          setIsPlaying(false);
          setIsBuffering(false);
          setLoadError(true);
        }}
        preload="metadata"
      />

      {loadError || media.error ? (
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span className="truncate text-[12px] font-semibold">
              Voice note unavailable
            </span>
          </div>
          <button
            type="button"
            onClick={retryPlayback}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition hover:bg-black/5 dark:hover:bg-white/10"
          >
            <RotateCcw size={12} />
            Try again
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={togglePlay}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition active:scale-95 shadow-sm ${
              isOwnMessage
                ? "bg-white text-indigo-700 hover:bg-slate-100"
                : "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            }`}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isBuffering || media.loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={16} className="fill-current" />
            ) : (
              <Play size={16} className="fill-current ml-0.5" />
            )}
          </button>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div
              className="flex h-6 items-center gap-0.5 cursor-pointer py-1"
              title="Seek audio"
            >
              {WAVEFORM_BARS.map((heightPercent, idx) => {
                const barFraction = (idx + 1) / WAVEFORM_BARS.length;
                const isPlayed = barFraction <= progressFraction;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => handleSeek(e, idx)}
                    style={{ height: `${heightPercent}%` }}
                    className={`w-1 rounded-full transition-all duration-150 hover:opacity-100 ${
                      isPlayed
                        ? isOwnMessage
                          ? "bg-white opacity-100"
                          : "bg-indigo-600 dark:bg-indigo-400 opacity-100"
                        : isOwnMessage
                          ? "bg-white/40 hover:bg-white/70"
                          : "bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
                    }`}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] font-medium opacity-80 tabular-nums">
              <span>{formatAudioTime(currentTime)}</span>
              <span>{formatAudioTime(totalDuration)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import { getToken } from "../utils/tokenStorage";
import useAuth from "../context/useAuth";
import useWorkspace from "../context/useWorkspace";
import useChatSocket from "../context/useChatSocket";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import {
  CHAT_PAGE_SIZE,
  deleteMessage as deleteMessageRequest,
  editMessage as editMessageRequest,
  getChatMeta,
  getMessageContext,
  getRecentMessages,
  searchMessages,
  startNewChat as startNewChatRequest,
  uploadChatFile,
} from "../services/chatService";
import {
  confirmAction,
  confirmDelete,
  showError,
  showSuccess,
} from "../utils/alerts";
/*
 * Chat image thumbnail.
 *
 * A failed image used to call setError() on the page, which raised a single
 * global banner ("Image preview could not be loaded...") while the broken
 * image itself stayed in place looking like it might still work. Failure is
 * now local to the image that failed, and recoverable.
 */
function ChatImage({ src, alt, onOpen, isOwnMessage }) {
  const media = useAuthenticatedMediaUrl(src);
  const [status, setStatus] = useState("loading");
  const [reloadKey, setReloadKey] = useState(0);

  const handleRetry = (event) => {
    event.stopPropagation();
    setStatus("loading");
    media.retry();
    setReloadKey((key) => key + 1);
  };

  if (status === "error" || media.error) {
    return (
      <div
        className={`flex w-full max-w-full flex-col items-start gap-2 rounded-lg p-3 sm:max-w-sm ${
          isOwnMessage
            ? "bg-white/10 text-white"
            : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
        }`}
      >
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <p className="text-[12px] font-semibold">Image unavailable</p>
        </div>
        <p className="text-[11px] opacity-80 break-all">{alt}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition hover:bg-black/5 dark:hover:bg-white/10"
        >
          <RotateCcw size={12} />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-fit max-w-full sm:max-w-sm overflow-hidden rounded-lg">
      {status === "loading" && (
        <div className="tf-shimmer absolute inset-0 flex h-40 min-w-[160px] items-center justify-center rounded-lg bg-slate-200/60 dark:bg-slate-800/60">
          <Loader2 size={18} className="animate-spin text-slate-400" />
        </div>
      )}
      {media.resolvedUrl && (
        <img
          key={`${reloadKey}-${media.resolvedUrl}`}
          src={media.resolvedUrl}
          alt={alt}
          loading="lazy"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          onClick={() => onOpen(media.resolvedUrl)}
          className={`block max-h-72 w-auto max-w-full cursor-zoom-in rounded-lg object-contain transition hover:opacity-95 ${
            status === "loading" || media.loading ? "opacity-0" : "opacity-100"
          }`}
        />
      )}
    </div>
  );
}

/*
 * Full-screen image preview. Portalled to the document root so no glass
 * surface or transformed ancestor can clip or re-origin it.
 */
function ImageLightbox({ open, src, alt, onClose, onDownload }) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <LightboxViewer
          // Remounting per image gives each preview fresh zoom and load state
          // without an effect that resets state after render.
          key={src}
          src={src}
          alt={alt}
          onClose={onClose}
          onDownload={onDownload}
        />
      )}
    </AnimatePresence>,
    document.body,
  );
}

function LightboxViewer({ src, alt, onClose, onDownload }) {
  const [zoom, setZoom] = useState(1);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "+" || event.key === "=")
        setZoom((z) => Math.min(z + 0.5, 4));
      if (event.key === "-") setZoom((z) => Math.max(z - 0.5, 1));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={easeOutFast}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt || "Image preview"}
      className="fixed inset-0 z-[80] flex flex-col bg-slate-950/85 backdrop-blur-sm"
    >
      <div
        className="flex shrink-0 items-center justify-between gap-3 p-3 text-white"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="min-w-0 truncate text-[13px] font-semibold">{alt}</p>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 0.5, 1))}
            disabled={zoom <= 1}
            aria-label="Zoom out"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/15 disabled:opacity-40"
          >
            <ZoomOut size={17} />
          </button>
          <span className="w-12 text-center text-[12px] font-bold tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 0.5, 4))}
            disabled={zoom >= 4}
            aria-label="Zoom in"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/15 disabled:opacity-40"
          >
            <ZoomIn size={17} />
          </button>
          <button
            type="button"
            onClick={onDownload}
            aria-label="Download image"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/15"
          >
            <Download size={17} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/15"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
        {status === "loading" && (
          <Loader2 size={28} className="animate-spin text-white/70" />
        )}

        {status === "error" ? (
          <div className="flex flex-col items-center gap-2 text-center text-white/80">
            <AlertCircle size={28} />
            <p className="text-[14px] font-semibold">
              Image could not be loaded
            </p>
            <p className="max-w-xs text-[12px] text-white/60">
              The file may have been removed from the server.
            </p>
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            onClick={(event) => event.stopPropagation()}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
            style={{ transform: `scale(${zoom})` }}
            className={`max-h-full max-w-full origin-center object-contain transition-transform duration-200 ${
              status === "loading" ? "hidden" : ""
            } ${zoom > 1 ? "cursor-grab" : "cursor-zoom-in"}`}
          />
        )}
      </div>
    </motion.div>
  );
}

function formatFileSize(fileSize) {
  const size = Number(fileSize) || 0;

  if (!size) return "";
  if (size > 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;

  return `${(size / 1024).toFixed(1)} KB`;
}

function getFileTypeLabel(fileName, mimeType) {
  const extension = String(fileName || "")
    .split(".")
    .pop()
    ?.trim()
    .toUpperCase();

  if (extension && extension !== String(fileName || "").toUpperCase()) {
    return extension.slice(0, 8);
  }

  const normalizedType = normalizeMimeType(mimeType);
  const subtype = normalizedType.split("/")[1]?.split(/[.+-]/)[0];

  return subtype ? subtype.toUpperCase().slice(0, 8) : "FILE";
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
  const fromUserField =
    getUserId(getMemberUser(member)) || getEntityId(member?.user);

  if (fromUserField) {
    return fromUserField;
  }

  // Some endpoints hand back plain user objects instead of membership
  // documents. Falling back to the entity id is only correct in that case:
  // on a membership document it would yield the membership id, which never
  // matches a presence entry and leaves the member showing as offline.
  if (member && !("user" in member) && !("role" in member)) {
    return getEntityId(member);
  }

  return null;
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
    const rightTime = right?.createdAt
      ? new Date(right.createdAt).getTime()
      : 0;
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
  const createdAt = message?.createdAt
    ? new Date(message.createdAt).getTime()
    : null;

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

  const { socket, connected } = useChatSocket();
  const socketRef = useRef(socket);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  const messageListRef = useRef(null);
  const bottomRef = useRef(null);
  const messageElementRefs = useRef(new Map());
  const typingTimeoutRef = useRef(null);
  const typingActiveRef = useRef(false);
  const editingMessageIdRef = useRef(null);
  const skipNextAutoScrollRef = useRef(false);
  const searchNavigationRef = useRef(false);
  const pendingScrollMessageIdRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordingCancelledRef = useRef(false);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const startTimeRef = useRef(null);

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [archiveNotice, setArchiveNotice] = useState("");
  const [error, setError] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [permissionNow, setPermissionNow] = useState(() => Date.now());
  // Holds the image the lightbox is showing; null keeps the overlay unmounted.
  const [previewImage, setPreviewImage] = useState(null);

  const openImagePreview = async (mediaUrl, alt, resolvedUrl = "") => {
    setError("");

    try {
      if (resolvedUrl) {
        setPreviewImage({
          src: resolvedUrl,
          alt,
          downloadUrl: mediaUrl,
          revokeOnClose: false,
        });
        return;
      }

      const managedUrl = getManagedAttachmentUrl(mediaUrl);
      if (!managedUrl) {
        setPreviewImage({
          src: mediaUrl,
          alt,
          downloadUrl: mediaUrl,
          revokeOnClose: false,
        });
        return;
      }

      const blob = await fetchAttachmentBlob(managedUrl);
      setPreviewImage({
        src: URL.createObjectURL(blob),
        alt,
        downloadUrl: mediaUrl,
        revokeOnClose: true,
      });
    } catch (openError) {
      setError(openError?.message || "Image could not be opened.");
    }
  };

  useEffect(() => {
    return () => {
      if (previewImage?.revokeOnClose && previewImage.src) {
        URL.revokeObjectURL(previewImage.src);
      }
    };
  }, [previewImage]);

  useEffect(() => {
    editingMessageIdRef.current = editingMessageId;
  }, [editingMessageId]);

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
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
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
    activeSearchIndex >= 0
      ? getMessageId(searchResults[activeSearchIndex])
      : null;

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

  const mergeMessages = useCallback(
    (incomingMessages) => {
      if (!Array.isArray(incomingMessages) || incomingMessages.length === 0)
        return;

      setMessages((prev) => {
        const existingIds = new Set(
          prev.map((message) => getMessageId(message)).filter(Boolean),
        );
        const uniqueIncoming = incomingMessages.filter((message) => {
          const messageId = getMessageId(message);
          return !messageId || !existingIds.has(messageId);
        });

        if (uniqueIncoming.length === 0) {
          return prev;
        }

        return sortMessagesByDate([...prev, ...uniqueIncoming]);
      });
    },
    [setMessages],
  );

  const scrollToMessageElement = useCallback((messageId) => {
    if (!messageId) return;

    const element = messageElementRefs.current.get(String(messageId));

    if (element && messageListRef.current) {
      skipNextAutoScrollRef.current = true;
      const container = messageListRef.current;
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      const scrollOffset =
        elementRect.top -
        containerRect.top +
        container.scrollTop -
        containerRect.height / 2 +
        elementRect.height / 2;

      container.scrollTo({
        top: scrollOffset,
        behavior: "smooth",
      });
    }
  }, []);

  const isMessageLoaded = useCallback(
    (messageId) => {
      if (!messageId) return false;

      return messages.some((message) =>
        idsEqual(getMessageId(message), messageId),
      );
    },
    [messages],
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
        setError(
          err?.response?.data?.message || "Failed to load search result.",
        );
        return false;
      } finally {
        setJumpingToResult(false);
      }
    },
    [
      isMessageLoaded,
      mergeMessages,
      workspaceId,
      setError,
      setHasMoreMessages,
      setJumpingToResult,
    ],
  );

  const goToSearchResult = useCallback(
    (index) => {
      if (index < 0 || index >= searchResults.length) return;
      setActiveSearchIndex(index);
    },
    [searchResults.length, setActiveSearchIndex],
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
  }, [
    setActiveSearchIndex,
    setJumpingToResult,
    setSearchResults,
    setSearchTerm,
    setSearchTotal,
    setSearching,
  ]);

  const notifyUnreadUpdated = useCallback(
    (count) => {
      if (!workspaceId) return;

      window.dispatchEvent(
        new CustomEvent("chatUnreadUpdated", {
          detail: {
            workspaceId,
            unreadCount: count,
          },
        }),
      );
    },
    [workspaceId],
  );

  const appendMessage = useCallback(
    (message) => {
      if (!message) return;

      setArchiveNotice("");
      setMessages((prev) => {
        const messageId = getMessageId(message);

        if (
          messageId &&
          prev.some((item) => idsEqual(getMessageId(item), messageId))
        ) {
          return prev;
        }

        return [...prev, message];
      });
    },
    [setArchiveNotice, setMessages],
  );

  const prependMessages = useCallback(
    (olderMessages) => {
      if (!Array.isArray(olderMessages) || olderMessages.length === 0) return;

      setMessages((prev) => {
        const existingIds = new Set(
          prev.map((message) => getMessageId(message)).filter(Boolean),
        );
        const uniqueOlderMessages = olderMessages.filter((message) => {
          const messageId = getMessageId(message);
          return !messageId || !existingIds.has(messageId);
        });

        return [...uniqueOlderMessages, ...prev];
      });
    },
    [setMessages],
  );

  const updateMessageInList = useCallback(
    (updatedMessage) => {
      const updatedMessageId = getMessageId(updatedMessage);

      if (!updatedMessageId) return;

      const replaceMessage = (items) =>
        items.map((message) =>
          idsEqual(getMessageId(message), updatedMessageId)
            ? updatedMessage
            : message,
        );

      setMessages(replaceMessage);
      setSearchResults((prev) =>
        prev.map((result) =>
          idsEqual(getMessageId(result), updatedMessageId)
            ? {
                ...result,
                content: updatedMessage.content,
              }
            : result,
        ),
      );
    },
    [setMessages, setSearchResults],
  );

  const addReaderToMessages = useCallback(
    (reader, readAt) => {
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
    },
    [setMessages],
  );

  const clearTypingTimer = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  const emitTyping = useCallback(
    (isTyping) => {
      if (typingActiveRef.current === isTyping) return;

      if (!workspaceId || !socketRef.current?.connected) {
        if (!isTyping) typingActiveRef.current = false;
        return;
      }

      typingActiveRef.current = isTyping;
      socketRef.current.emit("typing", {
        workspaceId,
        isTyping,
      });
    },
    [workspaceId],
  );

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
          setError(
            err?.response?.data?.message || "Failed to search messages.",
          );
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
  }, [
    activeSearchIndex,
    ensureSearchResultLoaded,
    searchResults,
    isMessageLoaded,
    scrollToMessageElement,
  ]);

  useEffect(() => {
    if (!workspaceId || !socket) {
      return undefined;
    }

    let cancelled = false;

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
          // A real-time message can arrive while the initial request is still
          // in flight. Merge instead of replacing so that message is not lost.
          mergeMessages(normalizeMessages(messagesData));
          setHasMoreMessages(Boolean(messagesData?.hasMore));
          setMembers(normalizeMembers(metaData));
          setUnreadCount(metaData?.unreadCount || 0);
          notifyUnreadUpdated(metaData?.unreadCount || 0);
        }
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
          setError(response?.message || "Unable to join workspace chat.");
          return;
        }

        setError("");
        setOnlineUserIds(normalizeOnlineUsers(response.onlineUsers));
        setUnreadCount(response.unreadCount || 0);
        notifyUnreadUpdated(response.unreadCount || 0);
      });
    };

    const handleConnect = () => {
      if (!cancelled) {
        setError("");
        joinWorkspaceChat();
      }
    };

    const handleDisconnect = () => {
      if (!cancelled) {
        typingActiveRef.current = false;
      }
    };

    const handleReceiveMessage = (message) => {
      const messageWorkspaceId =
        typeof message?.workspace === "object"
          ? getWorkspaceId(message.workspace)
          : message?.workspace;

      if (String(messageWorkspaceId) === String(workspaceId)) {
        const incomingId = getMessageId(message);
        // Replace any optimistic placeholder for this message, or append
        setMessages((prev) => {
          // Check if a confirmed message with this ID is already present
          const existingIdx = prev.findIndex(
            (m) => !m._tempId && idsEqual(getMessageId(m), incomingId),
          );
          if (existingIdx >= 0) return prev;

          // Reconcile only the exact optimistic send. Matching by content or
          // type can collapse two legitimate identical messages into one.
          const tempIdx = message.clientMessageId
            ? prev.findIndex(
                (m) =>
                  m._pending && m.clientMessageId === message.clientMessageId,
              )
            : -1;

          if (tempIdx >= 0) {
            const updated = [...prev];
            updated[tempIdx] = message;
            return updated;
          }

          return sortMessagesByDate([...prev, message]);
        });
        setUnreadCount(0);
        notifyUnreadUpdated(0);
        setArchiveNotice("");
      }
    };

    const handleMessageUpdated = (message) => {
      const messageWorkspaceId =
        typeof message?.workspace === "object"
          ? getWorkspaceId(message.workspace)
          : message?.workspace;

      if (String(messageWorkspaceId) === String(workspaceId)) {
        updateMessageInList(message);

        if (
          isDeletedMessage(message) &&
          idsEqual(getMessageId(message), editingMessageIdRef.current)
        ) {
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
        const withoutUser = prev.filter(
          (item) => !idsEqual(getUserId(item), typingUserId),
        );

        if (!typing.isTyping) {
          return withoutUser;
        }

        return [...withoutUser, typing.user];
      });

      if (typing.isTyping) {
        setTimeout(() => {
          setTypingUsers((prev) =>
            prev.filter((item) => !idsEqual(getUserId(item), typingUserId)),
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
      if (cancelled) return;

      const errorMsg = connectError?.message;
      const isTransportError =
        errorMsg === "websocket error" || errorMsg === "xhr poll error";

      if (socket.active) return;

      if (!getToken()) {
        setError("Your session has expired. Please sign in again.");
        return;
      }

      if (connectError?.data?.retryable === false) {
        setError(errorMsg || "Your chat session is no longer authorized.");
        return;
      }

      if (!isTransportError && errorMsg) {
        setError(errorMsg);
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

    if (socket.connected) {
      handleConnect();
    }

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
    };
  }, [
    addReaderToMessages,
    clearTypingTimer,
    currentUserId,
    emitTyping,
    mergeMessages,
    notifyUnreadUpdated,
    updateMessageInList,
    workspaceId,
    socket,
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
    setDraft("");

    // Optimistic rendering: show the message immediately so the sender
    // does not have to wait for the server round-trip.
    const tempId = `_temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const optimisticMessage = {
      _id: tempId,
      _tempId: tempId,
      _pending: true,
      clientMessageId: tempId,
      workspace: workspaceId,
      sender: user,
      messageType: "text",
      content,
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    appendMessage(optimisticMessage);

    socketRef.current.emit(
      "sendMessage",
      { workspaceId, content, clientMessageId: tempId },
      (response) => {
        setSending(false);

        if (!response?.success) {
          // Remove the optimistic message and restore the draft
          setMessages((prev) => prev.filter((m) => getMessageId(m) !== tempId));
          setDraft(content);
          setError(response?.message || "Failed to send message.");
          return;
        }

        // Replace the optimistic placeholder with the real server message
        setMessages((prev) => {
          const confirmedId = getMessageId(response.message);
          // Remove both the temp message and any duplicate from receiveMessage
          const cleaned = prev.filter((m) => {
            const id = getMessageId(m);
            return id !== tempId && id !== confirmedId;
          });
          return sortMessagesByDate([...cleaned, response.message]);
        });
      },
    );
  };

  const handleSendSticker = (stickerId) => {
    if (!workspaceId) {
      setError("Please select a workspace before sending.");
      return;
    }

    if (!socketRef.current?.connected) {
      setError("Chat is reconnecting. Please try again in a moment.");
      return;
    }

    setShowStickerPicker(false);
    setError("");

    socketRef.current.emit(
      "sendMessage",
      { workspaceId, messageType: "sticker", stickerId },
      (response) => {
        if (!response?.success) {
          setError(response?.message || "Failed to send sticker.");
          return;
        }
        appendMessage(response.message);
      },
    );
  };

  const handleAttachFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!workspaceId) {
      setError("Please select a workspace before sending.");
      e.target.value = "";
      return;
    }

    if (!socketRef.current?.connected) {
      setError("Chat is reconnecting. Please try again in a moment.");
      e.target.value = "";
      return;
    }

    const limitBytes = 10 * 1024 * 1024;
    if (file.size > limitBytes) {
      setError("File exceeds the maximum size limit of 10MB.");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      const response = await uploadChatFile(
        workspaceId,
        file,
        (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setUploadProgress(percentCompleted);
        },
      );

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
        },
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

  const stopRecordingTracks = useCallback(
    (stream = recordingStreamRef.current) => {
      if (!stream) return;

      stream.getTracks().forEach((track) => track.stop());

      if (recordingStreamRef.current === stream) {
        recordingStreamRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      recordingCancelledRef.current = true;
      clearRecordingTimer();

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
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
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
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
      const canCheckMimeType =
        typeof MediaRecorder.isTypeSupported === "function";

      if (
        canCheckMimeType &&
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ) {
        mimeType = "audio/webm;codecs=opus";
        options = { mimeType };
      } else if (
        canCheckMimeType &&
        MediaRecorder.isTypeSupported("audio/webm")
      ) {
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

        const audioBlob = new Blob(audioChunksRef.current, {
          type: actualMimeType,
        });
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
      setError(
        "Microphone permission denied or audio recording is unsupported on this browser.",
      );
    }
  };

  const stopVoiceRecording = () => {
    recordingCancelledRef.current = false;

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
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
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
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

    if (!socketRef.current?.connected) {
      setError("Chat is reconnecting. Please try again in a moment.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      const mimeType = tempAudioBlob.type || "audio/webm";
      const fileExt = getAudioExtension(mimeType);
      const audioFile = new File(
        [tempAudioBlob],
        `voice_note_${Date.now()}.${fileExt}`,
        {
          type: mimeType,
        },
      );

      const response = await uploadChatFile(
        workspaceId,
        audioFile,
        (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setUploadProgress(percentCompleted);
        },
      );

      const {
        fileUrl,
        fileName,
        fileSize,
        mimeType: uploadedMimeType,
      } = response;
      const duration = tempAudioDuration;

      socketRef.current.emit(
        "sendMessage",
        {
          workspaceId,
          messageType: "audio",
          fileUrl,
          fileName,
          fileSize,
          mimeType:
            uploadedMimeType || normalizeMimeType(mimeType) || "audio/webm",
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
        },
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

    return isWithinMessageWindow(
      message,
      EDIT_MESSAGE_WINDOW_MS,
      permissionNow,
    );
  };

  const canDeleteMessage = (message) => {
    if (isDeletedMessage(message)) return false;

    if (currentMemberRole === "owner") {
      return true;
    }

    if (!idsEqual(getSenderId(message), currentUserId)) {
      return false;
    }

    return isWithinMessageWindow(
      message,
      DELETE_MESSAGE_WINDOW_MS,
      permissionNow,
    );
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
        socketRef.current.emit(
          "editMessage",
          { workspaceId, messageId, content },
          (response) => {
            if (!response?.success) {
              reject(new Error(response?.message || "Failed to edit message."));
              return;
            }

            resolve(response);
          },
        );
      });
    }

    return editMessageRequest(workspaceId, messageId, content);
  };

  const requestMessageDelete = (messageId) => {
    if (socketRef.current?.connected) {
      return new Promise((resolve, reject) => {
        socketRef.current.emit(
          "deleteMessage",
          { workspaceId, messageId },
          (response) => {
            if (!response?.success) {
              reject(
                new Error(response?.message || "Failed to delete message."),
              );
              return;
            }

            resolve(response);
          },
        );
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
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to edit message.",
      );
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
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to delete message.",
      );
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
        container.scrollTop =
          nextScrollHeight - previousScrollHeight + previousScrollTop;
      }, 0);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to load older messages.",
      );
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
      setArchiveNotice(
        `Chat history was archived by ${archivedBy?.name || "you"}.`,
      );
      setUnreadCount(0);
      notifyUnreadUpdated(0);
      showSuccess(
        "Chat history archived. New messages will start a fresh chat.",
      );
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
        <PageHeader
          title="Workspace Chat"
          subtitle="Chat with members in the selected workspace."
        />

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
      <PageHeader title="Workspace Chat" subtitle={workspaceName}>
        {unreadCount > 0 && (
          <span className="tf-badge tf-badge-error h-9 px-3">
            {unreadCount} unread
          </span>
        )}

        {canStartNewChat && (
          <button
            type="button"
            onClick={handleStartNewChat}
            disabled={archiving}
            className="tf-btn-base tf-btn-secondary tf-size-sm"
          >
            <Archive size={14} />
            {archiving ? "Archiving..." : "Start New Chat"}
          </button>
        )}

        <div
          className={`tf-badge h-9 px-3 ${connected ? "tf-badge-success" : "tf-badge-neutral"}`}
        >
          {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
          {connectionLabel}
        </div>
      </PageHeader>

      {isOnlyMemberWorkspace && (
        <div className="tf-alert tf-alert-warning mb-5 flex-col sm:flex-row sm:items-center sm:justify-between">
          <span>
            You are the only member in this workspace. Invite members to start a
            team conversation.
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
        <section className="flex min-h-[520px] max-h-[calc(100vh-160px)] min-w-0 flex-col overflow-hidden rounded-2xl tf-card">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 dark:border-slate-800/70 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-2xs">
                <MessageSquare size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-bold tf-text">
                  {workspaceName}
                </h3>
                <p className="text-[12px] tf-text-muted">
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
              {/* Members Count Badge */}
              <div
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800 px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 dark:text-slate-300"
                title="Workspace members online count"
              >
                <Users size={14} />
                <span>Members</span>
                <span className="rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 px-1.5 py-0.5 text-[10px] font-bold">
                  {onlineUserIds.length}/{members.length}
                </span>
              </div>

              {isSearchMode && (
                <div className="flex items-center gap-1">
                  <span className="min-w-[52px] text-center text-[12px] font-semibold tf-text-secondary">
                    {searchCounterLabel}
                  </span>
                  <button
                    type="button"
                    title="Previous result"
                    aria-label="Previous result"
                    onClick={handlePreviousSearchResult}
                    disabled={
                      searching || jumpingToResult || navigableSearchCount === 0
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
                      searching || jumpingToResult || navigableSearchCount === 0
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              )}

              <div className="relative flex-1 sm:flex-none sm:w-64 lg:w-72">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 z-10"
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
                  placeholder="Search messages..."
                  aria-label="Search chat messages"
                  style={{ paddingLeft: "2.5rem", paddingRight: "2.25rem" }}
                  className="tf-field w-full text-[13px] rounded-xl border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900 transition-all"
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
                    className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
            <div className="flex items-center justify-between border-b border-indigo-100 bg-indigo-50 px-4 py-2.5 text-[13px] font-medium text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300 sm:px-6">
              <span>{archiveNotice}</span>
              <button
                type="button"
                onClick={() => setArchiveNotice("")}
                className="ml-3 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900/50 dark:hover:text-indigo-200 transition active:scale-95"
                title="Dismiss notice"
                aria-label="Dismiss notice"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div
            ref={messageListRef}
            className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6"
          >
            {loading && messages.length === 0 ? (
              <LoadingState message="Loading chat..." />
            ) : messages.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <EmptyState
                  icon={
                    <MessageSquare
                      size={44}
                      className="mb-4 text-slate-300 dark:text-slate-600"
                    />
                  }
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
                  action={
                    isOnlyMemberWorkspace && canInviteMembers
                      ? "Invite members"
                      : undefined
                  }
                  onAction={
                    isOnlyMemberWorkspace && canInviteMembers
                      ? () => navigate("/members")
                      : undefined
                  }
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
                  const dateSeparatorLabel = getDateSeparatorLabel(
                    message,
                    previousMessage,
                  );
                  const sender = getSender(message);
                  const senderName = sender?.name || "Unknown User";
                  const isOwnMessage = idsEqual(
                    getSenderId(message),
                    currentUserId,
                  );
                  const messageDeleted = isDeletedMessage(message);
                  const editingThisMessage = idsEqual(
                    editingMessageId,
                    messageId,
                  );
                  const canEditThisMessage = canEditMessage(message);
                  const canDeleteThisMessage = canDeleteMessage(message);
                  const showMessageActions =
                    canEditThisMessage || canDeleteThisMessage;
                  const displayContent = messageDeleted
                    ? DELETED_MESSAGE_TEXT
                    : message.content;
                  const displayContentText = String(displayContent || "");
                  const messageKind = getMessageKind(message);
                  const mediaUrl = getMessageMediaUrl(message);
                  const isActiveSearchResult =
                    isSearchMode &&
                    activeSearchMessageId &&
                    idsEqual(messageId, activeSearchMessageId);
                  const shouldHighlightSearch =
                    isSearchMode &&
                    !messageDeleted &&
                    displayContentText
                      .toLowerCase()
                      .includes(trimmedSearchTerm.toLowerCase());
                  const isMedia =
                    messageKind === "image" ||
                    messageKind === "file" ||
                    messageKind === "audio";
                  const bubbleClassName = messageDeleted
                    ? "whitespace-pre-wrap break-words break-anywhere rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-[13px] italic leading-6 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                    : messageKind === "sticker"
                      ? `text-5xl select-none p-1 transition-transform hover:scale-110 active:scale-95 duration-200 ${
                          isActiveSearchResult
                            ? "ring-2 ring-yellow-400 rounded-xl"
                            : ""
                        }`
                      : `whitespace-pre-wrap break-words break-anywhere rounded-2xl text-[13px] leading-6 shadow-sm min-w-0 ${
                          isMedia
                            ? "p-1 sm:p-1.5 w-fit max-w-full"
                            : "px-4 py-2.5"
                        } ${
                          isOwnMessage
                            ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-md"
                            : "rounded-bl-md border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                        } ${isActiveSearchResult ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900" : ""}`;

                  return (
                    <Fragment
                      key={messageId || `${senderName}-${message.createdAt}`}
                    >
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
                            messageElementRefs.current.set(
                              String(messageId),
                              element,
                            );
                          } else {
                            messageElementRefs.current.delete(
                              String(messageId),
                            );
                          }
                        }}
                        data-message-id={messageId || undefined}
                        className={`flex gap-3 ${isOwnMessage ? "justify-end" : "justify-start"} ${
                          isActiveSearchResult
                            ? "rounded-xl bg-yellow-50/70 px-1 py-1 dark:bg-yellow-500/10"
                            : ""
                        }`}
                      >
                        {!isOwnMessage && (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[12px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {getInitials(senderName)}
                          </div>
                        )}

                        <div
                          className={`min-w-0 max-w-[84vw] sm:max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"} flex flex-col`}
                        >
                          <div className="mb-1 flex max-w-full items-center gap-2 text-[11px] tf-text-muted">
                            <span className="truncate font-semibold">
                              {isOwnMessage ? "You" : senderName}
                            </span>
                            <span className="shrink-0">
                              {formatMessageTime(message.createdAt)}
                            </span>
                            {message.editedAt && !messageDeleted && (
                              <span className="shrink-0 text-[10px] font-semibold tf-text-subtle">
                                edited
                              </span>
                            )}
                          </div>

                          {editingThisMessage ? (
                            <form
                              onSubmit={(e) => handleEditSubmit(e, message)}
                              className="w-full tf-card rounded-2xl border-amber-500/35 p-2 dark:border-amber-400/25"
                            >
                              <textarea
                                value={editDraft}
                                onChange={(e) => setEditDraft(e.target.value)}
                                maxLength={CHAT_MESSAGE_MAX_LENGTH}
                                rows={3}
                                autoFocus
                                className="tf-field min-h-20 w-full resize-none leading-6"
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
                                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all active:scale-95 shadow-sm disabled:opacity-40"
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
                                <div className="flex w-fit max-w-full flex-col gap-1 p-0.5">
                                  <ChatImage
                                    src={mediaUrl}
                                    alt={message.fileName || "Chat image"}
                                    isOwnMessage={isOwnMessage}
                                    onOpen={(resolvedUrl) =>
                                      void openImagePreview(
                                        mediaUrl,
                                        message.fileName || "Chat image",
                                        resolvedUrl,
                                      )
                                    }
                                  />
                                  <div
                                    className={`mt-0.5 flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1 text-[11px] font-semibold ${
                                      isOwnMessage
                                        ? "bg-black/20 text-white"
                                        : "bg-slate-200/60 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200"
                                    }`}
                                  >
                                    <span className="truncate block max-w-[120px] sm:max-w-[160px]">
                                      {message.fileName || "image.png"}
                                    </span>
                                    <div className="flex shrink-0 items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void openImagePreview(
                                            mediaUrl,
                                            message.fileName || "Chat image",
                                          )
                                        }
                                        className={`flex items-center gap-1 rounded-md px-1.5 py-1 font-bold transition active:scale-95 ${
                                          isOwnMessage
                                            ? "text-white hover:bg-white/15"
                                            : "text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
                                        }`}
                                        aria-label={`Open ${message.fileName || "image"}`}
                                      >
                                        <Maximize2
                                          size={13}
                                          strokeWidth={2.5}
                                        />
                                        Open
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setError("");
                                          void downloadFile(
                                            mediaUrl,
                                            message.fileName || "image.png",
                                          ).catch((downloadError) => {
                                            setError(
                                              downloadError?.message ||
                                                "Image could not be downloaded.",
                                            );
                                          });
                                        }}
                                        className={`flex items-center gap-1 rounded-md px-1.5 py-1 font-bold transition active:scale-95 ${
                                          isOwnMessage
                                            ? "text-white hover:bg-white/15"
                                            : "text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
                                        }`}
                                        aria-label={`Download ${message.fileName || "image"}`}
                                      >
                                        <Download size={13} strokeWidth={2.5} />
                                        Download
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : messageKind === "file" && mediaUrl ? (
                                <div
                                  className={`min-w-0 max-w-full rounded-xl p-2.5 ${
                                    isOwnMessage
                                      ? "bg-white/10 text-white ring-1 ring-white/10"
                                      : "bg-white text-slate-800 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800"
                                  }`}
                                >
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div
                                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                        isOwnMessage
                                          ? "bg-white/15 text-white"
                                          : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300"
                                      }`}
                                    >
                                      <FileText size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p
                                        className={`truncate text-[13px] font-semibold ${
                                          isOwnMessage
                                            ? "text-white"
                                            : "tf-text"
                                        }`}
                                      >
                                        {message.fileName || "Document"}
                                      </p>
                                      <div
                                        className={`mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide ${
                                          isOwnMessage
                                            ? "text-indigo-200"
                                            : "tf-text-muted"
                                        }`}
                                      >
                                        <span>
                                          {getFileTypeLabel(
                                            message.fileName,
                                            message.mimeType,
                                          )}
                                        </span>
                                        {formatFileSize(message.fileSize) && (
                                          <>
                                            <span aria-hidden="true">·</span>
                                            <span className="normal-case tracking-normal">
                                              {formatFileSize(message.fileSize)}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setError("");
                                        void openFile(mediaUrl).catch(
                                          (openError) => {
                                            setError(
                                              openError?.message ||
                                                "Document could not be opened.",
                                            );
                                          },
                                        );
                                      }}
                                      aria-label={`Open ${message.fileName || "document"}`}
                                      className={`flex h-8 items-center justify-center gap-1.5 rounded-lg text-[11px] font-bold transition active:scale-[0.98] ${
                                        isOwnMessage
                                          ? "bg-white/10 text-white hover:bg-white/20"
                                          : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                                      }`}
                                    >
                                      <ExternalLink size={14} />
                                      Open
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={`Download ${message.fileName || "document"}`}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setError("");
                                        void downloadFile(
                                          mediaUrl,
                                          message.fileName,
                                        ).catch((downloadError) => {
                                          setError(
                                            downloadError?.message ||
                                              "Document could not be downloaded.",
                                          );
                                        });
                                      }}
                                      className={`flex h-8 items-center justify-center gap-1.5 rounded-lg text-[11px] font-bold transition active:scale-[0.98] ${
                                        isOwnMessage
                                          ? "bg-white/10 text-white hover:bg-white/20"
                                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                      }`}
                                    >
                                      <Download size={14} />
                                      Download
                                    </button>
                                  </div>
                                </div>
                              ) : messageKind === "sticker" ? (
                                STICKER_MAP[message.stickerId] || "✨"
                              ) : messageKind === "audio" && mediaUrl ? (
                                <CustomAudioPlayer
                                  src={mediaUrl}
                                  duration={
                                    message.audioDuration || message.duration
                                  }
                                  isOwnMessage={isOwnMessage}
                                />
                              ) : shouldHighlightSearch ? (
                                highlightMessageContent(
                                  displayContent,
                                  trimmedSearchTerm,
                                  isActiveSearchResult,
                                )
                              ) : (
                                displayContent
                              )}
                            </div>
                          )}

                          {showMessageActions && !editingThisMessage && (
                            <div
                              className={`mt-1 flex items-center gap-1 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                            >
                              {canEditThisMessage && (
                                <button
                                  type="button"
                                  title="Edit message"
                                  aria-label="Edit message"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    beginEditingMessage(message);
                                  }}
                                  disabled={
                                    savingEdit ||
                                    idsEqual(deletingMessageId, messageId)
                                  }
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
                                  disabled={
                                    savingEdit ||
                                    idsEqual(deletingMessageId, messageId)
                                  }
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          )}

                          {isOwnMessage && (
                            <span className="mt-1 text-[10px] font-medium tf-text-subtle">
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
              <div className="absolute bottom-20 left-2 right-2 z-50 grid grid-cols-4 gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-950 sm:left-6 sm:right-auto">
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

            <input
              ref={fileInputRef}
              type="file"
              id="chat-file-upload"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={handleAttachFile}
              className="hidden"
              disabled={isUploading || isRecording}
            />

            <input
              ref={imageInputRef}
              type="file"
              id="chat-image-upload"
              accept="image/*"
              onChange={handleAttachFile}
              className="hidden"
              disabled={isUploading || isRecording}
            />

            <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-colors focus-within:bg-slate-50/70 dark:bg-slate-900 dark:focus-within:bg-slate-900/80">
              <div className="flex items-end p-1.5 sm:p-2">
                {isUploading ? (
                  <div className="min-w-0 flex-1 flex items-center gap-2.5 px-3 py-2 text-[13px] text-indigo-600 dark:text-indigo-400 font-semibold select-none">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    <span className="truncate">
                      Uploading file... {uploadProgress}%
                    </span>
                  </div>
                ) : isRecording ? (
                  <div className="min-w-0 flex-1 flex items-center justify-between gap-2 p-1">
                    <div className="flex items-center gap-2 px-2 py-1 text-[13px] text-red-500 font-semibold animate-pulse select-none">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                      <span className="truncate">
                        Recording: {formatAudioTime(recordingDuration)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={cancelVoiceRecording}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition active:scale-95 border border-red-200/60 dark:border-red-900/40"
                        title="Cancel recording"
                      >
                        <Trash2 size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={stopVoiceRecording}
                        className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all active:scale-95 shadow-sm"
                        title="Stop recording"
                      >
                        <Square size={16} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                ) : tempAudioBlob ? (
                  <div className="min-w-0 flex-1 flex items-center justify-between gap-3 p-1">
                    <div className="min-w-0 flex-1">
                      <CustomAudioPlayer
                        src={tempAudioUrl}
                        duration={tempAudioDuration}
                        isOwnMessage={false}
                        isPreview={true}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={cancelVoiceRecording}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition active:scale-95 border border-red-200/60 dark:border-red-900/40"
                        title="Delete recording"
                      >
                        <Trash2 size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={sendRecordedVoiceNote}
                        disabled={isUploading}
                        className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all active:scale-95 shadow-sm disabled:opacity-50"
                        title="Send voice note"
                      >
                        {isUploading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} className="ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
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
                    aria-label="Write a chat message"
                    className="max-h-32 min-h-[40px] min-w-0 flex-1 resize-none appearance-none border-0 bg-transparent px-2.5 py-2 text-[13px] leading-snug text-slate-800 outline-none ring-0 placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0 focus-visible:!outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                )}
              </div>

              {!isRecording && !isUploading && !tempAudioBlob && (
                <div className="flex items-center justify-between bg-slate-50/70 px-2 py-1.5 dark:bg-slate-950/20">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowStickerPicker((prev) => !prev)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition dark:text-slate-400 dark:hover:bg-slate-800"
                      title="Send sticker"
                      aria-label="Send sticker"
                    >
                      <Smile size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition dark:text-slate-400 dark:hover:bg-slate-800"
                      title="Attach picture"
                      aria-label="Attach picture"
                    >
                      <Image size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition dark:text-slate-400 dark:hover:bg-slate-800"
                      title="Attach document/file"
                      aria-label="Attach document/file"
                    >
                      <Paperclip size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition dark:text-slate-400 dark:hover:bg-slate-800"
                      title="Record voice note"
                      aria-label="Record voice note"
                    >
                      <Mic size={17} />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition-all shadow-xs hover:shadow-md disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:active:scale-100 disabled:cursor-not-allowed shrink-0"
                    aria-label="Send message"
                    title={!connected ? "Chat connecting..." : "Send message"}
                  >
                    {sending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={15} className="ml-0.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </form>
        </section>

        <aside className="tf-card rounded-2xl p-4 transition-all block">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[14px] font-bold tf-text">Members</h3>
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
                <div
                  key={member._id || memberUserId}
                  className="flex items-center gap-3"
                >
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
                    <p className="truncate text-[13px] font-semibold tf-text">
                      {memberName}
                    </p>
                    <p className="text-[11px] tf-text-muted">
                      {isOnline ? "Online" : "Offline"} · {member.role}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      <ImageLightbox
        open={Boolean(previewImage)}
        src={previewImage?.src}
        alt={previewImage?.alt}
        onClose={() => setPreviewImage(null)}
        onDownload={() => {
          setError("");
          void downloadFile(previewImage?.downloadUrl, previewImage?.alt).catch(
            (downloadError) => {
              setError(
                downloadError?.message || "Image could not be downloaded.",
              );
            },
          );
        }}
      />
    </DashboardLayout>
  );
}

export default Chat;
