import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import AuthLayout from "../layouts/AuthLayout";
import { showSuccess, showError } from "../utils/alerts";
import api from "../services/api";
import { checkPasswordRules } from "../utils/passwordValidation";
import PasswordStrengthIndicator from "../components/PasswordStrengthIndicator";
import PasswordInput from "../components/ui/PasswordInput";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get("email") || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password", { replace: true });
    }
  }, [email, navigate]);

  const { allPassed } = checkPasswordRules(password);

  const handleCodeChange = (index, e) => {
    const value = e.target.value;

    if (value && !/^\d+$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);

    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    const pastedData = e.clipboardData.getData("text").trim();

    if (!/^\d+$/.test(pastedData)) return;

    const pastedArray = pastedData.slice(0, 6).split("");
    const newCode = [...code];

    pastedArray.forEach((char, index) => {
      if (index < 6) {
        newCode[index] = char;
      }
    });

    setCode(newCode);

    const focusIndex = Math.min(pastedArray.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim();
    const resetCode = code.join("");
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError("Email is missing. Please restart the password reset process.");
      navigate("/forgot-password", { replace: true });
      return;
    }

    if (resetCode.length !== 6) {
      setError("Please enter the 6-digit reset code.");
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
      await api.post("/auth/reset-password", {
        email: cleanEmail,
        code: resetCode,
        newPassword: cleanPassword,
      });

      showSuccess("Password reset successfully. You can now login.");
      navigate("/login");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Failed to reset password. Please try again.";

      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create new password" subtitle={`For ${email}`}>
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-slate-700 dark:text-slate-300">
            Reset Code
          </label>

          <div className="flex justify-between gap-2">
            {code.map((digit, index) => (
              <input
                key={`reset-code-${index}`}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="h-10 w-10 rounded-xl border border-slate-200 bg-white/50 text-center text-lg font-bold text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700/80 dark:bg-slate-900/50 dark:text-slate-200 dark:focus:border-indigo-500 dark:focus:bg-slate-900 sm:h-12 sm:w-12"
              />
            ))}
          </div>
        </div>

        <PasswordInput
          label="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a new password"
          required
          autoComplete="new-password"
        />

        <PasswordStrengthIndicator password={password} confirmPassword={confirmPassword} />

        <PasswordInput
          label="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your new password"
          required
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={
            loading ||
            !allPassed ||
            code.join("").length !== 6 ||
            (password && confirmPassword && password !== confirmPassword)
          }
          className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-indigo-600 text-[14px] font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Resetting password...
            </span>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-[13px] text-slate-500 dark:text-slate-400">
        <Link
          to="/login"
          className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}

export default ResetPassword;