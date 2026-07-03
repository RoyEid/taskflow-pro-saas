import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router";
import DashboardLayout from "../layouts/DashboardLayout";
import useWorkspace from "../context/useWorkspace";
import useAuth from "../context/useAuth";
import { getTaskById, updateTask, updateTaskStatus } from "../services/taskService";
import {
  getComments,
  createComment,
  deleteComment,
} from "../services/commentService";
import Badge from "../components/Badge";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import AppSelect from "../components/ui/AppSelect";
import { showSuccess, showError } from "../utils/alerts";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  ArrowLeft,
  MessageSquare,
  Trash2,
  Calendar,
  LayoutList,
  AlignLeft,
} from "lucide-react";

function getWorkspaceId(workspace) {
  return workspace?._id || workspace?.id || null;
}

function getUserId(user) {
  return user?._id || user?.id || null;
}



function getCommentId(comment) {
  return comment?._id || comment?.id || null;
}

function getAuthor(comment) {
  return comment?.author || comment?.user || comment?.createdBy || null;
}

function getAuthorId(comment) {
  const author = getAuthor(comment);

  return author?._id || author?.id || comment?.authorId || comment?.userId || comment?.createdBy?._id || comment?.createdBy?.id || null;
}

function normalizeTask(data) {
  if (!data) return null;

  if (data?.data?.task) return data.data.task;

  if (data?.task) return data.task;

  if (data?.data?._id || data?.data?.id) return data.data;

  if (data?._id || data?.id) return data;

  return null;
}

function normalizeComments(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.comments)) return data.comments;

  if (Array.isArray(data?.data?.comments)) return data.data.comments;

  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function normalizeSelectValue(value) {
  if (typeof value === "string") return value;

  if (value?.value) return value.value;

  return "";
}

function getSafeDateLabel(value, fallback = "—") {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleDateString();
}

function getSafeDateTimeLabel(value, fallback = "—") {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleString();
}

function TaskDetail() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");

  const { workspace, memberRole } = useWorkspace();
  const isMemberRole = memberRole === "member";
  const { user } = useAuth();

  const workspaceId = getWorkspaceId(workspace);
  const currentUserId = getUserId(user);

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [commentText, setCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [deletingComment, setDeletingComment] = useState(null);

  const loadData = useCallback(async () => {
    await Promise.resolve();

    if (!workspaceId || !projectId || !taskId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [taskData, commentsData] = await Promise.all([
        getTaskById(workspaceId, projectId, taskId),
        getComments(workspaceId, projectId, taskId),
      ]);

      setTask(normalizeTask(taskData));
      setComments(normalizeComments(commentsData));
    } catch {
      setTask(null);
      setComments([]);
      setError(
        "Failed to load task details. Make sure you accessed this page from a project."
      );
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId, taskId]);

  useEffect(() => {
    let cancelled = false;

    async function runLoadData() {
      await Promise.resolve();

      if (!cancelled) {
        await loadData();
      }
    }

    runLoadData();

    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const handleStatusChange = async (value) => {
    const newStatus = normalizeSelectValue(value);

    if (!newStatus || task?.status === newStatus) return;

    if (!workspaceId || !projectId || !taskId) {
      showError("Missing workspace, project, or task information.");
      return;
    }

    try {
      await updateTaskStatus(workspaceId, projectId, taskId, newStatus);

      setTask((currentTask) => ({
        ...currentTask,
        status: newStatus,
      }));

      showSuccess("Status updated");
    } catch {
      showError("Failed to update status.");
    }
  };

  const handlePriorityChange = async (value) => {
    const newPriority = normalizeSelectValue(value);

    if (!newPriority || task?.priority === newPriority) return;

    if (!workspaceId || !projectId || !taskId) {
      showError("Missing workspace, project, or task information.");
      return;
    }

    try {
      await updateTask(workspaceId, projectId, taskId, {
        priority: newPriority,
      });

      setTask((currentTask) => ({
        ...currentTask,
        priority: newPriority,
      }));

      showSuccess("Priority updated");
    } catch {
      showError("Failed to update priority.");
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();

    const cleanComment = commentText.trim();

    if (!cleanComment) return;

    if (!workspaceId || !projectId || !taskId) {
      showError("Missing workspace, project, or task information.");
      return;
    }

    setSavingComment(true);

    try {
      await createComment(workspaceId, projectId, taskId, {
        content: cleanComment,
      });

      setCommentText("");

      const commentsData = await getComments(workspaceId, projectId, taskId);
      setComments(normalizeComments(commentsData));

      showSuccess("Comment posted");
    } catch {
      showError("Failed to post comment.");
    } finally {
      setSavingComment(false);
    }
  };

  const openDeleteComment = (comment) => {
    setDeletingComment(comment);
    setShowConfirm(true);
  };

  const closeDeleteComment = () => {
    setShowConfirm(false);
    setDeletingComment(null);
  };

  const handleDeleteComment = async () => {
    const commentId = getCommentId(deletingComment);

    if (!workspaceId || !projectId || !taskId || !commentId) {
      showError("Missing comment information.");
      return;
    }

    try {
      await deleteComment(workspaceId, projectId, taskId, commentId);

      setComments((currentComments) =>
        currentComments.filter((comment) => getCommentId(comment) !== commentId)
      );

      closeDeleteComment();
      showSuccess("Comment deleted");
    } catch {
      showError("Failed to delete comment.");
    }
  };

  if (!workspace || !projectId) {
    return (
      <DashboardLayout>
        <div className="mt-10">
          <EmptyState
            title={!workspace ? "No workspace selected" : "Invalid Link"}
            description={
              !workspace
                ? "Please select a workspace."
                : "Project ID is missing from the link."
            }
            action={!workspace ? "Go to Workspaces" : "Go to Projects"}
            onAction={() =>
              navigate(!workspace ? "/workspaces" : "/projects")
            }
          />
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading task..." />
      </DashboardLayout>
    );
  }

  if (error || !task) {
    return (
      <DashboardLayout>
        <div className="mt-10">
          <EmptyState
            title="Task not found"
            description={error || "The task you're looking for doesn't exist."}
            action="Back to Tasks"
            onAction={() => navigate(`/tasks?project=${projectId}`)}
          />
        </div>
      </DashboardLayout>
    );
  }

const taskTitle = task?.title || "Untitled Task";
const assigneeName = task?.assignee?.name || "Unassigned";

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          to={`/tasks?project=${projectId}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft size={14} />
          Back to Kanban Board
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-7 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2">
              <Badge variant={task?.status || "todo"} />
              <Badge variant={task?.priority || "medium"} dot />
            </div>

            <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {taskTitle}
            </h1>

            <div className="mt-8">
              <h3 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-slate-900 dark:text-white">
                <AlignLeft size={16} className="text-slate-400" />
                Description
              </h3>

              <div className="min-h-[100px] whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50/50 p-5 text-[14px] leading-relaxed text-slate-700 dark:border-slate-800/60 dark:bg-slate-800/30 dark:text-slate-300">
                {task?.description || "No description provided."}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-7 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            <h3 className="mb-6 flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
              <MessageSquare size={16} className="text-slate-400" />
              Discussion
            </h3>

            <div className="mb-8 space-y-6">
              {comments.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[13px] italic text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
                  No comments yet. Start the conversation!
                </p>
              ) : (
                comments.map((comment) => {
                  const commentId = getCommentId(comment);
                  const author = getAuthor(comment);
                  const authorId = getAuthorId(comment);
                  const authorName = author?.name || "Unknown User";
                  const canDeleteComment =
                    String(currentUserId) === String(authorId);

                  return (
                    <div key={commentId || comment?.content} className="group flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[13px] font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                        {authorName.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-2.5">
                            <span className="text-[14px] font-semibold text-slate-900 dark:text-white">
                              {authorName}
                            </span>

                            <span className="text-[12px] text-slate-500">
                              {getSafeDateTimeLabel(comment?.createdAt)}
                            </span>
                          </div>

                          {canDeleteComment && (
                            <button
                              type="button"
                              onClick={() => openDeleteComment(comment)}
                              className="rounded p-1 text-slate-400 opacity-100 sm:opacity-0 transition-colors hover:bg-red-50 hover:text-red-500 sm:group-hover:opacity-100 dark:hover:bg-red-950/30"
                              aria-label="Delete comment"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div className="mt-1.5 whitespace-pre-wrap rounded-xl rounded-tl-none border border-slate-100 bg-slate-50 p-3.5 text-[14px] text-slate-700 shadow-sm dark:border-slate-800/60 dark:bg-slate-800/50 dark:text-slate-300">
                          {comment?.content || ""}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={handlePostComment}
              className="flex items-start gap-4 border-t border-slate-100 pt-6 dark:border-slate-800/60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-[13px] font-bold text-white shadow-sm dark:bg-white dark:text-slate-900">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="flex-1 space-y-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!commentText.trim() || savingComment}
                    className="rounded-lg bg-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    {savingComment ? "Posting..." : "Comment"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-7 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            <h3 className="mb-5 flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
              <LayoutList size={16} className="text-slate-400" />
              Task Details
            </h3>

            <div className="space-y-5 text-[13px]">
              <div>
                <p className="mb-1.5 font-medium text-slate-500 dark:text-slate-400">
                  Status
                </p>

                <div className="w-full">
                  <AppSelect
                    value={task?.status || "todo"}
                    onChange={handleStatusChange}
                    options={[
                      { value: "todo", label: "To Do" },
                      { value: "in_progress", label: "In Progress" },
                      { value: "review", label: "Review" },
                      { value: "done", label: "Done" },
                      { value: "blocked", label: "Blocked" },
                    ]}
                  />
                </div>
              </div>

              <div>
                <p className="mb-1.5 font-medium text-slate-500 dark:text-slate-400">
                  Priority
                </p>

                <div className="w-full">
                  <AppSelect
                    value={task?.priority || "medium"}
                    onChange={handlePriorityChange}
                    isDisabled={isMemberRole}
                    options={[
                      { value: "low", label: "Low" },
                      { value: "medium", label: "Medium" },
                      { value: "high", label: "High" },
                    ]}
                  />
                </div>
              </div>

              <div>
                <p className="mb-1.5 font-medium text-slate-500 dark:text-slate-400">
                  Assignee
                </p>

                <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-slate-700/50 dark:bg-slate-800/50">
                  {task?.assignee ? (
                    <>
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-[11px] font-bold text-indigo-700">
                        {assigneeName.charAt(0).toUpperCase()}
                      </div>

                      <span className="font-semibold text-slate-900 dark:text-slate-200">
                        {assigneeName}
                      </span>
                    </>
                  ) : (
                    <span className="px-2 italic text-slate-400">
                      Unassigned
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-1.5 flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                  <Calendar size={14} />
                  Due Date
                </p>

                <p className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 font-semibold text-slate-900 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-200">
                  {task?.dueDate
                    ? getSafeDateLabel(task.dueDate)
                    : "No due date"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onClose={closeDeleteComment}
        onConfirm={handleDeleteComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This cannot be undone."
      />
    </DashboardLayout>
  );
}

export default TaskDetail;