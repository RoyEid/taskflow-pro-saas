import { forwardRef, useId } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AppDatePicker = forwardRef(({ label, error, required = false, ...props }, ref) => {
  const generatedId = useId();
  const inputId = props.id || `app-date-${generatedId.replace(/:/g, "")}`;
  const errorId = `${inputId}-error`;

  return (
    <div className={`app-date-picker ${error ? "has-error" : ""}`}>
      {label && (
        <label className="tf-label" htmlFor={inputId}>
          {label} {required && <span className="tf-text-danger">*</span>}
        </label>
      )}
      <div className="relative w-full">
        <DatePicker
          {...props}
          id={inputId}
          ref={ref}
          className="tf-field w-full pl-3.5 pr-10"
          calendarClassName="dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 font-sans border-slate-200 shadow-md rounded-lg"
          wrapperClassName="w-full"
          popperClassName="z-50"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 tf-text-subtle"
        >
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      </div>
      {error && <p id={errorId} className="tf-msg-error mt-1.5">{error}</p>}
    </div>
  );
});

AppDatePicker.displayName = "AppDatePicker";

export default AppDatePicker;
