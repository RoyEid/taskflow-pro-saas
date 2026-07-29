import { TrendingUp } from "lucide-react";

const bars = [42, 58, 39, 71, 63, 88, 76];
const days = ["M", "T", "W", "T", "F", "S", "S"];

/* Floating analytics summary with a mini weekly-throughput chart. */
function AnalyticsCard() {
  return (
    <div className="lp-panel-shadow w-full rounded-2xl border border-white/60 bg-white/90 p-4 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/90">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-wider tf-text-subtle">
            Tasks completed
          </p>
          <p className="lp-tabular mt-1 text-2xl font-extrabold tf-text">
            437
          </p>
        </div>

        <span className="flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          <TrendingUp size={12} />
          +24%
        </span>
      </div>

      {/* Bars are direct children of a fixed-height flex row, so their
          percentage heights resolve. Labels sit in a separate row. */}
      <div className="mt-4">
        <div className="flex h-20 items-end gap-1.5">
          {bars.map((value, index) => (
            <div
              key={days[index] + index}
              className={`flex-1 rounded-t-md ${
                index === bars.length - 2
                  ? "bg-gradient-to-t from-amber-600 to-amber-400"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
              style={{ height: `${value}%` }}
            />
          ))}
        </div>

        <div className="mt-1.5 flex gap-1.5">
          {days.map((day, index) => (
            <span
              key={day + index}
              className="flex-1 text-center text-[9px] font-semibold tf-text-subtle"
            >
              {day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsCard;
