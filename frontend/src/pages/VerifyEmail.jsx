import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import useAuth from "../context/useAuth";
import AuthLayout from "../layouts/AuthLayout";
import { showSuccess } from "../utils/alerts";
import api from "../services/api";

function VerifyEmail() {
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const navigate = useNavigate();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate("/register", { replace: true });
    }
    const warningParam = searchParams.get("warning");
    if (warningParam) {
      setWarning(warningParam);
    }
  }, [email, navigate, searchParams]);

  const handleChange = (index, e) => {
    const value = e.target.value;
    
    // Allow only numbers
    if (value && !/^\d+$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Take only the last character entered
    setCode(newCode);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pastedData)) return;

    const pastedArray = pastedData.slice(0, 6).split("");
    const newCode = [...code];
    
    pastedArray.forEach((char, idx) => {
      if (idx < 6) newCode[idx] = char;
    });
    
    setCode(newCode);

    // Focus on the next empty input or the last one
    const focusIndex = Math.min(pastedArray.length, 5);
    inputRefs.current[focusIndex].focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setWarning("");

    const verificationCode = code.join("");
    
    if (verificationCode.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      await verifyEmail(email.trim().toLowerCase(), verificationCode);
      showSuccess("Email verified successfully! Logging you in...");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (!err.response) {
        setError("Cannot connect to server. Make sure the backend is running.");
      } else {
        setError(err.response.data?.message || "Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending) return;
    setError("");
    setWarning("");
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email: email.trim().toLowerCase() });
      showSuccess("Verification code sent!");
      // Clear current input
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0].focus();
    } catch (err) {
      if (!err.response) {
        setError("Cannot connect to server. Make sure the backend is running.");
      } else {
        setError(err.response.data?.message || "Failed to resend code.");
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout title="Check your email" subtitle="Enter the 6-digit code sent to your email">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center rounded-full bg-indigo-50 px-3 py-1 text-[13px] font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
          {email}
        </div>
      </div>

      {warning && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
          {warning}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between gap-2">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="h-12 w-12 rounded-xl border border-slate-200 bg-white/50 text-center text-xl font-bold text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700/80 dark:bg-slate-900/50 dark:text-slate-200 dark:focus:border-indigo-500 dark:focus:bg-slate-900 sm:h-14 sm:w-14"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || code.join("").length !== 6}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-indigo-600 text-[14px] font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Verifying...
            </span>
          ) : (
            "Verify Email"
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-[13px] text-slate-600 dark:text-slate-400">
        Didn't receive the code?{" "}
        <button
          onClick={handleResend}
          disabled={resending}
          className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          {resending ? "Sending..." : "Resend code"}
        </button>
      </div>

      <p className="mt-4 text-center text-[13px] text-slate-500 dark:text-slate-400">
        <Link to="/login" className="font-semibold text-slate-700 hover:text-slate-900 hover:underline dark:text-slate-300 dark:hover:text-white">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}

export default VerifyEmail;
