import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deliveriesApi } from "@/api/deliveries";
import { qk } from "@/shared/hooks/query-keys";
import { useIdempotentMutation } from "@/shared/hooks/use-idempotent-mutation";
import type {
  CreateDeliveryRequest,
  DeliveryResponse,
  PageParams,
} from "@/interfaces";

/**
 * Truck loading queries and mutations.
 *
 * `load` is idempotent-wrapped: a retried loading would create a second trip for
 * the same physical movement, and since these are the company's declared weights
 * against a commercial partner, a duplicate is a reconciliation problem later.
 *
 * `markDelivered` is a plain mutation — it sets an absolute state, so replaying
 * it changes nothing.
 */
export function useDeliveries(page?: PageParams) {
  return useQuery({
    queryKey: qk.deliveries.list(page),
    queryFn: () => deliveriesApi.list(page),
  });
}

export function useDelivery(id: string | undefined) {
  return useQuery({
    queryKey: qk.deliveries.detail(id ?? ""),
    queryFn: () => deliveriesApi.byId(id as string),
    enabled: Boolean(id),
  });
}

export function useLoadTruck() {
  const queryClient = useQueryClient();

  return useIdempotentMutation<CreateDeliveryRequest, DeliveryResponse>({
    mutationFn: (input, idempotencyKey) =>
      deliveriesApi.load(input, idempotencyKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.deliveries.all }),
    // The declared weights are what the partner will be reconciled against, so
    // the loading clerk needs confirmation the trip was recorded.
    meta: { success: "toast.deliveries.loaded" },
  });
}

export function useMarkDelivered() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deliveriesApi.markDelivered(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.deliveries.all }),
    meta: { success: "toast.deliveries.delivered" },
  });
}
