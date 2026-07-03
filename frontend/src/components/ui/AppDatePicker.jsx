import { forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AppDatePicker = forwardRef(({ label, error, required = false, ...props }, ref) => {
  return (
    <div className={`app-date-picker ${error ? "has-error" : ""}`}>
      {label && (
        <label className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
          {label} {required && "*"}
        </label>
      )}
      <div className="relative w-full">
        <DatePicker
          {...props}
          ref={ref}
          className="h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 pl-3.5 pr-10 text-[13px] text-slate-800 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:focus:border-slate-500"
          calendarClassName="dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 font-sans border-slate-200 shadow-md rounded-lg"
          wrapperClassName="w-full"
          popperClassName="z-50"
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
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        >
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      </div>
      {error && <p className="mt-1.5 text-[11px] text-red-500">{error}</p>}
    </div>
  );
});

AppDatePicker.displayName = "AppDatePicker";

export default AppDatePicker;
