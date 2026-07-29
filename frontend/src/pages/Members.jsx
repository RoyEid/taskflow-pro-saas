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
  getInvitations,
  cancelInvite
} from "../services/memberService";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import TableSkeleton from "../components/ui/TableSkeleton";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import AppSelect from "../components/ui/AppSelect";
import { showSuccess, showError, confirmAction } from "../utils/alerts";
import { Users, Plus, Mail, Shield, ShieldAlert, Trash2 } from "lucide-react";

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
  if (Array.isArray(data?.data?.invitations)) return data.data.invitations;

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
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyInviteForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [manageMember, setManageMember] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [roleUpdating, setRoleUpdating] = useState(false);

  const loadData = useCallback(async () => {
    await Promise.resolve();

    if (!workspaceId) {
      setMembers([]);
      setInvitations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [membersData, invitesData] = await Promise.all([
        getMembers(workspaceId).catch(() => []),
        getInvitations(workspaceId).catch(() => [])
      ]);
      setMembers(normalizeMembers(membersData));
      setInvitations(normalizeMembers(invitesData));
    } catch (err) {
      setMembers([]);
      setInvitations([]);
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
      email: String(form.email || "").trim().toLowerCase(),
      role: String(form.role || "member").trim().toLowerCase(),
    };

    if (!workspaceId) {
      setFormError("No workspace selected.");
      return;
    }

    if (!cleanForm.email) {
      setFormError("User email is required.");
      return;
    }

    const confirmed = await confirmAction({
      title: "Send Invitation",
      text: `Invite ${cleanForm.email} to ${workspace?.name || "this workspace"} as ${cleanForm.role === "admin" ? "Admin" : "Member"}?`,
      confirmButtonText: "Send Invite",
    });

    if (!confirmed) return;

    setSaving(true);

    try {
      await addMember(workspaceId, cleanForm);
      await loadData();

      setShowModal(false);
      setForm(emptyInviteForm);

      showSuccess("Invitation sent successfully");
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

    setRoleUpdating(true);
    try {
      await updateMemberRole(workspaceId, memberId, { role: newRole });
      await loadData();
      showSuccess("Role updated successfully");
      setManageMember(null);
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to update role.");
    } finally {
      setRoleUpdating(false);
    }
  };

  const handleRemoveMemberClick = (member) => {
    setMemberToRemove(member);
    setManageMember(null);
  };

  const confirmRemoveMember = async () => {
    if (!workspaceId || !memberToRemove) return;
    
    const memberId = getMemberUserId(memberToRemove);

    try {
      await removeWorkspaceMember(workspaceId, memberId);
      await loadData();
      showSuccess("Member removed successfully");
      setMemberToRemove(null);
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
      <PageHeader
        title="Workspace Members"
        subtitle="Manage who has access to this workspace and their permissions."
        action={canManageRoles ? openInviteModal : undefined}
        actionLabel={canManageRoles ? "Invite Member" : undefined}
        actionIcon={canManageRoles ? <Plus size={16} /> : undefined}
      />

      {error && (
        <div className="tf-alert tf-alert-error mb-5" role="alert">
          {error}
        </div>
      )}

      <div className="rounded-2xl tf-card-base overflow-hidden">
        <div className="flex items-center justify-between tf-bd border-b px-6 py-5">
          <h3 className="flex items-center gap-2 text-[15px] font-bold tf-text">
            <Users size={18} className="tf-text-subtle" />
            People ({members.length})
          </h3>
        </div>
        {loading ? (
          <TableSkeleton rows={6} cols={5} className="mx-4 my-4 w-[calc(100%-2rem)]" />
        ) : members.length === 0 ? (
          <div className="py-10">
            <EmptyState title="No members found" />
          </div>
        ) : (
          <div>
            {/* Mobile Card Layout */}
            <div className="md:hidden tf-bd divide-y">
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
                  <div
                    key={memberId || memberUserId || memberEmail}
                    className="p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl tf-bg-3 text-[13px] font-bold tf-text-accent">
                          {memberName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold tf-text truncate">
                            {memberName}
                            {isCurrentUser && (
                              <span className="ml-1 text-[11px] font-normal tf-text-subtle">
                                (You)
                              </span>
                            )}
                          </p>
                          <p className="text-[12px] tf-text-muted truncate">
                            {memberEmail}
                          </p>
                        </div>
                      </div>
                      <Badge variant={member?.role || "member"} />
                    </div>

                    <div className="flex items-center justify-between text-[12px] tf-text-muted">
                      <span>Joined {joinedLabel}</span>
                      {canManageRoles && member?.role !== "owner" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setManageMember(member);
                          }}
                          className="tf-btn-base tf-btn-secondary tf-size-sm"
                        >
                          Manage
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table Layout */}
            <div className="tf-scroll-x hidden md:block">
              <table className="tf-table min-w-[600px]">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Joined</th>
                    {canManageRoles && <th>Actions</th>}
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
                        className="group/row"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl tf-bg-3 text-[13px] font-bold tf-text-accent transition-transform duration-300 group-hover/row:scale-110">
                              {memberName.charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <p className="text-[13px] font-semibold leading-tight tf-text">
                                {memberName}
                                {isCurrentUser && (
                                  <span className="ml-1 text-[11px] font-normal tf-text-subtle">
                                    (You)
                                  </span>
                                )}
                              </p>

                              <p className="mt-0.5 flex items-center gap-1 text-[12px] tf-text-muted">
                                <Mail size={10} />
                                {memberEmail}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <Badge variant={member?.role || "member"} />
                        </td>

                        <td className="px-6 py-4 text-[13px] tf-text-muted">
                          {joinedLabel}
                        </td>

                        {canManageRoles && (
                          <td className="px-6 py-4">
                            {member?.role !== "owner" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setManageMember(member);
                                }}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium tf-text-secondary transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                              >
                                Manage
                              </button>
                            ) : (
                              <span className="text-[13px] font-medium tf-text-muted">
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
          </div>
        )}
      </div>

      {canManageRoles && invitations.length > 0 && (
        <div className="mt-12">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight tf-text">
              Pending Invitations
            </h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {invitations.length} Pending
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl tf-card">
            <div className="tf-scroll-x">
            <table className="tf-table min-w-[600px]">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider tf-text-muted">
                    User
                  </th>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider tf-text-muted">
                    Role
                  </th>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider tf-text-muted">
                    Invited By
                  </th>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider tf-text-muted">
                    Sent
                  </th>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider tf-text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invite) => {
                  const inviteUser = invite.invitedUser;
                  const name = inviteUser?.name || invite.invitedEmail;
                  const inviterName = invite.invitedBy?.name || "Someone";
                  const sentLabel = getSafeDateLabel(invite.createdAt);

                  return (
                    <tr
                      key={invite._id}
                      className="group/row border-b border-slate-100 transition-colors duration-300 last:border-b-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[13px] font-bold text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold leading-tight tf-text">
                              {name}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-[12px] tf-text-muted">
                              <Mail size={10} />
                              {invite.invitedEmail}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={invite.role || "member"} />
                      </td>
                      <td className="px-6 py-4 text-[13px] tf-text-muted">
                        {inviterName}
                      </td>
                      <td className="px-6 py-4 text-[13px] tf-text-muted">
                        {sentLabel}
                      </td>
                      <td className="px-6 py-4 text-[13px]">
                        {invite.status === "pending" && (
                          <button
                            onClick={async () => {
                              const confirmed = await confirmAction({
                                title: "Cancel Invitation",
                                text: `Are you sure you want to cancel the invitation for ${name}?`,
                                confirmButtonText: "Cancel Invite",
                                confirmButtonColor: "bg-red-600 hover:bg-red-700",
                              });
                              if (confirmed) {
                                try {
                                  await cancelInvite(workspaceId, invite._id);
                                  showSuccess("Invitation cancelled");
                                  loadData();
                                } catch (err) {
                                  showError(err?.response?.data?.message || "Failed to cancel invite.");
                                }
                              }
                            }}
                            className="text-red-500 hover:text-red-600 hover:underline dark:text-red-400 dark:hover:text-red-300"
                          >
                            Cancel
                          </button>
                        )}
                        {invite.status !== "pending" && (
                          <span className="capitalize text-slate-400">{invite.status}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={closeInviteModal} title="Send Invitation">
        {formError && (
          <div className="tf-alert tf-alert-error mb-4" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="tf-label" htmlFor="invite-member-email">
              User Email *
            </label>

            <input
              id="invite-member-email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="user@example.com"
              className="tf-field w-full"
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
              className="tf-btn-base tf-btn-secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="tf-btn-base tf-btn-primary disabled:opacity-70"
            >
              {saving ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!manageMember} onClose={() => !roleUpdating && setManageMember(null)} title="Manage Member">
        {manageMember && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[16px] font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                {(getMemberUser(manageMember)?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[15px] font-semibold tf-text">
                  {getMemberUser(manageMember)?.name || "Unknown User"}
                </p>
                <p className="text-[13px] tf-text-muted">
                  {getMemberUser(manageMember)?.email || "No email"}
                </p>
              </div>
              <div className="ml-auto">
                <Badge variant={manageMember.role || "member"} />
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-[12px] font-bold uppercase tracking-wider tf-text-muted">
                Change Role
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleRoleChange(getMemberUserId(manageMember), "admin")}
                  disabled={roleUpdating || manageMember.role === "admin"}
                  className="flex flex-col items-center justify-center tf-card tf-card-hover rounded-xl p-4 hover:border-amber-500/40 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-amber-400/35"
                >
                  <ShieldAlert size={20} className="mb-2 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[13px] font-semibold tf-text">Admin</span>
                </button>
                <button
                  onClick={() => handleRoleChange(getMemberUserId(manageMember), "member")}
                  disabled={roleUpdating || manageMember.role === "member"}
                  className="flex flex-col items-center justify-center tf-card tf-card-hover rounded-xl p-4 hover:border-amber-500/40 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-amber-400/35"
                >
                  <Shield size={20} className="mb-2 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[13px] font-semibold tf-text">Member</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="mb-3 text-[12px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400">
                Danger Zone
              </h4>
              <button
                onClick={() => handleRemoveMemberClick(manageMember)}
                disabled={roleUpdating}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-900/40"
              >
                <Trash2 size={16} />
                Remove Member
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={confirmRemoveMember}
        title="Remove member?"
        message="This user will lose access to this workspace."
        confirmText="Remove Member"
      />
    </DashboardLayout>
  );
}

export default Members;
