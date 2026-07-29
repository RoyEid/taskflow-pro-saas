import useCountUp from "../../hooks/useCountUp";

/* Product-true figures rather than invented adoption numbers — each one
   is verifiable in the app itself. Swap in real usage metrics when there
   are some to show. */
const stats = [
  { value: 4, suffix: "", label: "Workspace roles" },
  { value: 6, suffix: "", label: "Built-in modules" },
  { value: 2, suffix: "", label: "OAuth providers" },
];

function Stat({ value, suffix, label, duration }) {
  const count = useCountUp(value, duration);

  return (
    <div className="text-center sm:text-left">
      <p className="lp-tabular text-2xl font-extrabold tf-text sm:text-[28px]">
        {count}
        {suffix}
      </p>
      <p className="mt-0.5 text-[12.5px] font-medium tf-text-muted">
        {label}
      </p>
    </div>
  );
}

function StatStrip() {
  return (
    <dl className="grid grid-cols-3 gap-4 sm:gap-8">
      {stats.map((stat, index) => (
        <Stat key={stat.label} {...stat} duration={900 + index * 160} />
      ))}
    </dl>
  );
}

export default StatStrip;
