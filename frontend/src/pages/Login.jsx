import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import useAuth from "../context/useAuth";
import AuthLayout from "../layouts/AuthLayout";
import { showSuccess, showError } from "../utils/alerts";
import PasswordInput from "../components/ui/PasswordInput";
import api from "../services/api";

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49v-1.72c-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05A9.33 9.33 0 0 1 12 6.99c.85 0 1.7.12 2.5.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.95.68 1.92v2.84c0 .27.18.59.69.49A10.09 10.09 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [emailReadOnly, setEmailReadOnly] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (user) {
      const redirectTo = searchParams.get("redirect");
      navigate(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard", { replace: true });
    }
  }, [user, navigate, searchParams]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const messageParam = searchParams.get("message");
    const emailParam = searchParams.get("email");

    if (errorParam) {
      if (errorParam === "oauth_failed") {
        showError(
          "Authentication with provider failed. Please try again or use email/password."
        );
      } else {
        showError(errorParam);
      }
    }

    if (messageParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuccess(messageParam);
      if (messageParam.toLowerCase().includes("could not be sent") && emailParam) {

        setUnverifiedEmail(emailParam.trim().toLowerCase());
      }
    }

    if (emailParam) {

      setEmail(emailParam.trim().toLowerCase());

      setEmailReadOnly(false);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setUnverifiedEmail("");

    try {
      await login(email, password, rememberMe);
      const redirectTo = searchParams.get("redirect");
      navigate(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Login failed. Please try again.";

      setError(errorMsg);

      if (errorMsg === "Please verify your email before logging in.") {
        setUnverifiedEmail(email);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || !unverifiedEmail) return;

    setResending(true);

    try {
      await api.post("/auth/resend-verification", { email: unverifiedEmail });
      showSuccess("Verification code sent to your email!");
      navigate(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your TaskFlow Pro account"
    >
      {success && (
        <div className={success.toLowerCase().includes("could not be sent")
          ? "mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400"
          : "mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
        }>
          <div>{success}</div>

          {unverifiedEmail && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className={success.toLowerCase().includes("could not be sent")
                  ? "font-semibold text-amber-800 underline hover:text-amber-950 disabled:opacity-50 dark:text-amber-300 dark:hover:text-amber-200 text-[13px]"
                  : "font-semibold text-emerald-800 underline hover:text-emerald-950 disabled:opacity-50 dark:text-emerald-300 dark:hover:text-emerald-200 text-[13px]"
                }
              >
                {resending ? "Resending..." : "Resend verification code"}
              </button>
              <span className={success.toLowerCase().includes("could not be sent") ? "text-amber-600 dark:text-amber-500" : "text-emerald-600 dark:text-emerald-500"}>•</span>
              <Link
                to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                className={success.toLowerCase().includes("could not be sent")
                  ? "font-semibold text-amber-800 underline hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-200 text-[13px]"
                  : "font-semibold text-emerald-800 underline hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-200 text-[13px]"
                }
              >
                Enter code
              </Link>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="tf-alert tf-alert-error mb-6" role="alert">
          <div>{error}</div>

          {unverifiedEmail && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="font-semibold text-red-800 underline hover:text-red-900 disabled:opacity-50 dark:text-red-300 dark:hover:text-red-200 text-[13px]"
              >
                {resending ? "Resending..." : "Resend verification code"}
              </button>
              <span className="text-red-500/50 dark:text-red-400/50">•</span>
              <Link
                to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                className="font-semibold text-red-800 underline hover:text-red-900 dark:text-red-300 dark:hover:text-red-200 text-[13px]"
              >
                Enter code
              </Link>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div>
          <label htmlFor="email" className="tf-label">
            Email address
          </label>

          <input
            type="email"
            name="email"
            id="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            readOnly={emailReadOnly}
            onFocus={() => setEmailReadOnly(false)}
            className="tf-field w-full"
          />
        </div>

        <div>
          <div className="mb-1.5 sm:mb-2 flex items-center justify-between">
            <label className="tf-label mb-0" htmlFor="login-password">
              Password
            </label>

            <Link
              to="/forgot-password"
              className="tf-btn-link"
            >
              Forgot password?
            </Link>
          </div>

          <PasswordInput
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
            inputClassName="tf-field w-full pl-3.5 pr-11"
          />
        </div>

        <div className="flex items-center">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded tf-bd text-[var(--tf-accent)] focus:ring-[var(--tf-accent)]"
          />

          <label
            htmlFor="remember-me"
            className="ml-2 block cursor-pointer text-[13px] tf-text-secondary"
          >
            Remember me
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="tf-btn-base tf-btn-primary mt-4 sm:mt-6 w-full"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full tf-bd border-t" />
          </div>

          <div className="relative flex justify-center text-[12px]">
            <span className="tf-bg-1 px-3 tf-text-muted">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <a
            href={`${API_URL}/auth/google`}
            className="tf-btn-base tf-btn-secondary w-full"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </a>

          <a
            href={`${API_URL}/auth/github`}
            className="tf-btn-base tf-btn-secondary w-full"
          >
            <GitHubIcon />
            GitHub
          </a>
        </div>
      </div>

      <p className="mt-8 text-center text-[13px] tf-text-muted">
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          className="tf-btn-link"
        >
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Login;
