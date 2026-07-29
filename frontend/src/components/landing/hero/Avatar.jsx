const palettes = [
  "bg-amber-500 text-white",
  "bg-stone-600 text-white",
  "bg-emerald-600 text-white",
  "bg-rose-500 text-white",
  "bg-sky-600 text-white",
  "bg-violet-500 text-white",
];

function getInitials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/* Deterministic initial-avatar, so the mock UI needs no image assets. */
function Avatar({ name, size = 24, ring = false }) {
  const paletteIndex = name.charCodeAt(0) % palettes.length;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${
        palettes[paletteIndex]
      } ${ring ? "ring-2 ring-white dark:ring-slate-800" : ""}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {getInitials(name)}
    </span>
  );
}

export default Avatar;
