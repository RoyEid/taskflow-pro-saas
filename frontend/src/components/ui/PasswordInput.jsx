import { useState } from "react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(true);

  const defaultInputStyle =
    "h-11 w-full rounded-xl border border-slate-200 bg-white/50 pl-4 pr-11 text-[14px] text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700/80 dark:bg-slate-900/50 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-indigo-500 dark:focus:bg-slate-900";

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={id || name}
          className="mb-2 block text-[13px] font-semibold text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={id || name}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          readOnly={props.readOnly !== undefined ? props.readOnly : isReadOnly}
          onFocus={(e) => {
            setIsReadOnly(false);
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
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 disabled:opacity-50"
        >
          {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>

      {error && (
        <p className="mt-1.5 text-[12px] text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
