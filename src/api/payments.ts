import { ApiRoutes } from "@/api/routes";
import { withPageQuery } from "@/api/paging";
import { apiClient } from "@/lib/api-client";
import type { PageParams, PageResponse, PaymentResponse } from "@/interfaces";

/**
 * Payment register and history management.
 *
 * Payment deletion is a backend soft-delete/void operation: financial records
 * and their audit history must remain available.
 */
export const paymentsApi = {
  list(page?: PageParams): Promise<PageResponse<PaymentResponse>> {
    return apiClient.get<PageResponse<PaymentResponse>>(
      withPageQuery(ApiRoutes.payments.all, page),
    );
  },

  byId(id: string): Promise<PaymentResponse> {
    return apiClient.get<PaymentResponse>(ApiRoutes.payments.byId(id));
  },

  remove(id: string): Promise<void> {
    return apiClient.delete<void>(ApiRoutes.payments.byId(id));
  },
};
