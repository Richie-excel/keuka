import { useQuery, useQueryClient } from "@tanstack/react-query";
import { payrollApi } from "@/api/payroll";
import { qk } from "@/shared/hooks/query-keys";
import { useIdempotentMutation } from "@/shared/hooks/use-idempotent-mutation";
import type {
  CollectSalaryRequest,
  PageParams,
  SalaryResponse,
} from "@/interfaces";

/**
 * Salary collection. (Salary due is added automatically by the server.)
 *
 * The write is idempotent-wrapped: it moves the number the company owes, and a
 * replayed collection pays someone twice. The `signatureName` on a collection is the
 * record that the employee took cash, so a duplicate would be a forged second
 * signature.
 *
 * It also invalidates the EMPLOYEES cache, because `salaryDue` lives on
 * `EmployeeResponse` and the personnel screen reads it.
 */
export function useSalaryHistory(employeeId: string | undefined, page?: PageParams) {
  return useQuery({
    queryKey: qk.payroll.list(employeeId ?? "", page),
    queryFn: () => payrollApi.history(employeeId as string, page),
    enabled: Boolean(employeeId),
  });
}

export function useCollectSalary() {
  const queryClient = useQueryClient();

  return useIdempotentMutation<
    { employeeId: string; input: CollectSalaryRequest },
    SalaryResponse
  >({
    mutationFn: ({ employeeId, input }, idempotencyKey) =>
      payrollApi.collect(employeeId, input, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.payroll.all });
      queryClient.invalidateQueries({ queryKey: qk.employees.all });
      // A cash collection leaves the till.
      queryClient.invalidateQueries({ queryKey: qk.cashSessions.all });
    },
    // The employee signs for cash; a receipt on screen is what a payroll clerk
    // checks before the signature record is filed.
    meta: { success: "toast.payroll.collected" },
  });
}
