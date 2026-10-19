import i18n from "i18next";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api-error-message";
import { TOAST_ERROR_DURATION_MS, TOAST_SUCCESS_DURATION_MS } from "@/constants";

/**
 * The app's only door to the toast system.
 *
 * WHY a wrapper instead of importing `sonner` at each call site: a toast is a
 * *decision* — which operations are worth interrupting someone for, how long the
 * message stays, and whether it may repeat are policy, not presentation. Spread
 * that across forty call sites and the app ends up with toast behaviour nobody
 * can describe. Here the policy lives in one file.
 *
 * WHY it can translate outside React: i18next's default export *is* the
 * configured singleton — `i18n.ts` calls `.init()` on it — so importing it gives
 * the same instance every component sees. That matters because the toast layer
 * runs from the mutation cache, which has no component to call `useTranslation`
 * from.
 */

/**
 * How long a message lingers.
 *
 * Success is a receipt: it has done its job once it is read, and the row the
 * user just created is the real confirmation. Errors get longer because they
 * carry a decision — "this did not save, do something about it" — and a message
 * that disappears before it is read is worse than no message at all.
 */
const SUCCESS_DURATION_MS = TOAST_SUCCESS_DURATION_MS;
const ERROR_DURATION_MS = TOAST_ERROR_DURATION_MS;

/**
 * Collapse repeats.
 *
 * WHY the message IS the identity: an office whose server has gone down fails
 * every request it is asked to make. Keyed per mutation, five actions would stack
 * five identical "the server could not be reached" toasts and bury the screen
 * under them — the exact overwhelming the app is trying to avoid. Keyed by text,
 * the second identical failure replaces the first, so however many things break,
 * the user sees one message per distinct problem. Two genuinely different
 * failures still produce two toasts, because their text differs.
 */
const dedupeId = (kind: string, message: string) =>
  `${kind}:${message}`;

function translate(key: string, params?: Record<string, unknown>): string {
  return i18n.t(key, params) as string;
}

/** A completed operation. `key` is a translation key, e.g. `toast.purchases.recorded`. */
export function notifySuccess(key: string): void {
  const message = translate(key);
  toast.success(message, {
    id: dedupeId("success", message),
    duration: SUCCESS_DURATION_MS,
  });
}

/**
 * Something the user should know that is neither a failure nor a receipt —
 * "a price is already in force today", "this list is showing cached data".
 */
export function notifyInfo(key: string): void {
  const message = translate(key);
  toast.info(message, {
    id: dedupeId("info", message),
    duration: SUCCESS_DURATION_MS,
  });
}

/**
 * A failed operation.
 *
 * Takes the finished message rather than a key, because the caller may be
 * showing something that is not a translation at all — a validation detail from
 * the server, or a line composed from a template. Failure messages produced
 * *from* an error object go through `notifyErrorFrom` below, which is where the
 * translating happens.
 */
export function notifyError(message: string): void {
  toast.error(message, {
    id: dedupeId("error", message),
    duration: ERROR_DURATION_MS,
  });
}

/**
 * Turns any thrown value into something worth showing.
 *
 * WHY it delegates to `apiErrorMessage` rather than reading `error.message`: the
 * backend writes its failures in English, and this app runs in French as often
 * as English. `apiErrorMessage` looks the failure's code up in `apiErrors.codes`
 * and answers in the user's language, falling back to the server's own sentence
 * only for a rule it has not been taught yet. That also keeps the decision —
 * which failures are translated, and how — in one place instead of in every
 * caller.
 *
 * Anything that is not a described API failure (a bug, a rejected promise) gets
 * the generic translated line rather than a stack trace.
 */
export function notifyErrorFrom(error: unknown): void {
  notifyError(apiErrorMessage(error));
}
