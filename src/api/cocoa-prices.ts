import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";
import { withPageQuery } from "@/api/paging";
import type {
  CocoaPriceResponse,
  CreateCocoaPriceRequest,
  PageParams,
  PageResponse,
} from "@/interfaces";

/**
 * Cocoa pricing (`/api/v1/cocoa-prices`).
 *
 * The price is an effective-dated series, not a single editable value.
 * Publishing a new price CLOSES the previous open interval, so at most one row is
 * `ACTIVE` at any moment and the history is an audit trail.
 *
 * WHY that matters to the rest of the app: a purchase or a prefinance SNAPSHOTS
 * the price in force when it is recorded. Republishing a price later never
 * rewrites what a past purchase cost — which is why nothing here offers an
 * `update` or `delete`. Changing the price must always mean appending a new one.
 */
export const cocoaPricesApi = {
  list(page?: PageParams): Promise<PageResponse<CocoaPriceResponse>> {
    return apiClient.get<PageResponse<CocoaPriceResponse>>(
      withPageQuery(ApiRoutes.cocoaPrices.all, page),
    );
  },

  /** The price in force right now — what a new purchase will be valued at. */
  current(): Promise<CocoaPriceResponse> {
    return apiClient.get<CocoaPriceResponse>(ApiRoutes.cocoaPrices.current);
  },

  publish(
    input: CreateCocoaPriceRequest,
    idempotencyKey?: string,
  ): Promise<CocoaPriceResponse> {
    return apiClient.post<CocoaPriceResponse>(
      ApiRoutes.cocoaPrices.all,
      input,
      idempotencyKey,
    );
  },
};
