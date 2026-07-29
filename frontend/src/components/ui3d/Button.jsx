import { useCallback, useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { springSnappy } from "./motionTokens";

const MotionLink = motion.create(Link);

const base =
  "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl font-semibold transition-colors duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary:
    "tf-btn-base tf-btn-primary shadow-[var(--tf-elev-2)]",
  secondary:
    "tf-hairline bg-white/70 text-slate-700 backdrop-blur shadow-[var(--tf-elev-1)] hover:bg-white dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800",
  ghost:
    "text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10",
  danger:
    "bg-rose-600 text-white shadow-[var(--tf-elev-2)] hover:bg-rose-700",
};

const sizes = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-[14px]",
  lg: "h-12 px-6 text-[15px]",
};

/* Premium button: spring press, hover lift, and a click ripple.

   MotionConfig (set in main.jsx) resolves whileHover/whileTap to no-ops
   for reduced-motion users, so the lift and press disappear for them
   without any branching here. */
function Button({
  as,
  to,
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  onClick,
  ...rest
}) {
  const [ripple, setRipple] = useState(null);

  const handleClick = useCallback(
    (event) => {
      const bounds = event.currentTarget.getBoundingClientRect();

      setRipple({
        key: Date.now(),
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      onClick?.(event);
    },
    [onClick]
  );

  const Component = as || (to ? MotionLink : href ? motion.a : motion.button);
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  const linkProps = to ? { to } : href ? { href } : { type: rest.type || "button" };

  return (
    <Component
      className={classes}
      onClick={handleClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97, y: 0 }}
      transition={springSnappy}
      {...linkProps}
      {...rest}
    >
      {ripple && (
        <motion.span
          key={ripple.key}
          initial={{ opacity: 0.45, scale: 0 }}
          animate={{ opacity: 0, scale: 4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          onAnimationComplete={() => setRipple(null)}
          className="pointer-events-none absolute h-24 w-24 rounded-full bg-current"
          style={{ left: ripple.x - 48, top: ripple.y - 48 }}
        />
      )}

      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </Component>
  );
}

export default Button;
