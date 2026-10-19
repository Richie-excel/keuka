import { MutationCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";
import { notifyErrorFrom, notifySuccess } from "@/lib/toast";
import { QUERY_GC_MS, QUERY_RETRY_COUNT, QUERY_STALE_MS } from "@/constants";

/**
 * The app's query and mutation defaults, and the single place operation outcomes
 * are reported to the user.
 *
 * WHY THE GLOBAL TOAST LIVES HERE — a toast is not a page, and there is no screen
 * to put it on. Every write in this app (a purchase, a payment, a till closure)
 * goes through a mutation, and every mutation passes through this cache. Hooking
 * it here reports an operation wherever it was triggered from and means a new
 * screen cannot forget to report its own result.
 *
 * WHY MUTATIONS ONLY, NOT QUERIES — a failed write means the user's action did
 * not happen and they have to know. A failed read usually corrects itself: the
 * query is retried twice, refetched on window focus, and the screen already has
 * empty/error states that say so in place. Toasting failed queries would turn a
 * flaky office LAN into a stream of messages about lists nobody asked to
 * refresh — the noise that teaches people to stop reading toasts.
 *
 * WHY FAILURES ARE ON BY DEFAULT BUT SUCCESSES ARE OPT-IN (`meta.success`) — a
 * failure nobody notices is how a cashier walks away believing money was
 * recorded. A success nobody notices costs nothing, because the save usually
 * confirms itself: a dialog closes, a row appears, a balance changes. So failure
 * speaks unless told to stay quiet, and success speaks only where a mutation
 * declares its result is not otherwise visible.
 *
 * WHY FAILURES ARE DEDUPED BY MESSAGE — see `lib/toast.ts`. A server outage
 * fails everything at once, and one message about a dead server is information
 * while six identical ones are wallpaper.
 */
export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      // Narrowed rather than cast: `meta` is caller-supplied data, and this is
      // correct whether or not a given mutation was written through the typed
      // helper in `query-meta.ts`.
      const successKey = mutation.meta?.success;
      if (typeof successKey === "string") notifySuccess(successKey);
    },
    onError: (error, _variables, _context, mutation) => {
      // `silent` is set by mutations whose call site already shows the failure in
      // place (a login form, an inline field error), so it is not said twice.
      if (mutation.meta?.silent === true) return;
      notifyErrorFrom(error);
    },
  }),

  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_MS,
      gcTime: QUERY_GC_MS,
      // A 4xx will not change on retry. In particular a record of another
      // enterprise answers 404 (the server never confirms it exists), and
      // retrying that only delays the "not found" screen.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
        failureCount < QUERY_RETRY_COUNT,
      refetchOnWindowFocus: true,
      throwOnError: (error) =>
        error instanceof ApiError && error.status === 403,
    },
    mutations: {
      retry: 1,
    },
  },
});
