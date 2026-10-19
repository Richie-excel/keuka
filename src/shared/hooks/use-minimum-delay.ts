import { useEffect, useState } from "react";
import { SKELETON_DURATION_MS } from "@/constants";

/**
 * `true` once `ms` milliseconds have passed since the component mounted.
 *
 * Keeps a skeleton on screen for a minimum time so a fast response does not
 * flash it for a single frame.
 */
export function useMinimumDelay(ms: number = SKELETON_DURATION_MS) {
  const [elapsed, setElapsed] = useState(ms <= 0);

  useEffect(() => {
    if (ms <= 0) return;
    const timer = window.setTimeout(() => setElapsed(true), ms);
    return () => window.clearTimeout(timer);
  }, [ms]);

  return elapsed;
}
