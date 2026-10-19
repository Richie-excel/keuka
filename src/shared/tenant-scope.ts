import type { UserResponse } from "@/interfaces";

/**
 * Whose data the query cache currently holds.
 *
 * WHY — the server isolates enterprises (every company's rows are filtered to the
 * signed-in user's enterprise), but the browser cache does not know that. Without
 * a scope in the key, `["partners", "list", {}]` filled for one company is the
 * same entry another company's session would read. Every query key except the
 * session itself starts with this value (see `query-keys.ts`), so data cached for
 * one identity can never answer a query made under another, even if a cache reset
 * is missed somewhere.
 *
 * Per user, not just per enterprise: some reads depend on who asks (a cashier's
 * open till, a warehouse user's stock), not only on the company.
 *
 * Set by `AuthProvider` from the session before any page renders its queries.
 */
const ANONYMOUS = "anonymous";

let current = ANONYMOUS;

export function tenantScopeOf(user: Pick<UserResponse, "id" | "enterpriseId"> | null | undefined): string {
  if (!user) return ANONYMOUS;
  return `${user.enterpriseId ?? "platform"}:${user.id}`;
}

export function getTenantScope(): string {
  return current;
}

export function setTenantScope(scope: string): void {
  current = scope;
}
