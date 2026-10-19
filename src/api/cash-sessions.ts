import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";
import { withPageQuery } from "@/api/paging";
import type {
  AddCashProvisionRequest,
  CashSessionResponse,
  CloseCashSessionRequest,
  OpenCashSessionRequest,
  PageParams,
  PageResponse,
} from "@/interfaces";

/**
 * Cashier tills (`/api/v1/cash-sessions`).
 *
 * The rules this module exists to respect — all enforced server-side, listed
 * here because the UI has to anticipate them or the cashier hits walls:
 *
 * - **One OPEN session per user.** Opening a second is `OPEN_CASH_SESSION_EXISTS`
 *   (409). The UI should therefore offer "open" only when there is no open till.
 * - **Cash operations need an open till.** A CASH payment, expense, disbursement
 *   or salary payout with no session is `CASH_SESSION_REQUIRED` (422).
 * - **The float can be topped up any number of times.** That is what
 *   `provision` is for; it is not a correction mechanism.
 * - **availableBalance = opening + provisions − cash outs.** The SERVER computes
 *   it and returns it on every response. The client must display that number
 *   rather than add up transactions itself, because only the server sees every
 *   movement across every module.
 * - **Closing records, it does not fix.** `expectedClosing` vs `declaredClosing`
 *   yields a `variance` that is stored as-is; nothing is auto-corrected, because a
 *   discrepancy is information the boss needs, not an error to paper over.
 */
export const cashSessionsApi = {
  list(page?: PageParams): Promise<PageResponse<CashSessionResponse>> {
    return apiClient.get<PageResponse<CashSessionResponse>>(
      withPageQuery(ApiRoutes.cashSessions.all, page),
    );
  },

  /**
   * The caller's OWN open till, or `undefined` (204) when they have none. Use
   * this, not the list: the list holds every till in the company.
   */
  async current(): Promise<CashSessionResponse | null> {
    return (await apiClient.get<CashSessionResponse | undefined>(ApiRoutes.cashSessions.current)) ?? null;
  },

  byId(id: string): Promise<CashSessionResponse> {
    return apiClient.get<CashSessionResponse>(ApiRoutes.cashSessions.byId(id));
  },

  open(
    input: OpenCashSessionRequest,
    idempotencyKey?: string,
  ): Promise<CashSessionResponse> {
    return apiClient.post<CashSessionResponse>(
      ApiRoutes.cashSessions.all,
      input,
      idempotencyKey,
    );
  },

  provision(
    id: string,
    input: AddCashProvisionRequest,
    idempotencyKey?: string,
  ): Promise<CashSessionResponse> {
    return apiClient.post<CashSessionResponse>(
      ApiRoutes.cashSessions.provisions(id),
      input,
      idempotencyKey,
    );
  },

  close(
    id: string,
    input: CloseCashSessionRequest,
    idempotencyKey?: string,
  ): Promise<CashSessionResponse> {
    return apiClient.post<CashSessionResponse>(
      ApiRoutes.cashSessions.close(id),
      input,
      idempotencyKey,
    );
  },
};
