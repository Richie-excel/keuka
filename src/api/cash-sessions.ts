import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";
import { withPageQuery } from "@/api/paging";
import type {
  AddCashProvisionRequest,
  CashierResponse,
  CashProvisionResponse,
  CashSessionResponse,
  CreateCashProvisionRequest,
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
 * - **Only a cashier opens and closes a till**, and only their own
 *   (`TILL_CASHIER_ONLY`, 403). It opens with what was counted at its last
 *   closing plus the provisions waiting for them.
 * - **Provisions come from the boss** (`PROVISION_NOT_ALLOWED` for a cashier).
 *   Given while the till is closed, a provision waits; it never opens the till.
 * - **Anyone else pays cash from a cashier's open till**: `current` returns it.
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
   * The open till the caller's cash goes through (a cashier's own; for anyone
   * else, the cashier till their cash payments come from), or `null` (204).
   * Use this, not the list: the list holds every till in the company.
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

  /** The boss gives a cashier cash: into their open till, or waiting for it to open. */
  provide(
    input: CreateCashProvisionRequest,
    idempotencyKey?: string,
  ): Promise<CashProvisionResponse> {
    return apiClient.post<CashProvisionResponse>(
      ApiRoutes.cashSessions.pendingProvisions,
      input,
      idempotencyKey,
    );
  },

  /** Provisions waiting for a till to open (a cashier sees their own). */
  pendingProvisions(): Promise<CashProvisionResponse[]> {
    return apiClient.get<CashProvisionResponse[]>(ApiRoutes.cashSessions.pendingProvisions);
  },

  cashiers(): Promise<CashierResponse[]> {
    return apiClient.get<CashierResponse[]>(ApiRoutes.cashSessions.cashiers);
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
