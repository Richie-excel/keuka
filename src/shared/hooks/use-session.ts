import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionApi, type Credentials } from "@/api/session";
import { qk } from "@/shared/hooks/query-keys";
import type { UserResponse } from "@/interfaces";
import type { SystemRole } from "@/enums";
import { SESSION_STALE_MS } from "@/constants";

export function useSession() {
  return useQuery({
    queryKey: qk.session.me(),
    queryFn: sessionApi.current,
    staleTime: SESSION_STALE_MS,
    retry: 0,
  });
}

/**
 * The one identity transition that had no cache reset.
 *
 * WHY THIS IS NOT COSMETIC — this was a cross-tenant data leak. Signing out and
 * a session expiring both clear the cache (see `useLogout` below and
 * `useSessionExpiryRedirect`), but SIGNING IN did not. Query keys carry no
 * tenant, so a list requested by a new session matched the key the previous one
 * had already filled: `/cocoa-prices`, `/warehouses`, `/purchases` and
 * `/partners` were all served straight from the previous company's cached rows
 * — inside `staleTime` there is no refetch, and even a stale entry renders
 * before the network answers. That is one enterprise seeing another's prices.
 *
 * The reset happens BEFORE the new session is seeded, so the freshly fetched
 * user is the only thing left in the cache.
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: Credentials) => sessionApi.login(credentials),
    onSuccess: (user: UserResponse) => {
      queryClient.clear();
      queryClient.setQueryData(qk.session.me(), user);
    },
    meta: { silent: true },
    retry: false,
  });
}

export function useLoginAsRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (role: SystemRole) => sessionApi.loginAsRole(role),
    onSuccess: (user: UserResponse) => {
      // Same reset as a real sign-in: this switches who is signed in, so
      // nothing cached under the previous identity may survive it.
      queryClient.clear();
      queryClient.setQueryData(qk.session.me(), user);
    },
    meta: { silent: true },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => sessionApi.logout(),
    // Settled, not success: the local tokens are dropped even when the server
    // call fails, so the cached data of the identity that just left must go too.
    onSettled: () => {
      queryClient.clear();
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { currentPassword: string; newPassword: string }) =>
      sessionApi.changePassword(vars.currentPassword, vars.newPassword),
    // A one-time password is now replaced: re-ask who is signed in, which lifts the lock.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.session.me() }),
    meta: { success: "toast.password.changed", silent: true },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { fullName?: string; email?: string }) =>
      sessionApi.updateProfile(vars.fullName, vars.email),
    onSuccess: (user: UserResponse) => {
      queryClient.setQueryData(qk.session.me(), user);
    },
    meta: { success: "toast.profile.updated" },
  });
}
