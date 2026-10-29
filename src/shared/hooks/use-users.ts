import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/api/users";
import { qk } from "@/shared/hooks/query-keys";
import { useIdempotentMutation } from "@/shared/hooks/use-idempotent-mutation";
import type {
  CreateUserRequest,
  PageParams,
  ResetPasswordRequest,
  UpdateUserRequest,
  UserResponse,
} from "@/interfaces";

export function useUsers(page?: PageParams, enterpriseId?: string) {
  return useQuery({
    queryKey: qk.users.list({ ...page, enterpriseId }),
    queryFn: () => usersApi.list(page, enterpriseId),
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: qk.users.detail(id ?? ""),
    queryFn: () => usersApi.byId(id as string),
    enabled: Boolean(id),
  });
}

/** Employees the boss can give a sign-in to. Refetched after each create (users.all). */
export function useAvailableEmployees(enabled = true) {
  return useQuery({
    queryKey: qk.users.availableEmployees(),
    queryFn: usersApi.availableEmployees,
    enabled,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useIdempotentMutation<CreateUserRequest, UserResponse>({
    mutationFn: (input, idempotencyKey) => usersApi.create(input, idempotencyKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.users.all }),
    meta: { success: "toast.users.created" },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; patch: UpdateUserRequest }) =>
      usersApi.update(vars.id, vars.patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.users.all }),
    meta: { success: "toast.users.updated" },
  });
}

export function useSetUserEnabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; enabled: boolean }) =>
      vars.enabled ? usersApi.enable(vars.id) : usersApi.disable(vars.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.users.all }),
    meta: { success: "toast.users.statusChanged" },
  });
}

export function useResetUserPassword() {
  const queryClient = useQueryClient();

  return useIdempotentMutation<
    { id: string; input: ResetPasswordRequest },
    UserResponse
  >({
    mutationFn: ({ id, input }, idempotencyKey) =>
      usersApi.resetPassword(id, input, idempotencyKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.users.all }),
    meta: { success: "toast.users.passwordReset" },
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.resendInvitation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.users.all }),
    meta: { success: "toast.users.invitationSent" },
  });
}

export function useRemoveUser() {
  const queryClient = useQueryClient();

  return useIdempotentMutation<string, UserResponse>({
    mutationFn: (id, idempotencyKey) => usersApi.remove(id, idempotencyKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.users.all }),
    meta: { success: "toast.users.deactivated" },
  });
}

export function useAssignUserRoles() {
  const queryClient = useQueryClient();
 
  return useMutation({
    mutationFn: (vars: { id: string; roles: string[] }) =>
      usersApi.update(vars.id, { roles: vars.roles }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.users.all }),
    meta: { success: "toast.roles.rolesAssigned", silent: true },
  });
}
