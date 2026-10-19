import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expensesApi, type ExpenseFilters } from "@/api/expenses";
import { qk } from "@/shared/hooks/query-keys";
import { EXPENSE_CATEGORIES_STALE_MS } from "@/constants";
import { useIdempotentMutation } from "@/shared/hooks/use-idempotent-mutation";
import type {
  CreateExpenseCategoryRequest,
  CreateExpenseRequest,
  ExpenseCategory,
  ExpenseResponse,
  PageParams,
} from "@/interfaces";

/**
 * Expense and category queries and mutations.
 *
 * Both creates are idempotent-wrapped. An expense that records twice is money
 * booked twice and, when paid in cash, taken out of the till twice.
 *
 * Categories get a long staleTime: they are administrative reference data that
 * changes a few times a year, and refetching them on every expense form open
 * would be noise.
 */
const CATEGORIES_STALE_MS = EXPENSE_CATEGORIES_STALE_MS;

export function useExpenses(page?: PageParams, filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: qk.expenses.list({ ...page, ...filters }),
    queryFn: () => expensesApi.list(page, filters),
    placeholderData: keepPreviousData,
  });
}

/** Cancelling puts the cash back into the till: the till is refreshed too. */
export function useCancelExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => expensesApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.expenses.all });
      queryClient.invalidateQueries({ queryKey: qk.cashSessions.all });
    },
    // The cancel dialog shows a failure in place (e.g. the till was closed since).
    meta: { success: "toast.expenses.cancelled", silent: true },
  });
}

/**
 * The categories a user can pick from.
 *
 * Returned straight from the server rather than defined in the frontend, because
 * `ExpenseCategory` is a table — a hard-coded list could never contain a category
 * an administrator added, and `CreateExpenseRequest` needs the real id.
 */
export function useExpenseCategories(page?: PageParams) {
  return useQuery({
    queryKey: qk.expenses.categories(page),
    queryFn: () => expensesApi.categories(page),
    staleTime: CATEGORIES_STALE_MS,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useIdempotentMutation<CreateExpenseRequest, ExpenseResponse>({
    mutationFn: (input, idempotencyKey) =>
      expensesApi.create(input, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.expenses.all });
      // A cash expense leaves the till, so the cashier's float is stale.
      queryClient.invalidateQueries({ queryKey: qk.cashSessions.all });
    },
    meta: { success: "toast.expenses.created" },
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();

  return useIdempotentMutation<CreateExpenseCategoryRequest, ExpenseCategory>({
    mutationFn: (input, idempotencyKey) =>
      expensesApi.createCategory(input, idempotencyKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.expenses.all }),
    meta: { success: "toast.expenses.categoryCreated" },
  });
}
