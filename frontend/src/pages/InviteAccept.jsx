import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { getInviteByToken, acceptInvite, declineInvite } from "../services/memberService";
import useAuth from "../context/useAuth";
import { showSuccess, showError } from "../utils/alerts";
import { Mail, Check, X, Building, Loader2, Clock, Ban, CheckCircle, XCircle } from "lucide-react";
import BrandLoader from "../components/ui/BrandLoader";

function getUserId(u) {
  return u?._id || u?.id || null;
}

function InviteAccept() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadInvite() {
      try {
        const data = await getInviteByToken(token);
        if (data?.invitation) {
          setInvite(data.invitation);
        } else {
          setError("Invalid invitation data.");
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load invitation. It may be invalid or expired.");
      } finally {
        setLoading(false);
      }
    }
    loadInvite();
  }, [token]);

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await acceptInvite(token);
      showSuccess("Invitation accepted!");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to accept invitation.");
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    setActionLoading(true);
    try {
      await declineInvite(token);
      showSuccess("Invitation declined.");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to decline invitation.");
      setActionLoading(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <BrandLoader
        text="Loading invitation..."
        fullScreen={true}
        size="lg"
      />
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500">
            <X size={24} />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Invitation Unavailable</h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{error}</p>
          <Link
            to="/"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Non-pending invite states (expired, accepted, declined, cancelled)
  if (invite && invite.status !== "pending") {
    const statusConfig = {
      expired: {
        icon: <Clock size={24} />,
        iconBg: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-500",
        title: "Invitation Expired",
        message: "This invitation has expired. Please ask the workspace owner to send a new invitation.",
      },
      accepted: {
        icon: <CheckCircle size={24} />,
        iconBg: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500",
        title: "Already Accepted",
        message: "This invitation has already been accepted. You should have access to the workspace.",
      },
      declined: {
        icon: <XCircle size={24} />,
        iconBg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
        title: "Invitation Declined",
        message: "This invitation has been declined. If this was a mistake, ask the workspace owner to send a new invitation.",
      },
      cancelled: {
        icon: <Ban size={24} />,
        iconBg: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500",
        title: "Invitation Cancelled",
        message: "This invitation was cancelled by the workspace owner or admin.",
      },
    };

    const config = statusConfig[invite.status] || statusConfig.expired;

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-900">
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${config.iconBg}`}>
            {config.icon}
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">{config.title}</h2>
          {invite.workspace?.name && (
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
              Workspace: <strong>{invite.workspace.name}</strong>
            </p>
          )}
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{config.message}</p>
          <Link
            to={user ? "/dashboard" : "/login"}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            {user ? "Go to Dashboard" : "Go to Login"}
          </Link>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            <Building size={24} />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Sign in required</h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            You've been invited to join <strong>{invite?.workspace?.name}</strong> by <strong>{invite?.invitedBy?.name}</strong>.
            Please sign in with the invited email to accept this invitation.
          </p>
          <Link
            to={`/login?redirect=/invitations/${token}`}
            className="inline-flex w-full h-10 items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            Sign In to Accept
          </Link>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Don't have an account? <Link to="/register" className="text-indigo-600 hover:underline dark:text-indigo-400">Register here</Link>
          </p>
        </div>
      </div>
    );
  }

  // Logged in with wrong email
  const currentUserId = getUserId(user);
  const invitedUserId = getUserId(invite?.invitedUser);
  if (currentUserId !== invitedUserId && user.email !== invite?.invitedEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-500">
            <Mail size={24} />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Account Mismatch</h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            This invitation was sent to <strong>{invite?.invitedEmail}</strong>, but you are logged in as <strong>{user.email}</strong>.
          </p>
          <Link
            to="/settings"
            className="inline-flex w-full h-10 items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            Go to Settings / Sign Out
          </Link>
        </div>
      </div>
    );
  }

  // Valid pending invite — show accept/decline
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-6 text-center dark:border-slate-800 dark:bg-slate-800/20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            <Building size={32} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            Workspace Invitation
          </h2>
        </div>
        
        <div className="p-8 text-center">
          <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
            <strong>{invite?.invitedBy?.name}</strong> has invited you to join the workspace <strong className="text-slate-900 dark:text-white">{invite?.workspace?.name}</strong> as a <strong>{invite?.role}</strong>.
          </p>

          {invite?.expiresAt && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <Clock size={12} />
              Expires {new Date(invite.expiresAt).toLocaleDateString()}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={handleAccept}
              disabled={actionLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-70 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Check size={18} />
              {actionLoading ? "Processing..." : "Accept Invitation"}
            </button>
            <button
              onClick={handleDecline}
              disabled={actionLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/50"
            >
              <X size={18} />
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InviteAccept;
