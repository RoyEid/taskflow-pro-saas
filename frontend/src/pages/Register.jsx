import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import useAuth from "../context/useAuth";
import AuthLayout from "../layouts/AuthLayout";
import { showError } from "../utils/alerts";
import { checkPasswordRules } from "../utils/passwordValidation";
import PasswordStrengthIndicator from "../components/PasswordStrengthIndicator";
import PasswordInput from "../components/ui/PasswordInput";

function GitHubIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.98c.85 0 1.7.12 2.5.35 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.38-.01 2.49-.01 2.83 0 .27.18.59.69.49A10.08 10.08 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { allPassed } = checkPasswordRules(password);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const errorParam = searchParams.get("error");

    if (errorParam === "oauth_failed") {
      showError(
        "Authentication with provider failed. Please try again or use email/password."
      );
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (!allPassed) {
      setError("Please meet all password requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await register(name, email, password);
      const normalizedEmail = email.trim().toLowerCase();
      
      if (data && data.emailSendFailed) {
        navigate(`/verify-email?email=${encodeURIComponent(normalizedEmail)}&warning=${encodeURIComponent("Account created, but verification email could not be sent. Please click resend verification code.")}`);
      } else {
        navigate(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`);
      }
    } catch (err) {
      if (!err.response) {
        setError("Cannot connect to server. Make sure the backend is running.");
      } else {
        const errorMsg = err.response.data?.message || "Registration failed. Please try again.";
        
        if (errorMsg.includes("Account already exists but is not verified")) {
          navigate(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}&warning=${encodeURIComponent("This account already exists but is not verified. Please enter your code or resend verification.")}`);
        } else {
          setError(errorMsg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start managing your work with TaskFlow Pro"
    >
      {error && (
        <div className="tf-alert tf-alert-error mb-6" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
        <div>
          <label className="tf-label" htmlFor="register-name">
            Full Name
          </label>

          <input
            id="register-name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="tf-field w-full"
          />
        </div>

        <div>
          <label className="tf-label" htmlFor="register-email">
            Email address
          </label>

          <input
            id="register-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="tf-field w-full"
          />
        </div>

        <PasswordInput
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password"
          required
          autoComplete="new-password"
          inputClassName="tf-field w-full pl-3.5 pr-11"
        />

        <PasswordStrengthIndicator password={password} confirmPassword={confirmPassword} />

        <PasswordInput
          label="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          required
          autoComplete="new-password"
          inputClassName="tf-field w-full pl-3.5 pr-11"
        />

        <button
          type="submit"
          disabled={
            loading ||
            !allPassed ||
            (password && confirmPassword && password !== confirmPassword)
          }
          className="tf-btn-base tf-btn-primary mt-4 sm:mt-6 w-full"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <div className="mt-6 sm:mt-8">
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

        <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3">
          <a
            href={`${API_URL}/auth/google`}
            className="tf-btn-base tf-btn-secondary w-full"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
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

      <p className="mt-6 sm:mt-8 text-center text-[13px] tf-text-muted">
        Already have an account?{" "}
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

export default Register;
