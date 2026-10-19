import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  warehousesApi,
  type WarehouseInput,
  type WarehouseUpdateInput,
} from "@/api/warehouses";
import { qk } from "@/shared/hooks/query-keys";
import { WAREHOUSES_STALE_MS } from "@/constants";
import { useIdempotentMutation } from "@/shared/hooks/use-idempotent-mutation";
import type { PageParams } from "@/interfaces";
import type { WarehouseSummary } from "@/api/warehouses";

/**
 * Warehouse queries and the create mutation.
 *
 * Warehouses are opened rarely, so a modest staleTime is enough — but not an
 * indefinite one, because `warehouseId` filters inventory reads and a list that
 * never refetched could hide a warehouse someone just added on another machine.
 *
 * NOTE: `WarehouseSummary` and `WarehouseInput` currently live in
 * `@/api/warehouses` rather than `@/interfaces` because the backend DTOs were not
 * read during the audit and those two types are explicitly provisional. When the
 * real DTOs are read, move the types to `@/interfaces` and update this import.
 */

export function useWarehouses(page?: PageParams, enabled = true) {
  return useQuery({
    queryKey: qk.warehouses.list(page),
    queryFn: () => warehousesApi.list(page),
    staleTime: WAREHOUSES_STALE_MS,
    enabled,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();

  return useIdempotentMutation<WarehouseInput, WarehouseSummary>({
    mutationFn: (input, idempotencyKey) =>
      warehousesApi.create(input, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.warehouses.all });
      queryClient.invalidateQueries({ queryKey: qk.enterprises.all });
    },
    meta: { success: "toast.warehouses.created" },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string; input: WarehouseUpdateInput }) =>
      warehousesApi.update(variables.id, variables.input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.warehouses.all });
      // The platform operator's per-enterprise lists live under the enterprises key.
      queryClient.invalidateQueries({ queryKey: qk.enterprises.all });
    },
    meta: { success: "toast.warehouses.updated" },
  });
}
