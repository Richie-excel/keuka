import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cocoaPricesApi } from "@/api/cocoa-prices";
import { qk } from "@/shared/hooks/query-keys";
import { CURRENT_PRICE_STALE_MS } from "@/constants";
import { useIdempotentMutation } from "@/shared/hooks/use-idempotent-mutation";
import type {
  CocoaPriceResponse,
  CreateCocoaPriceRequest,
  PageParams,
} from "@/interfaces";

export function useCocoaPrices(page?: PageParams) {
  return useQuery({
    queryKey: qk.cocoaPrices.list(page),
    queryFn: () => cocoaPricesApi.list(page),
  });
}

export function useCurrentCocoaPrice(enabled = true) {
  return useQuery({
    queryKey: qk.cocoaPrices.current(),
    queryFn: cocoaPricesApi.current,
    staleTime: CURRENT_PRICE_STALE_MS,
    enabled,
  });
}

export function usePublishCocoaPrice() {
  const queryClient = useQueryClient();

  return useIdempotentMutation<CreateCocoaPriceRequest, CocoaPriceResponse>({
    mutationFn: (input, idempotencyKey) =>
      cocoaPricesApi.publish(input, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.cocoaPrices.all });
      queryClient.invalidateQueries({ queryKey: qk.purchases.all });
    },
    meta: { success: "toast.prices.published", silent: true },
  });
}
