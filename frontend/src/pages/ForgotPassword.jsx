import { useState } from "react";
import { Link, useNavigate } from "react-router";
import AuthLayout from "../layouts/AuthLayout";
import api from "../services/api";
import { showSuccess, showError } from "../utils/alerts";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/forgot-password", { email: cleanEmail });

      setEmail(cleanEmail);
      setSubmitted(true);

      showSuccess("If an account exists, a reset code was sent.");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Failed to send reset code. Please try again.";

      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`);
  };

  if (submitted) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent password reset instructions"
      >
        <div className="space-y-6 text-center">
          <p className="text-[14px] text-slate-600 dark:text-slate-400">
            If an account exists for{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-200">
              {email}
            </span>
            , you will receive an email with instructions on how to reset your
            password.
          </p>

          <button
            type="button"
            onClick={handleProceed}
            className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-indigo-600 text-[14px] font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/20 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            Enter reset code
          </button>

          <Link
            to="/login"
            className="mt-4 block text-[13px] font-semibold text-slate-700 hover:text-slate-900 hover:underline dark:text-slate-300 dark:hover:text-white"
          >
            Return to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your email to receive a reset link"
    >
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-slate-700 dark:text-slate-300">
            Email address
          </label>

          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white/50 px-4 text-[14px] text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700/80 dark:bg-slate-900/50 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-indigo-500 dark:focus:bg-slate-900"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-indigo-600 text-[14px] font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Sending...
            </span>
          ) : (
            "Send reset code"
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-[13px] text-slate-500 dark:text-slate-400">
        Remember your password?{" "}
        <Link
          to="/login"
          className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default ForgotPassword;