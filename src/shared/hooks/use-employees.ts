import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeesApi } from "@/api/employees";
import { qk } from "@/shared/hooks/query-keys";
import { useIdempotentMutation } from "@/shared/hooks/use-idempotent-mutation";
import type {
  CreateEmployeeRequest,
  EmployeeResponse,
  PageParams,
  UpdateEmployeeRequest,
} from "@/interfaces";

/**
 * Employee queries and mutations.
 *
 * `create` is idempotent-wrapped (a retried hire would duplicate a personnel
 * record, and salary accruals would then be ambiguous about who they belong to).
 * `update` is not — it writes absolute values, so replaying it changes nothing.
 *
 * There is no `useRemoveEmployee`: the backend has no DELETE for employees.
 * People are deactivated with `update` and `{ active: false }`, because salaries
 * and audit events reference them by id.
 */
export function useEmployees(page?: PageParams, enabled = true) {
  return useQuery({
    queryKey: qk.employees.list(page),
    queryFn: () => employeesApi.list(page),
    enabled,
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: qk.employees.detail(id ?? ""),
    queryFn: () => employeesApi.byId(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useIdempotentMutation<CreateEmployeeRequest, EmployeeResponse>({
    mutationFn: (input, idempotencyKey) =>
      employeesApi.create(input, idempotencyKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.employees.all }),
    meta: { success: "toast.employees.created" },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; patch: UpdateEmployeeRequest }) =>
      employeesApi.update(vars.id, vars.patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.employees.all }),
    meta: { success: "toast.employees.updated" },
  });
}
