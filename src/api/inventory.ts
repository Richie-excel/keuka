import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";
import { withPageQuery, withQueryParam } from "@/api/paging";
import type {
  AdjustStockRequest,
  PageParams,
  PageResponse,
  StockBalanceResponse,
  StockMovementResponse,
} from "@/interfaces";

/**
 * Inventory (`/api/v1/inventory`).
 *
 * WHAT THIS MODULE REPLACES: the frontend used to model stock as batches with
 * AVAILABLE / RESERVED / LOADED statuses. The backend has no such thing — and the
 * backend README wrongly lists inventory as "not built yet", while
 * `InventoryController` very much exists. Inventory here is:
 *
 * - **a balance**: on-hand kg for a warehouse (`balance`), and
 * - **a movement ledger**: RECEIPT / ISSUE / ADJUSTMENT rows (`movements`).
 *
 * Stock is therefore derived from movements, not edited directly. The only write
 * is an adjustment — a manual recount, a loss, or a sample — where `inbound`
 * gives the direction. Quantities are always positive; a loss is
 * `{ inbound: false }`, never a negative number.
 */
export const inventoryApi = {
  /**
   * On-hand kg. NOT paged — the endpoint returns a single `StockBalanceResponse`
   * for one warehouse (or the caller's default warehouse when none is given).
   */
  balance(warehouseId?: string): Promise<StockBalanceResponse> {
    return apiClient.get<StockBalanceResponse>(
      withQueryParam(ApiRoutes.inventory.balance, "warehouseId", warehouseId),
    );
  },

  movements(
    page?: PageParams,
    warehouseId?: string,
  ): Promise<PageResponse<StockMovementResponse>> {
    return apiClient.get<PageResponse<StockMovementResponse>>(
      withPageQuery(
        withQueryParam(ApiRoutes.inventory.movements, "warehouseId", warehouseId),
        page,
      ),
    );
  },

  adjust(
    input: AdjustStockRequest,
    idempotencyKey?: string,
  ): Promise<StockBalanceResponse> {
    return apiClient.post<StockBalanceResponse>(
      ApiRoutes.inventory.adjustments,
      input,
      idempotencyKey,
    );
  },
};
