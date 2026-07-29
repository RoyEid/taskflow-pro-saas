import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({
  label,
  name,
  value,
  onChange,
  placeholder = "••••••••",
  required = false,
  error = "",
  autoComplete = "current-password",
  disabled = false,
  className = "",
  inputClassName = "",
  id,
  onFocus,
  ...props
}) {
  // Controls password visibility state (text vs. password input type)
  const [showPassword, setShowPassword] = useState(false);
  // Starts as readOnly to prevent aggressive browser autofills on page load
  const [isReadOnly, setIsReadOnly] = useState(true);
  const generatedId = useId();
  const inputId = id || name || `password-${generatedId.replace(/:/g, "")}`;
  const errorId = `${inputId}-error`;

  const defaultInputStyle =
    "tf-field w-full pl-4 pr-11";

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="tf-label"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          // Starts as readOnly to block autofill, then switches on initial user interaction
          readOnly={props.readOnly !== undefined ? props.readOnly : isReadOnly}
          onFocus={(e) => {
            setIsReadOnly(false); // Enable editing once focused
            if (onFocus) onFocus(e);
          }}
          className={`${inputClassName || defaultInputStyle} ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
              : ""
          }`}
          {...props}
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={
            showPassword
              ? "Password visible, click to hide"
              : "Password hidden, click to show"
          }
          className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[var(--tf-r-sm)] tf-text-muted transition hover:bg-[var(--tf-bg-3)] hover:text-[var(--tf-fg)] disabled:opacity-50 sm:right-1 sm:h-10 sm:w-10"
        >
          {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>

      {error && (
        <p id={errorId} className="tf-msg-error mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
}
