import { CheckCircle2, Circle } from "lucide-react";
import { checkPasswordRules } from "../utils/passwordValidation";

export default function PasswordStrengthIndicator({ password, confirmPassword }) {
  if (!password) return null;

  const { rules, score, strengthLabel, barColor } = checkPasswordRules(password);
  const passwordsMatch = confirmPassword ? password === confirmPassword : false;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mb-2 flex items-center justify-between text-[12px]">
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          Security Check
        </span>

        <span
          className={`font-bold ${
            strengthLabel === "Weak"
              ? "text-red-500"
              : strengthLabel === "Medium"
              ? "text-amber-500"
              : "text-emerald-500"
          }`}
        >
          {strengthLabel}
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${(score / rules.length) * 100}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`flex items-center gap-1.5 text-[12px] ${
              rule.passed
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {rule.passed ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            {rule.label}
          </div>
        ))}
        {confirmPassword !== undefined && confirmPassword !== "" && (
          <div
            className={`flex items-center gap-1.5 text-[12px] col-span-2 ${
              passwordsMatch
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {passwordsMatch ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            Passwords Match
          </div>
        )}
      </div>
    </div>
  );
}
