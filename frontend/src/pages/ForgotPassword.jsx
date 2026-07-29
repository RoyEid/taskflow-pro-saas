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

      showSuccess("If an account exists, a reset code was sent.");
      setSubmitted(true);
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
          <p className="text-[14px] tf-text-secondary">
            If an account exists for{" "}
            <span className="font-semibold tf-text">
              {email}
            </span>
            , you will receive an email with instructions on how to reset your
            password.
          </p>

          <button
            type="button"
            onClick={handleProceed}
            className="tf-btn-base tf-btn-primary mt-6 w-full"
          >
            Enter reset code
          </button>

          <Link
            to="/login"
            className="mt-4 block text-[13px] tf-btn-link"
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
        <div className="tf-alert tf-alert-error mb-6" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="tf-label" htmlFor="forgot-password-email">
            Email address
          </label>

          <input
            id="forgot-password-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="tf-field w-full"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="tf-btn-base tf-btn-primary mt-6 w-full"
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

      <p className="mt-8 text-center text-[13px] tf-text-muted">
        Remember your password?{" "}
        <Link
          to="/login"
          className="tf-btn-link"
        >
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default ForgotPassword;
