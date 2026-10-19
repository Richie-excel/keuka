import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";
import { withPageQuery } from "@/api/paging";
import type {
  CollectSalaryRequest,
  PageParams,
  PageResponse,
  SalaryResponse,
} from "@/interfaces";

/**
 * Salaries (`/api/v1/employees/{id}/salary-*`).
 *
 * Salary becomes due on its own: each month an employee completes from their
 * hire date adds their agreed salary to `EmployeeResponse.salaryDue` (server
 * side, nightly and on every employee change). Nobody records it by hand.
 *
 * **Collect** — the employee comes to the cashier, takes an amount up to what
 *    is owed and up to what is in the till, and SIGNS. `signatureName` is that
 *    signature and is required.
 *
 * The server enforces both ceilings: more than owed is
 * `INSUFFICIENT_SALARY_DUE`, more than the till holds is `INSUFFICIENT_CASH`.
 */
export const payrollApi = {
  /** Employee collects and signs. Needs an open till when paid in cash. */
  collect(
    employeeId: string,
    input: CollectSalaryRequest,
    idempotencyKey?: string,
  ): Promise<SalaryResponse> {
    return apiClient.post<SalaryResponse>(
      ApiRoutes.employees.salaryPayouts(employeeId),
      input,
      idempotencyKey,
    );
  },

  /** Signed collections for one employee. */
  history(
    employeeId: string,
    page?: PageParams,
  ): Promise<PageResponse<SalaryResponse>> {
    return apiClient.get<PageResponse<SalaryResponse>>(
      withPageQuery(ApiRoutes.employees.salaryPayouts(employeeId), page),
    );
  },
};
