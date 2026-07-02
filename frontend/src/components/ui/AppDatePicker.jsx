import React, { forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AppDatePicker = forwardRef(({ label, error, required = false, ...props }, ref) => {
  return (
    <div className={`app-date-picker ${error ? "has-error" : ""}`}>
      {label && (
        <label className="mb-1.5 block text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
          {label} {required && "*"}
        </label>
      )}
      <div className="relative w-full">
        <DatePicker
          {...props}
          className="h-10 w-full cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50 pl-3.5 pr-10 text-[13px] text-zinc-800 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200 dark:focus:border-zinc-500"
          calendarClassName="dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200 font-sans border-zinc-200 shadow-md rounded-lg"
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
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
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
