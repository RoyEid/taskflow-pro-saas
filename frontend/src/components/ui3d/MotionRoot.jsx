import { MotionConfig } from "motion/react";
import useDeviceCapability from "../../hooks/useDeviceCapability";

/* Single place that configures motion for the whole app.

   reducedMotion="user" makes every motion component drop transform and
   layout animations when the OS asks for reduced motion, so individual
   components don't each need to branch on it. */
function MotionRoot({ children }) {
  useDeviceCapability();

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </MotionConfig>
  );
}

export default MotionRoot;
