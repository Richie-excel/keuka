import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";
import { withPageQuery, withQueryParam } from "@/api/paging";
import type {
  CreatePaymentRequest,
  CreatePurchaseRequest,
  PageParams,
  PageResponse,
  PaymentResponse,
  PurchaseDeliveryResponse,
  PurchaseResponse,
  UpdatePurchaseRequest,
} from "@/interfaces";

/**
 * Purchases and their payments (`/api/v1/purchases`).
 *
 * WHY the create payload carries no price: `CreatePurchaseRequest` has no
 * `unitPrice` and no `amount`. The server snapshots the effective cocoa price at
 * the moment of recording and derives the amount, then opens a payable. A client
 * that supplied its own price could record a purchase at any price it liked —
 * which is exactly why the server is the calculation boundary.
 *
 * Note `payments()` is NOT paged. The backend returns a plain `List` there
 * (`PurchaseController.payments`), unlike every other collection in the API.
 */
export const purchasesApi = {
  list(page?: PageParams): Promise<PageResponse<PurchaseResponse>> {
    return apiClient.get<PageResponse<PurchaseResponse>>(
      withPageQuery(ApiRoutes.purchases.all, page),
    );
  },

  byId(id: string): Promise<PurchaseResponse> {
    return apiClient.get<PurchaseResponse>(ApiRoutes.purchases.byId(id));
  },

  /**
   * `farmerId` XOR `buyerId` is required — the server answers `PARTNER_REQUIRED`
   * otherwise — and `netWeight <= grossWeight` or it answers
   * `INVALID_MEASUREMENT`.
   */
  create(
    input: CreatePurchaseRequest,
    idempotencyKey?: string,
  ): Promise<PurchaseResponse> {
    return apiClient.post<PurchaseResponse>(
      ApiRoutes.purchases.all,
      input,
      idempotencyKey,
    );
  },

  update(id: string, input: UpdatePurchaseRequest): Promise<PurchaseResponse> {
    return apiClient.patch<PurchaseResponse>(
      ApiRoutes.purchases.byId(id),
      input,
    );
  },

  /** A partner's delivery history (every weighing, farmer or buyer), newest first. */
  deliveries(partnerId: string, page?: PageParams): Promise<PageResponse<PurchaseDeliveryResponse>> {
    return apiClient.get<PageResponse<PurchaseDeliveryResponse>>(
      withPageQuery(withQueryParam(ApiRoutes.purchases.deliveries, "partnerId", partnerId), page),
    );
  },

  /** Payment history for one payable. A plain array, not a page. */
  payments(id: string): Promise<PaymentResponse[]> {
    return apiClient.get<PaymentResponse[]>(ApiRoutes.purchases.payments(id));
  },

  /**
   * Records a payment against the payable. Partial payments are allowed
   * (`PAYMENT_EXCEEDS_BALANCE` if it overshoots the remaining balance), and a
   * CASH payment with no open till is rejected with `CASH_SESSION_REQUIRED`.
   */
  pay(
    id: string,
    input: CreatePaymentRequest,
    idempotencyKey?: string,
  ): Promise<PaymentResponse> {
    return apiClient.post<PaymentResponse>(
      ApiRoutes.purchases.payments(id),
      input,
      idempotencyKey,
    );
  },

};
