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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <div className="inline-flex items-center justify-center rounded-full tf-bg-3 px-3 py-1 text-[13px] font-medium tf-text-accent">
          {email}
        </div>
      </div>

      {warning && (
        <div className="tf-alert tf-alert-warning mb-6" role="status">
          {warning}
        </div>
      )}

      {error && (
        <div className="tf-alert tf-alert-error mb-6" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className="flex justify-between gap-1 sm:gap-2.5"
          role="group"
          aria-label="Six-digit verification code"
        >
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              aria-label={`Verification code digit ${index + 1}`}
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="tf-field w-[14%] aspect-square max-w-[56px] min-w-[32px] text-center text-lg sm:text-xl font-bold"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || code.join("").length !== 6}
          className="tf-btn-base tf-btn-primary w-full"
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

      <div className="mt-8 text-center text-[13px] tf-text-secondary">
        Didn't receive the code?{" "}
        <button
          onClick={handleResend}
          disabled={resending}
          className="tf-btn-link"
        >
          {resending ? "Sending..." : "Resend code"}
        </button>
      </div>

      <p className="mt-4 text-center text-[13px] tf-text-muted">
        <Link to="/login" className="tf-btn-link">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}

export default VerifyEmail;
