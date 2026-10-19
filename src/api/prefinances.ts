import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";
import { withPageQuery, withQueryParam } from "@/api/paging";
import type {
  CreateDisbursementRequest,
  CreatePrefinanceRequest,
  PageParams,
  PageResponse,
  PrefinanceResponse,
} from "@/interfaces";

/** `prefinance.dto.PrefinanceSummaryResponse`: totals over every buyer. */
export interface PrefinanceSummaryResponse {
  /** Cash handed to buyers that their cocoa has not yet repaid. */
  buyersOwe: number;
  buyersInDebt: number;
  /** Cocoa buyers brought that the company has not yet paid for. */
  companyOwesBuyers: number;
}

/**
 * `prefinance.dto.BuyerBalanceResponse`: one buyer's balance over ALL their
 * advances. What was not repaid in an earlier cash session carries over.
 */
export interface BuyerBalanceResponse {
  buyerId: string;
  owes: number;
  owedToBuyer: number;
  openAdvances: number;
}

/**
 * Buyer prefinancing (`/api/v1/partners/prefinances`).
 *
 * The route lives UNDER `/partners` because an advance is a fact about a
 * partner. The backend README documents it as `/api/v1/prefinances`;
 * `ApiRoutes.PREFINANCE = PARTNERS + "/prefinances"` and the controller is
 * annotated with that constant, so the README is wrong.
 *
 * Two rules drive the shape of this module:
 *
 * 1. **Only a trusted BUYER can be advanced.** The server answers
 *    `BUYER_NOT_TRUSTED`; the client should filter the picker so the user never
 *    hits it, but the server is the real gate.
 * 2. **The unit price is frozen at creation.** `historicalUnitPrice` is copied
 *    from the cocoa price in force when the advance is made, and settlement value
 *    is delivered quantity × THAT price. Today's price is irrelevant to an old
 *    advance, which is why `deliver` takes only a quantity.
 *
 * Disbursing and delivering are separate calls against the same advance: money
 * can go out in instalments, and cocoa comes back in loads.
 */
export const prefinancesApi = {
  list(
    page?: PageParams,
    buyerId?: string,
  ): Promise<PageResponse<PrefinanceResponse>> {
    return apiClient.get<PageResponse<PrefinanceResponse>>(
      withPageQuery(
        withQueryParam(ApiRoutes.prefinances.all, "buyerId", buyerId),
        page,
      ),
    );
  },

  summary(): Promise<PrefinanceSummaryResponse> {
    return apiClient.get<PrefinanceSummaryResponse>(ApiRoutes.prefinances.summary);
  },

  buyerBalance(buyerId: string): Promise<BuyerBalanceResponse> {
    return apiClient.get<BuyerBalanceResponse>(ApiRoutes.prefinances.buyerBalance(buyerId));
  },

  byId(id: string): Promise<PrefinanceResponse> {
    return apiClient.get<PrefinanceResponse>(ApiRoutes.prefinances.byId(id));
  },

  create(
    input: CreatePrefinanceRequest,
    idempotencyKey?: string,
  ): Promise<PrefinanceResponse> {
    return apiClient.post<PrefinanceResponse>(
      ApiRoutes.prefinances.all,
      input,
      idempotencyKey,
    );
  },

  /** Hands cash to the buyer against the advance. Needs an open till if CASH. */
  disburse(
    id: string,
    input: CreateDisbursementRequest,
    idempotencyKey?: string,
  ): Promise<PrefinanceResponse> {
    return apiClient.post<PrefinanceResponse>(
      ApiRoutes.prefinances.disbursements(id),
      input,
      idempotencyKey,
    );
  },

  // There is no "record delivery" call: cocoa a buyer brings is recorded as a
  // purchase (purchasesApi.create with buyerId), and the server uses it to
  // repay the buyer's open prefinances.
};
