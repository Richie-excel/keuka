import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";
import { withPageQuery } from "@/api/paging";
import type { PageParams, PageResponse } from "@/interfaces";

/**
 * Warehouses (`/api/v1/warehouses`).
 *
 * A warehouse is the scoping unit for a large part of the model: `RoleScope`
 * includes `WAREHOUSE`, cash sessions belong to a till at a warehouse, and
 * `warehouseId` is an optional filter on inventory reads.
 *
 * ---------------------------------------------------------------------------
 * Mirrors `WarehouseResponse`, `CreateWarehouseRequest`, and the frontend's
 * narrowly scoped `UpdateWarehouseRequest`.
 */
export interface WarehouseSummary {
  id: string;
  code: string;
  name: string;
  location?: string | null;
  createdBy?: string | null;
  active: boolean;
  createdAt?: string;
}

export interface WarehouseInput {
  code: string;
  name: string;
  location?: string;
  /**
   * Which enterprise the warehouse belongs to. Required when the platform operator
   * creates one; ignored for everyone else, who always create in their own company.
   */
  enterpriseId?: string;
}

export interface WarehouseUpdateInput {
  name: string;
  location?: string;
}

export const warehousesApi = {
  list(page?: PageParams): Promise<PageResponse<WarehouseSummary>> {
    return apiClient.get<PageResponse<WarehouseSummary>>(
      withPageQuery(ApiRoutes.warehouses.all, page),
    );
  },

  create(
    input: WarehouseInput,
    idempotencyKey?: string,
  ): Promise<WarehouseSummary> {
    return apiClient.post<WarehouseSummary>(
      ApiRoutes.warehouses.all,
      input,
      idempotencyKey,
    );
  },

  update(id: string, input: WarehouseUpdateInput): Promise<WarehouseSummary> {
    return apiClient.patch<WarehouseSummary>(ApiRoutes.warehouses.byId(id), input);
  },
};
