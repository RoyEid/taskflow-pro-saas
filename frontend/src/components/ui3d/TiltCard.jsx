import { useCallback, useEffect, useRef } from "react";
import useReducedMotion from "../../hooks/useReducedMotion";

/* Pointer-driven rotateX/rotateY for a single card.

   Writes CSS custom properties inside a rAF frame instead of React state,
   so tracking the cursor never re-renders the tree. Switches itself off
   for coarse pointers, reduced-motion users, and low-capability devices. */
function TiltCard({
  children,
  max = 6,
  className = "",
  as: Tag = "div",
  ...rest
}) {
  const wrapperRef = useRef(null);
  const frameRef = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  const write = useCallback((rotateX, rotateY) => {
    const node = wrapperRef.current;

    if (node) {
      node.style.setProperty("--tf-rx", `${rotateX.toFixed(2)}deg`);
      node.style.setProperty("--tf-ry", `${rotateY.toFixed(2)}deg`);
    }
  }, []);

  useEffect(() => {
    const node = wrapperRef.current;

    if (!node || prefersReducedMotion) {
      return undefined;
    }

    if (document.documentElement.getAttribute("data-perf") === "low") {
      return undefined;
    }

    if (!window.matchMedia("(pointer: fine)").matches) {
      return undefined;
    }

    const handleMove = (event) => {
      const bounds = node.getBoundingClientRect();

      if (!bounds.width || !bounds.height) {
        return;
      }

      const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
      const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;

      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        write(-offsetY * max * 2, offsetX * max * 2);
      });
    };

    const handleLeave = () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => write(0, 0));
    };

    node.addEventListener("pointermove", handleMove);
    node.addEventListener("pointerleave", handleLeave);

    return () => {
      cancelAnimationFrame(frameRef.current);
      node.removeEventListener("pointermove", handleMove);
      node.removeEventListener("pointerleave", handleLeave);
    };
  }, [max, prefersReducedMotion, write]);

  return (
    <div className="tf-scene">
      <Tag ref={wrapperRef} className={`tf-tilt ${className}`} {...rest}>
        {children}
      </Tag>
    </div>
  );
}

export default TiltCard;
