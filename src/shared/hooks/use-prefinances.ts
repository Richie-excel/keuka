import { useQuery, useQueryClient } from "@tanstack/react-query";
import { prefinancesApi } from "@/api/prefinances";
import { qk } from "@/shared/hooks/query-keys";
import { useIdempotentMutation } from "@/shared/hooks/use-idempotent-mutation";
import type {
  CreateDisbursementRequest,
  CreatePrefinanceRequest,
  PageParams,
  PrefinanceResponse,
} from "@/interfaces";

/**
 * Prefinance queries and mutations.
 *
 * Every mutation here also invalidates the PARTNERS cache, not just prefinances:
 * a prefinance moves money against a buyer, so the buyer screens and any totals
 * derived from them are stale the moment an advance is created, disbursed or
 * settled. Forgetting that cross-invalidation is how a buyer screen ends up
 * quietly showing the wrong figure.
 *
 * All three writes are idempotent-wrapped: an advance is cash out of the till,
 * and a replayed delivery would inflate what a buyer has repaid.
 */
export function usePrefinances(page?: PageParams, buyerId?: string, enabled = true) {
  return useQuery({
    queryKey: qk.prefinances.list({ ...page, buyerId }),
    queryFn: () => prefinancesApi.list(page, buyerId),
    enabled,
  });
}

export function usePrefinance(id: string | undefined) {
  return useQuery({
    queryKey: qk.prefinances.detail(id ?? ""),
    queryFn: () => prefinancesApi.byId(id as string),
    enabled: Boolean(id),
  });
}

/** What buyers owe and are owed, over every advance: for the dashboard. */
export function usePrefinanceSummary(enabled = true) {
  return useQuery({
    queryKey: qk.prefinances.summary(),
    queryFn: prefinancesApi.summary,
    enabled,
  });
}

/** One buyer's running balance, carried over from earlier cash sessions. */
export function useBuyerBalance(buyerId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: qk.prefinances.buyerBalance(buyerId ?? ""),
    queryFn: () => prefinancesApi.buyerBalance(buyerId as string),
    enabled: Boolean(buyerId) && enabled,
  });
}

function useInvalidatePrefinanceWorld() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: qk.prefinances.all });
    queryClient.invalidateQueries({ queryKey: qk.partners.all });
    // Advances and deliveries move cash, so the till is affected too.
    queryClient.invalidateQueries({ queryKey: qk.cashSessions.all });
  };
}

export function useCreatePrefinance() {
  const invalidate = useInvalidatePrefinanceWorld();

  return useIdempotentMutation<CreatePrefinanceRequest, PrefinanceResponse>({
    mutationFn: (input, idempotencyKey) =>
      prefinancesApi.create(input, idempotencyKey),
    onSuccess: invalidate,
    // An advance is cash leaving the till against future cocoa, and the buyer's
    // outstanding balance is what the next settlement reads.
    meta: { success: "toast.prefinances.created" },
  });
}

export function useDisbursePrefinance() {
  const invalidate = useInvalidatePrefinanceWorld();

  return useIdempotentMutation<
    { id: string; input: CreateDisbursementRequest },
    PrefinanceResponse
  >({
    mutationFn: ({ id, input }, idempotencyKey) =>
      prefinancesApi.disburse(id, input, idempotencyKey),
    onSuccess: invalidate,
    meta: { success: "toast.prefinances.disbursed" },
  });
}

