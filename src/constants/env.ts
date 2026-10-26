/**
 * Tunable settings, read from Vite's environment (`.env`, `.env.local`, …).
 *
 * Every value has a fallback equal to the shipped default, so a missing or
 * malformed variable degrades to known-good behaviour instead of a `NaN` page
 * size or a zero-length cache. Vite inlines these at BUILD time: changing one
 * means rebuilding (or restarting `vite dev`), not just reloading the PWA.
 *
 * What does NOT belong here: identifiers (storage keys, i18n prefixes, element
 * ids, routes) and values that must agree with something outside this file —
 * the password policy and plan field limits mirror server validation, and the
 * mobile breakpoint mirrors Tailwind's `md`. Making those configurable would
 * only let them drift out of sync.
 */

/** Only `VITE_`-prefixed variables are exposed to client code by Vite. */
type EnvKey = `VITE_${string}`;

function readRaw(key: EnvKey): string | undefined {
  const raw = import.meta.env[key] as string | undefined;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

/** A whole number no smaller than `min`, or the fallback. */
function readInt(key: EnvKey, fallback: number, min = 0): number {
  const raw = readRaw(key);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  return Number.isInteger(value) && value >= min ? value : fallback;
}

/** A comma-separated list of whole numbers (each ≥ 1), or the fallback. */
function readIntList(key: EnvKey, fallback: number[]): number[] {
  const raw = readRaw(key);
  if (raw === undefined) return fallback;
  const values = raw.split(",").map((part) => Number(part.trim()));
  return values.length > 0 && values.every((v) => Number.isInteger(v) && v >= 1)
    ? values
    : fallback;
}

function readString(key: EnvKey, fallback: string): string {
  return readRaw(key) ?? fallback;
}

// ── App identity ────────────────────────────────────────────────────────────
export const APP_NAME = readString("VITE_APP_NAME", "Keuka");
export const APP_FULL_NAME = readString("VITE_APP_FULL_NAME", "Cocoa Management System");
export const APP_VERSION = readString("VITE_APP_VERSION", "0.1.0");
export const DEFAULT_CURRENCY = readString("VITE_DEFAULT_CURRENCY", "XAF");

// ── Base path ───────────────────────────────────────────────────────────────
/** Path the app is served under (Vite's `base`), without the trailing slash. */
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/+$/, "");
/** URL of a file in `public/`, prefixed with the base path. */
export const publicUrl = (path: string) => `${BASE_PATH}/${path.replace(/^\/+/, "")}`;
export const APP_ICON_URL = publicUrl("brand/keuka-app-icon.svg");

// ── Loading skeletons ───────────────────────────────────────────────────────
/** Minimum time a page shows its skeleton, even when data arrives sooner. */
export const SKELETON_DURATION_MS = readInt("VITE_SKELETON_DURATION_MS", 5000);

// ── Page sizes ──────────────────────────────────────────────────────────────
/** Rows per page on the main registers (purchases, buyers, users, …). */
export const PAGE_SIZE = readInt("VITE_PAGE_SIZE", 20, 1);
/** Choices offered by a register's "rows per page" picker. */
export const PAGE_SIZE_OPTIONS = readIntList("VITE_PAGE_SIZE_OPTIONS", [10, 20, 50]);
export const AUDIT_PAGE_SIZE = readInt("VITE_AUDIT_PAGE_SIZE", 10, 1);
/** One large page for dropdowns and lookups (partners, purchases to pay, users…). */
export const LOOKUP_PAGE_SIZE = readInt("VITE_LOOKUP_PAGE_SIZE", 100, 1);
export const WAREHOUSE_PAGE_SIZE = readInt("VITE_WAREHOUSE_PAGE_SIZE", 50, 1);
export const PLATFORM_SUBSCRIPTIONS_PAGE_SIZE = readInt("VITE_PLATFORM_SUBSCRIPTIONS_PAGE_SIZE", 50, 1);
export const PAYROLL_HISTORY_PAGE_SIZE = readInt("VITE_PAYROLL_HISTORY_PAGE_SIZE", 5, 1);
/** Payouts read to build one payslip. */
export const PAYSLIP_HISTORY_SIZE = readInt("VITE_PAYSLIP_HISTORY_SIZE", 200, 1);

// ── Dashboards ──────────────────────────────────────────────────────────────
export const ADMIN_DASHBOARD_PAGE_SIZE = readInt("VITE_ADMIN_DASHBOARD_PAGE_SIZE", 8, 1);
export const DASHBOARD_LIST_SIZE = readInt("VITE_DASHBOARD_LIST_SIZE", 50, 1);
export const DASHBOARD_MOVEMENT_SIZE = readInt("VITE_DASHBOARD_MOVEMENT_SIZE", 8, 1);
export const DASHBOARD_PRICE_HISTORY_SIZE = readInt("VITE_DASHBOARD_PRICE_HISTORY_SIZE", 14, 1);
export const DASHBOARD_EMPLOYEE_SIZE = readInt("VITE_DASHBOARD_EMPLOYEE_SIZE", 200, 1);
/** Rows per page inside the client dashboard's list cards. */
export const DASHBOARD_CARD_PAGE_SIZE = readInt("VITE_DASHBOARD_CARD_PAGE_SIZE", 4, 1);

// ── Query cache ─────────────────────────────────────────────────────────────
export const QUERY_STALE_MS = readInt("VITE_QUERY_STALE_MS", 30_000);
export const QUERY_GC_MS = readInt("VITE_QUERY_GC_MS", 5 * 60_000);
export const QUERY_RETRY_COUNT = readInt("VITE_QUERY_RETRY_COUNT", 2);
export const SESSION_STALE_MS = readInt("VITE_SESSION_STALE_MS", 5 * 60_000);
export const SUBSCRIPTION_STALE_MS = readInt("VITE_SUBSCRIPTION_STALE_MS", 60_000);
export const PLANS_STALE_MS = readInt("VITE_PLANS_STALE_MS", 15 * 60_000);
export const WAREHOUSES_STALE_MS = readInt("VITE_WAREHOUSES_STALE_MS", 5 * 60_000);
export const EXPENSE_CATEGORIES_STALE_MS = readInt("VITE_EXPENSE_CATEGORIES_STALE_MS", 10 * 60_000);
export const CURRENT_PRICE_STALE_MS = readInt("VITE_CURRENT_PRICE_STALE_MS", 60_000);

// ── Notifications & session ─────────────────────────────────────────────────
export const TOAST_SUCCESS_DURATION_MS = readInt("VITE_TOAST_SUCCESS_DURATION_MS", 3500);
export const TOAST_ERROR_DURATION_MS = readInt("VITE_TOAST_ERROR_DURATION_MS", 7000);
/** How early an access token is treated as expired, so none expires in flight. */
export const TOKEN_EXPIRY_SKEW_MS = readInt("VITE_TOKEN_EXPIRY_SKEW_MS", 30_000);
