import { useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/api/inventory";
import { qk } from "@/shared/hooks/query-keys";
import { useIdempotentMutation } from "@/shared/hooks/use-idempotent-mutation";
import type {
  AdjustStockRequest,
  PageParams,
  StockBalanceResponse,
} from "@/interfaces";

/**
 * Inventory queries and the adjustment mutation.
 *
 * The balance is NOT paged — it is one number per warehouse — so `useStockBalance`
 * takes a warehouse id rather than page params. The movements ledger IS paged.
 *
 * An adjustment is idempotent-wrapped because it moves physical stock: a replayed
 * recount would apply the same correction twice and leave the ledger disagreeing
 * with the warehouse.
 *
 * Adjusting invalidates the warehouse list too, because a balance is derived from
 * movements and the warehouses screen summarises them.
 */
export function useStockBalance(warehouseId?: string, enabled = true) {
  return useQuery({
    queryKey: qk.inventory.balance(warehouseId),
    queryFn: () => inventoryApi.balance(warehouseId),
    enabled,
  });
}

export function useStockMovements(page?: PageParams, warehouseId?: string) {
  return useQuery({
    queryKey: qk.inventory.movements({ ...page, warehouseId }),
    queryFn: () => inventoryApi.movements(page, warehouseId),
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useIdempotentMutation<AdjustStockRequest, StockBalanceResponse>({
    mutationFn: (input, idempotencyKey) =>
      inventoryApi.adjust(input, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.inventory.all });
      queryClient.invalidateQueries({ queryKey: qk.warehouses.all });
    },
    // A recount changes the number a warehouse is judged on, so it is worth a
    // receipt of its own rather than relying on the balance card to move.
    meta: { success: "toast.inventory.adjusted" },
  });
}
