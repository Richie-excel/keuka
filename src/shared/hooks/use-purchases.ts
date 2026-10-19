import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "@/api/payments";
import { purchasesApi } from "@/api/purchases";
import { qk } from "@/shared/hooks/query-keys";
import { useIdempotentMutation } from "@/shared/hooks/use-idempotent-mutation";
import type {
  CreatePaymentRequest,
  CreatePurchaseRequest,
  PageParams,
  PaymentResponse,
  PurchaseResponse,
  UpdatePurchaseRequest,
} from "@/interfaces";

/**
 * Purchase and payment queries and mutations.
 *
 * Both writes go through the idempotent wrapper. Payments move money, and a
 * purchase opens a payable — a retried create against a server that missed the
 * response would double a farmer's payable. The backend honours
 * `Idempotency-Key` (it has an `IDEMPOTENT_REPLAY` error code for exactly this),
 * so sending one per user action is what makes the retry safe.
 *
 * Paying also invalidates the purchase list, because the payable's `remaining`
 * and the purchase's `status` change as a result.
 */
export function usePurchases(page?: PageParams, enabled = true) {
  return useQuery({
    queryKey: qk.purchases.list(page),
    queryFn: () => purchasesApi.list(page),
    enabled,
  });
}

export function usePurchase(id: string | undefined) {
  return useQuery({
    queryKey: qk.purchases.detail(id ?? ""),
    queryFn: () => purchasesApi.byId(id as string),
    enabled: Boolean(id),
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useIdempotentMutation<CreatePurchaseRequest, PurchaseResponse>({
    mutationFn: (input, idempotencyKey) =>
      purchasesApi.create(input, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.purchases.all });
      // A buyer's purchase repays their prefinance and records offset payments;
      // every purchase also receives stock.
      queryClient.invalidateQueries({ queryKey: qk.prefinances.all });
      queryClient.invalidateQueries({ queryKey: qk.payments.all });
      queryClient.invalidateQueries({ queryKey: qk.inventory.all });
      // "Paid now" in cash comes out of the till.
      queryClient.invalidateQueries({ queryKey: qk.cashSessions.all });
    },
    // A purchase is money owed to a farmer from the moment it is recorded, and
    // the payable it opens is not visible on the entry form itself.
    meta: { success: "toast.purchases.recorded" },
  });
}

export function useUpdatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string; input: UpdatePurchaseRequest }) =>
      purchasesApi.update(variables.id, variables.input),
    onSuccess: (_purchase, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.purchases.all });
      queryClient.invalidateQueries({
        queryKey: qk.purchases.detail(variables.id),
      });
    },
    meta: { success: "toast.purchases.updated" },
  });
}

/** Payment history for one purchase. A plain array, not a page. */
/** A partner's delivery history (every weighing), newest first. */
export function usePartnerDeliveries(partnerId: string | undefined, page?: PageParams, enabled = true) {
  return useQuery({
    queryKey: qk.purchases.deliveries({ partnerId, ...page }),
    queryFn: () => purchasesApi.deliveries(partnerId as string, page),
    enabled: enabled && Boolean(partnerId),
  });
}

export function usePurchasePayments(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: qk.purchases.payments(id ?? ""),
    queryFn: () => purchasesApi.payments(id as string),
    enabled: enabled && Boolean(id),
  });
}

export function usePayments(page?: PageParams) {
  return useQuery({
    queryKey: qk.payments.list(page),
    queryFn: () => paymentsApi.list(page),
  });
}

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: qk.payments.detail(id ?? ""),
    queryFn: () => paymentsApi.byId(id as string),
    enabled: Boolean(id),
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => paymentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.payments.all });
      queryClient.invalidateQueries({ queryKey: qk.purchases.all });
      queryClient.invalidateQueries({ queryKey: qk.cashSessions.all });
      // What the company owes a buyer counts their unpaid purchases.
      queryClient.invalidateQueries({ queryKey: qk.prefinances.all });
    },
    meta: { success: "toast.payments.voided" },
  });
}

export function usePayPurchase() {
  const queryClient = useQueryClient();

  return useIdempotentMutation<
    { id: string; input: CreatePaymentRequest },
    PaymentResponse
  >({
    mutationFn: ({ id, input }, idempotencyKey) =>
      purchasesApi.pay(id, input, idempotencyKey),
    onSuccess: (_result, variables) => {
      // The purchase's payable balance changed, so its detail AND its payment
      // list are both stale, as is the register that shows payable status.
      queryClient.invalidateQueries({ queryKey: qk.purchases.all });
      queryClient.invalidateQueries({
        queryKey: qk.purchases.payments(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: qk.payments.all });
      // A cash payment moves the till, so the cashier's float is stale too.
      queryClient.invalidateQueries({ queryKey: qk.cashSessions.all });
      // What the company owes a buyer counts their unpaid purchases.
      queryClient.invalidateQueries({ queryKey: qk.prefinances.all });
    },
    meta: { success: "toast.payments.recorded" },
  });
}
