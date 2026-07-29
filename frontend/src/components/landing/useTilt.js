import { useCallback, useEffect, useRef } from "react";
import useReducedMotion from "./useReducedMotion";

const BASE_ROTATE_X = 13;
const BASE_ROTATE_Y = -15;
const RANGE_X = 5;
const RANGE_Y = 7;

/* Drives the hero scene's rotation from pointer position.

   Writes to CSS custom properties inside a rAF frame rather than to React
   state, so pointer movement never triggers a re-render. Returns a ref for
   the tracked area and a ref for the element that receives the rotation.

   Disabled entirely when the user prefers reduced motion or the device has
   no fine pointer — the stage keeps its static CSS rotation instead. */
function useTilt() {
  const areaRef = useRef(null);
  const stageRef = useRef(null);
  const frameRef = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  const applyRotation = useCallback((rotateX, rotateY) => {
    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    stage.style.setProperty("--lp-rx", `${rotateX.toFixed(2)}deg`);
    stage.style.setProperty("--lp-ry", `${rotateY.toFixed(2)}deg`);
  }, []);

  useEffect(() => {
    const area = areaRef.current;

    if (!area || prefersReducedMotion) {
      return undefined;
    }

    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

    if (!hasFinePointer) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      const bounds = area.getBoundingClientRect();

      if (!bounds.width || !bounds.height) {
        return;
      }

      // -0.5 .. 0.5 relative to the centre of the tracked area
      const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
      const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;

      cancelAnimationFrame(frameRef.current);

      frameRef.current = requestAnimationFrame(() => {
        applyRotation(
          BASE_ROTATE_X - offsetY * RANGE_X * 2,
          BASE_ROTATE_Y + offsetX * RANGE_Y * 2
        );
      });
    };

    const handlePointerLeave = () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        applyRotation(BASE_ROTATE_X, BASE_ROTATE_Y);
      });
    };

    area.addEventListener("pointermove", handlePointerMove);
    area.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      cancelAnimationFrame(frameRef.current);
      area.removeEventListener("pointermove", handlePointerMove);
      area.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [applyRotation, prefersReducedMotion]);

  return { areaRef, stageRef };
}

export default useTilt;
