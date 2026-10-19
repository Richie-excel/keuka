import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cashSessionsApi } from "@/api/cash-sessions";
import { qk } from "@/shared/hooks/query-keys";
import { useIdempotentMutation } from "@/shared/hooks/use-idempotent-mutation";
import type {
  AddCashProvisionRequest,
  CashSessionResponse,
  CloseCashSessionRequest,
  OpenCashSessionRequest,
  PageParams,
} from "@/interfaces";

/**
 * Cashier till queries and mutations.
 *
 * All three writes are idempotent-wrapped. Two of them literally move cash
 * (opening a float, topping it up), and a replayed close would overwrite a
 * variance an auditor needs to see.
 *
 * Every mutation invalidates the whole `cashSessions` scope, because the derived
 * `availableBalance` changes on any of them and several screens read it.
 */
export function useCashSessions(page?: PageParams, enabled = true) {
  return useQuery({
    queryKey: qk.cashSessions.list(page),
    queryFn: () => cashSessionsApi.list(page),
    enabled,
  });
}

export function useCashSession(id: string | undefined) {
  return useQuery({
    queryKey: qk.cashSessions.detail(id ?? ""),
    queryFn: () => cashSessionsApi.byId(id as string),
    enabled: Boolean(id),
  });
}

/**
 * The caller's OWN open till, if any (`GET /cash-sessions/current`).
 *
 * Kept as its own hook because "is there an open session?" gates most of the
 * cashier UI — pay buttons, expense entry, salary payouts. It used to scan the
 * first page of ALL sessions, which could pick another cashier's till.
 */
export function useOpenCashSession(enabled = true) {
  const query = useQuery({
    queryKey: qk.cashSessions.open(),
    queryFn: () => cashSessionsApi.current(),
    enabled,
  });

  return {
    ...query,
    openSession: query.data ?? undefined,
  };
}

export function useOpenTill() {
  const queryClient = useQueryClient();

  return useIdempotentMutation<OpenCashSessionRequest, CashSessionResponse>({
    mutationFn: (input, idempotencyKey) =>
      cashSessionsApi.open(input, idempotencyKey),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: qk.cashSessions.all }),
    // The cashier needs a dated receipt for a float they just counted out.
    meta: { success: "toast.cashSessions.opened" },
  });
}

export function useAddCashProvision() {
  const queryClient = useQueryClient();

  return useIdempotentMutation<
    { id: string; input: AddCashProvisionRequest },
    CashSessionResponse
  >({
    mutationFn: ({ id, input }, idempotencyKey) =>
      cashSessionsApi.provision(id, input, idempotencyKey),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: qk.cashSessions.all }),
    meta: { success: "toast.cashSessions.provisioned" },
  });
}

export function useCloseCashSession() {
  const queryClient = useQueryClient();

  return useIdempotentMutation<
    { id: string; input: CloseCashSessionRequest },
    CashSessionResponse
  >({
    mutationFn: ({ id, input }, idempotencyKey) =>
      cashSessionsApi.close(id, input, idempotencyKey),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: qk.cashSessions.all }),
    // Closing is irreversible from here and produces a variance — worth an
    // explicit confirmation rather than the form simply disappearing.
    meta: { success: "toast.cashSessions.closed" },
  });
}
