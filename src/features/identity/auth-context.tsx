import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "@/shared/context";
import { useLogin, useLogout, useSession } from "@/shared/hooks/use-session";
import { type Credentials } from "@/api/session";
import { PermissionKey, SystemRole } from "@/enums";
import type { UserResponse } from "@/interfaces";
import { qk } from "@/shared/hooks/query-keys";
import { setTenantScope, tenantScopeOf } from "@/shared/tenant-scope";
import { STORAGE_KEY, useAuthTokenStore } from "@/store/auth-token-store";

/**
 * Who is signed in, for the whole app.
 * ---------------------------------------------------------------------------
 * AUTHORIZATION BOUNDARY — read before adding a permission check anywhere
 * ---------------------------------------------------------------------------
 * `hasPermission` controls what the UI SHOWS. It is never the only thing
 * between a user and a sensitive action. Every mutating request is checked
 * server-side against the Spring authority, and a 403 from the API is the real
 * answer. This exists so a cashier does not see a "Publish cocoa price" button
 * they would be rejected for anyway — a UX kindness, not a security control.
 */
export interface AuthContextValue {
  user: UserResponse | null;
  isLoading: boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: PermissionKey) => boolean;
  hasAnyRole: (...roles: SystemRole[]) => boolean;
  /**
   * The platform operator (SYSTEM_ADMIN). They belong to no company, so they have
   * no purchases, buyers, prices… of their own: every such record belongs to one
   * enterprise and the API refuses to create it without one.
   */
  isPlatform: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const user = session.data ?? null;
  const queryClient = useQueryClient();

  // Set during render, before any page below builds a query key from it.
  const scope = tenantScopeOf(user);
  setTenantScope(scope);

  // Whatever was cached under another identity can never be read again (its keys
  // carry the old scope), so drop it instead of letting it sit in memory.
  useEffect(() => {
    queryClient.removeQueries({
      predicate: (query) => {
        const root = query.queryKey[0];
        return root !== scope && root !== qk.session.all[0];
      },
    });
  }, [queryClient, scope]);

  // Tokens live in localStorage, shared by every tab. When another tab signs in
  // as someone else (or out), adopt its tokens and re-ask who is signed in; the
  // scope then follows and this tab stops showing the previous identity's data.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      void Promise.resolve(useAuthTokenStore.persist.rehydrate()).then(() =>
        queryClient.invalidateQueries({ queryKey: qk.session.me() }),
      );
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [queryClient]);

  const login = useCallback(
    async (credentials: Credentials) => {
      await loginMutation.mutateAsync(credentials);
    },
    [loginMutation],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const hasPermission = useCallback(
    (permission: PermissionKey) =>
      user?.permissions.includes(permission) ?? false,
    [user],
  );

  const hasAnyRole = useCallback(
    (...roles: SystemRole[]) =>
      roles.length === 0 || roles.some((role) => user?.roles.includes(role)),
    [user],
  );

  const isPlatform = user?.roles.includes(SystemRole.SYSADMIN) ?? false;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      // `isPending` covers the first load; `isFetching` would flicker the
      // loading state on every background refetch.
      isLoading: session.isPending,
      login,
      logout,
      hasPermission,
      hasAnyRole,
      isPlatform,
    }),
    [user, session.isPending, login, logout, hasPermission, hasAnyRole, isPlatform],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
