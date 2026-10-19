import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  plansApi,
  type CreatePlanRequest,
  type UpdatePlanRequest,
} from "@/api/plans";
import { qk } from "@/shared/hooks/query-keys";
import { PLANS_STALE_MS } from "@/constants";
import { useIdempotentMutation } from "@/shared/hooks/use-idempotent-mutation";
import type { PageParams } from "@/interfaces";
import type { PlanResponse } from "@/api/plans";

/**
 * Subscription plan catalogue queries and mutations.
 *
 * PROPOSED CONTRACT — see `docs/plans-api-contract.md`. Every call here 404s
 * until the controller exists; nothing in this file needs to change when it does.
 *
 * Stale time is deliberately LONGER than most registers. A price list changes
 * when an administrator decides to change it — a handful of times a year — and
 * the comparison table renders it for every visitor to the subscription screen.
 * Refetching it like a ledger would be noise. The mutations invalidate
 * explicitly, so the only cost of the longer window is on a second machine.
 */


/** The price list for visitors (no sign-in): the plans on offer. */
export function usePublicPlans() {
  return useQuery({
    queryKey: qk.plans.public(),
    queryFn: plansApi.publicCatalogue,
  });
}

export function usePlans(page?: PageParams, enabled = true) {
  return useQuery({
    queryKey: qk.plans.list(page),
    queryFn: () => plansApi.list(page),
    staleTime: PLANS_STALE_MS,
    enabled,
  });
}

/**
 * One plan, by its `code` rather than its id — `code` is what a subscription
 * stores and what the editor opens with, so that is the handle the UI has.
 */
export function usePlan(code: string | undefined, enabled = true) {
  return useQuery({
    queryKey: qk.plans.detail(code ?? ""),
    queryFn: () => plansApi.byCode(code as string),
    staleTime: PLANS_STALE_MS,
    enabled: enabled && Boolean(code),
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useIdempotentMutation<CreatePlanRequest, PlanResponse>({
    mutationFn: (input, idempotencyKey) =>
      plansApi.create(input, idempotencyKey),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: qk.plans.all }),
    meta: { success: "toast.plans.created" },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { code: string; input: UpdatePlanRequest }) =>
      plansApi.update(variables.code, variables.input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: qk.plans.all }),
    meta: { success: "toast.plans.updated" },
  });
}
