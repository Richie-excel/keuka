import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { rolesApi } from "@/api/roles";
import { qk } from "@/shared/hooks/query-keys";
import type { CreateRoleRequest, RoleResponse, UpdateRoleRequest } from "@/interfaces";

/**
 * The role catalogue (`GET /roles`, authority `ROLE_READ`).
 *
 * `enabled` exists so a caller that only MAY read roles asks for them: this
 * query is refused with a 403 for anyone without `ROLE_READ`, and the app's
 * query defaults throw a 403 to the error boundary (`lib/query-client.ts`), so
 * a caller must not fire it speculatively on behalf of an actor who cannot
 * have it.
 */
export function useRoles(options?: { enabled?: boolean }) {
  return useQuery<RoleResponse[]>({
    queryKey: qk.roles.list(),
    queryFn: () => rolesApi.list(),
    enabled: options?.enabled ?? true,
  });
}
 
export function useCreateRole() {
  const queryClient = useQueryClient();
 
  return useMutation({
    mutationFn: (input: CreateRoleRequest) => rolesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.roles.all }),
    meta: { successToast: "toast.roles.created", errorToast: false },
  });
}
 
export function useUpdateRole() {
  const queryClient = useQueryClient();
 
  return useMutation({
    mutationFn: (vars: { id: string; patch: UpdateRoleRequest }) =>
      rolesApi.update(vars.id, vars.patch),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.roles.all }),
        queryClient.invalidateQueries({ queryKey: qk.users.all }),
      ]),
    meta: { successToast: "toast.roles.updated", errorToast: false },
  });
}
 
export function useDeleteRole() {
  const queryClient = useQueryClient();
 
  return useMutation({
    mutationFn: (id: string) => rolesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.roles.all }),
    meta: { successToast: "toast.roles.deleted" },
  });
}
