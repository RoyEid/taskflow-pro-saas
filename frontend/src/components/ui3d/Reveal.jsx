import { motion } from "motion/react";
import { easeOut } from "./motionTokens";

/* Canonical scroll-reveal for the whole app.

   Uses motion's viewport tracking with once:true, so an element animates
   a single time and then stops being observed. MotionConfig's
   reducedMotion="user" turns the transform into a no-op automatically. */
function Reveal({
  children,
  delay = 0,
  y = 22,
  as = "div",
  className = "",
  amount = 0.2,
  ...rest
}) {
  const Component = motion[as] || motion.div;

  return (
    <Component
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ ...easeOut, delay: delay / 1000 }}
      className={className}
      {...rest}
    >
      {children}
    </Component>
  );
}

export default Reveal;
