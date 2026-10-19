import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";
import { withPageQuery } from "@/api/paging";
import type {
  CreateDeliveryRequest,
  DeliveryResponse,
  PageParams,
  PageResponse,
} from "@/interfaces";

/**
 * Truck loadings (`/api/v1/deliveries`).
 *
 * WHY the route is `/deliveries` and not `/truck-loadings`: the backend README's
 * API map documents `/api/v1/truck-loadings`, but `LogisticsController` is
 * annotated `@RequestMapping(ApiRoutes.TRUCK_LOADINGS)` and that constant is
 * `API + "/deliveries"`. The controller is the authority; the README is wrong.
 *
 * The domain rule that shapes the payload: **a loading is a trip fact, not fleet
 * master data.** There is no vehicle registry and no driver registry. The plate,
 * vehicle type, driver name, licence number and phone are all captured ON THE
 * TRIP, and the driver need not be an employee at all.
 *
 * `declaredGrossWeight`/`declaredNetWeight` are the company's own figures at
 * loading. A partner's later reception is a SECOND fact and never overwrites
 * these — which is why nothing here lets you amend a weight after the fact.
 */
export const deliveriesApi = {
  list(page?: PageParams): Promise<PageResponse<DeliveryResponse>> {
    return apiClient.get<PageResponse<DeliveryResponse>>(
      withPageQuery(ApiRoutes.truckLoadings.all, page),
    );
  },

  byId(id: string): Promise<DeliveryResponse> {
    return apiClient.get<DeliveryResponse>(ApiRoutes.truckLoadings.byId(id));
  },

  load(
    input: CreateDeliveryRequest,
    idempotencyKey?: string,
  ): Promise<DeliveryResponse> {
    return apiClient.post<DeliveryResponse>(
      ApiRoutes.truckLoadings.all,
      input,
      idempotencyKey,
    );
  },

  /**
   * Marks the trip delivered. The endpoint takes no body, so `{}` is sent purely
   * to keep the `Content-Type: application/json` header consistent with the rest
   * of the client.
   */
  markDelivered(id: string): Promise<DeliveryResponse> {
    return apiClient.post<DeliveryResponse>(
      ApiRoutes.truckLoadings.delivered(id),
      {},
    );
  },
};
