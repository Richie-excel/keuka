import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";
import { withPageQuery, withQueryParam } from "@/api/paging";
import type {
  CreateExpenseCategoryRequest,
  CreateExpenseRequest,
  ExpenseCategory,
  ExpenseResponse,
  PageParams,
  PageResponse,
} from "@/interfaces";

/**
 * Company expenses and their categories (`/api/v1/expenses`).
 *
 * WHY categories are fetched rather than hard-coded: `ExpenseCategory` is an
 * ENTITY (a table row with an id, name and description), not an enum. The old
 * frontend had a REPAIRS/FUEL/UTILITIES/OFFICE/OTHER enum, which could never
 * match a category an administrator creates — and `CreateExpenseRequest` requires
 * a `categoryId`, so a client-invented name would simply be rejected.
 *
 * A CASH expense needs an open till and is rejected with `CASH_SESSION_REQUIRED`
 * otherwise; the server deducts it from the float and records a cash movement.
 * That is why `cashSessionId` is on the create payload.
 */
export interface ExpenseFilters {
  categoryId?: string;
  cashSessionId?: string;
}

export const expensesApi = {
  /** Newest first; optionally one category's, or one till session's. */
  list(page?: PageParams, filters: ExpenseFilters = {}): Promise<PageResponse<ExpenseResponse>> {
    const path = withQueryParam(
      withQueryParam(ApiRoutes.expenses.all, "categoryId", filters.categoryId),
      "cashSessionId",
      filters.cashSessionId,
    );
    return apiClient.get<PageResponse<ExpenseResponse>>(withPageQuery(path, page));
  },

  /** Cancels a mistaken expense; its cash goes back into the till, which must still be open. */
  cancel(id: string, reason: string): Promise<ExpenseResponse> {
    return apiClient.post<ExpenseResponse>(ApiRoutes.expenses.cancel(id), { reason });
  },

  categories(page?: PageParams): Promise<PageResponse<ExpenseCategory>> {
    return apiClient.get<PageResponse<ExpenseCategory>>(
      withPageQuery(ApiRoutes.expenses.categories, page),
    );
  },

  create(
    input: CreateExpenseRequest,
    idempotencyKey?: string,
  ): Promise<ExpenseResponse> {
    return apiClient.post<ExpenseResponse>(
      ApiRoutes.expenses.all,
      input,
      idempotencyKey,
    );
  },

  createCategory(
    input: CreateExpenseCategoryRequest,
    idempotencyKey?: string,
  ): Promise<ExpenseCategory> {
    return apiClient.post<ExpenseCategory>(
      ApiRoutes.expenses.categories,
      input,
      idempotencyKey,
    );
  },
};
