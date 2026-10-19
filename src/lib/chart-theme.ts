/**
 * Shared recharts styling.
 *
 * Kept out of component files on purpose: a module that exports both a
 * component and a constant defeats React Fast Refresh, so the tick style lives
 * here and every chart imports the same object. One tick style means every
 * chart on every dashboard labels its axes identically.
 */
export const CHART_TICK = {
  fontSize: 11,
  fill: "var(--color-cocoa-500)",
} as const;

/** The palette shared by categorical charts (stock, deliveries, …). */
export const CHART_COLORS = {
  cocoa: "var(--color-cocoa-700)",
  cocoaMuted: "var(--color-cocoa-300)",
  pod: "var(--color-pod-500)",
  amber: "var(--color-amber-500)",
} as const;
