import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import DashboardLayout from "../layouts/DashboardLayout";
import useWorkspace from "../context/useWorkspace";
import useAuth from "../context/useAuth";
import {
  getMembers,
  addMember,
  updateMemberRole,
  removeWorkspaceMember,
} from "../services/memberService";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import AppSelect from "../components/ui/AppSelect";
import { showSuccess, showError, confirmAction } from "../utils/alerts";
import { Users, Plus, Mail } from "lucide-react";

const emptyInviteForm = {
  email: "",
  role: "member",
};

function getWorkspaceId(workspace) {
  return workspace?._id || workspace?.id || null;
}

function getUserId(user) {
  return user?._id || user?.id || null;
}

function getMemberId(member) {
  return member?._id || member?.id || null;
}

function getMemberUser(member) {
  if (!member) return null;

  if (member.user && typeof member.user === "object") {
    return member.user;
  }

  if (member.member && typeof member.member === "object") {
    return member.member;
  }

  return null;
}

function getMemberUserId(member) {
  const memberUser = getMemberUser(member);

  return (
    memberUser?._id ||
    memberUser?.id ||
    member?.userId ||
    member?.user ||
    member?.memberId ||
    null
  );
}

function normalizeMembers(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.members)) return data.members;

  if (Array.isArray(data?.data?.members)) return data.data.members;

  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function normalizeSelectValue(value) {
  if (typeof value === "string") return value;

  if (value?.value) return value.value;

  return "";
}

function getSafeDateLabel(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString();
}

function Members() {
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  const { user } = useAuth();

  const workspaceId = getWorkspaceId(workspace);
  const currentUserId = getUserId(user);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyInviteForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = useCallback(async () => {
    await Promise.resolve();

    if (!workspaceId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getMembers(workspaceId);
      setMembers(normalizeMembers(data));
    } catch (err) {
      setMembers([]);
      setError(err?.response?.data?.message || "Failed to load members.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

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

  const currentUserMember = useMemo(() => {
    return members.find((member) => {
      const memberUserId = getMemberUserId(member);
      return String(memberUserId) === String(currentUserId);
    });
  }, [members, currentUserId]);

  const currentUserRole = currentUserMember?.role || "member";
  const canManageRoles = currentUserRole === "owner";

  const openInviteModal = () => {
    setForm(emptyInviteForm);
    setFormError("");
    setShowModal(true);
  };

  const closeInviteModal = () => {
    if (!saving) {
      setShowModal(false);
      setForm(emptyInviteForm);
      setFormError("");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");

    const cleanForm = {
      email: form.email.trim(),
      role: form.role || "member",
    };

    if (!workspaceId) {
      setFormError("No workspace selected.");
      return;
    }

    if (!cleanForm.email) {
      setFormError("User email is required.");
      return;
    }

    setSaving(true);

    try {
      await addMember(workspaceId, cleanForm);
      await loadData();

      setShowModal(false);
      setForm(emptyInviteForm);

      showSuccess("Member invited successfully");
    } catch (err) {
      setFormError(
        err?.response?.data?.message || "Failed to invite member."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (memberId, value) => {
    const newRole = normalizeSelectValue(value);

    if (!workspaceId || !memberId || !newRole) {
      showError("Missing workspace, member, or role information.");
      return;
    }

    try {
      await updateMemberRole(workspaceId, memberId, { role: newRole });
      await loadData();
      showSuccess("Role updated successfully");
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to update role.");
    }
  };

  const handleRemoveMember = async (member) => {
    const memberId = getMemberId(member);
    const memberUser = getMemberUser(member);
    const memberName = memberUser?.name || "this member";

    if (!workspaceId || !memberId) {
      showError("Missing workspace or member information.");
      return;
    }

    const confirmed = await confirmAction({
      title: "Remove Member",
      text: `Are you sure you want to remove ${memberName} from this workspace?`,
      confirmButtonText: "Remove",
      icon: "warning",
    });

    if (!confirmed) return;

    try {
      await removeWorkspaceMember(workspaceId, memberId);
      await loadData();
      showSuccess("Member removed successfully");
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to remove member.");
    }
  };

  if (!workspace) {
    return (
      <DashboardLayout>
        <PageHeader title="Members" subtitle="Manage workspace access." />

        <div className="mt-10">
          <EmptyState
            title="No workspace selected"
            description="Please select a workspace to manage members."
            action="Go to Workspaces"
            onAction={() => navigate("/workspaces")}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Workspace Members
          </h2>

          <p className="mt-1 text-[14px] text-slate-500 dark:text-slate-400">
            Manage who has access to this workspace and their permissions.
          </p>
        </div>

        {canManageRoles && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openInviteModal}
              className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Plus size={16} />
              Invite Member
            </button>
          </div>
        )}
      </header>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800/60">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
            <Users size={18} className="text-slate-400" />
            People ({members.length})
          </h3>
        </div>

        {loading ? (
          <LoadingState message="Loading members..." />
        ) : members.length === 0 ? (
          <div className="py-10">
            <EmptyState title="No members found" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 dark:border-slate-800/60 dark:bg-slate-900/50">
                  <th className="px-6 py-3.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                    User
                  </th>

                  <th className="px-6 py-3.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                    Role
                  </th>

                  <th className="px-6 py-3.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                    Joined
                  </th>

                  {canManageRoles && (
                    <th className="px-6 py-3.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {members.map((member) => {
                  const memberId = getMemberId(member);
                  const memberUser = getMemberUser(member);
                  const memberUserId = getMemberUserId(member);
                  const memberName = memberUser?.name || "Unknown User";
                  const memberEmail = memberUser?.email || "No email";
                  const isCurrentUser =
                    String(memberUserId) === String(currentUserId);
                  const joinedLabel = getSafeDateLabel(
                    member?.joinedAt || member?.createdAt
                  );

                  return (
                    <tr
                      key={memberId || memberUserId || memberEmail}
                      className="group/row border-b border-slate-100 transition-colors duration-300 last:border-b-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[13px] font-bold text-indigo-600 transition-transform duration-300 group-hover/row:scale-110 dark:bg-indigo-500/20 dark:text-indigo-400">
                            {memberName.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <p className="text-[13px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
                              {memberName}
                              {isCurrentUser && (
                                <span className="ml-1 text-[11px] font-normal text-slate-500">
                                  (You)
                                </span>
                              )}
                            </p>

                            <p className="mt-0.5 flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400">
                              <Mail size={10} />
                              {memberEmail}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Badge variant={member?.role || "member"} />
                      </td>

                      <td className="px-6 py-4 text-[13px] text-slate-500 dark:text-slate-400">
                        {joinedLabel}
                      </td>

                      {canManageRoles && (
                        <td className="px-6 py-4">
                          {member?.role !== "owner" ? (
                            <div className="flex items-center gap-3">
                              <div className="w-32">
                                <AppSelect
                                  value={member?.role || "member"}
                                  onChange={(value) =>
                                    handleRoleChange(memberId, value)
                                  }
                                  options={[
                                    { value: "admin", label: "Admin" },
                                    { value: "member", label: "Member" },
                                  ]}
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveMember(member)}
                                className="text-[12px] font-medium text-red-600 hover:text-red-700 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                              Owner
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={closeInviteModal} title="Invite Member">
        {formError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            {formError}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
              User Email *
            </label>

            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="user@example.com"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              required
            />

            <p className="mt-1.5 text-[11px] text-slate-500">
              The user must already have a TaskFlow Pro account.
            </p>
          </div>

          <div>
            <AppSelect
              label="Role"
              value={form.role}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  role: normalizeSelectValue(value) || "member",
                }))
              }
              options={[
                { value: "member", label: "Member" },
                { value: "admin", label: "Admin" },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeInviteModal}
              disabled={saving}
              className="h-10 rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-600 transition-all duration-300 hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-10 rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all duration-300 hover:bg-indigo-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {saving ? "Inviting..." : "Invite Member"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default Members;