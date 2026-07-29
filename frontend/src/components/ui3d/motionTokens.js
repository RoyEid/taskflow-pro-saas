/* Shared motion vocabulary. Every animated surface pulls from here so the
   whole app decelerates the same way. */

export const springSoft = {
  type: "spring",
  stiffness: 260,
  damping: 26,
  mass: 0.9,
};

export const springSnappy = {
  type: "spring",
  stiffness: 420,
  damping: 32,
  mass: 0.7,
};

export const easeOut = {
  duration: 0.45,
  ease: [0.16, 1, 0.3, 1],
};

export const easeOutFast = {
  duration: 0.26,
  ease: [0.16, 1, 0.3, 1],
};

/* Entrance used by panels, modals, and revealed sections */
export const riseIn = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, y: 8 },
};

/* Parent/child pair for staggered lists */
export const staggerParent = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const staggerChild = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: easeOut },
};
