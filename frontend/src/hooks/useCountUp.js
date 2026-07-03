import { useState, useEffect } from 'react';

export default function useCountUp(endValue, duration = 800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || endValue === 0) {
      setTimeout(() => setCount(endValue), 0);
      return;
    }

    let startTime = null;
    let animationFrame;

    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const step = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = currentTime - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      const easedProgress = easeOutQuart(percentage);
      const currentCount = Math.floor(easedProgress * endValue);
      
      setCount(currentCount);

      if (progress < duration) {
        animationFrame = requestAnimationFrame(step);
      } else {
        setCount(endValue);
      }
    };

    animationFrame = requestAnimationFrame(step);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [endValue, duration]);

  return count;
}
