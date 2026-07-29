import { useEffect } from "react";

/* Flags weak devices once, at startup, by stamping html[data-perf="low"].

   The CSS layer keys off that attribute to drop backdrop-filter, ambient
   auroras, and grain — the three things that actually cost frames. Doing
   it with an attribute rather than React state means no component has to
   re-render, and plain CSS can opt out wholesale. */
function detectLowCapability() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const memory = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const saveData = navigator.connection?.saveData === true;

  if (saveData) return true;
  if (typeof memory === "number" && memory > 0 && memory <= 4) return true;
  if (typeof cores === "number" && cores > 0 && cores <= 4) return true;

  return false;
}

function useDeviceCapability() {
  useEffect(() => {
    if (detectLowCapability()) {
      document.documentElement.setAttribute("data-perf", "low");
    }
  }, []);
}

export default useDeviceCapability;
export { detectLowCapability };
