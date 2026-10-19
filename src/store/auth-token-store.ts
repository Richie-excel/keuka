import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TOKEN_EXPIRY_SKEW_MS } from "@/constants";

/**
 * The JWT pair returned by `POST /api/v1/auth/login`.
 *
 * Shape copied from `identity.dto.TokenResponse` (`accessToken`, `refreshToken`,
 * `tokenType=Bearer`, `accessExpiresAt`). The frontend does not invent auth
 * fields, so this must match the server exactly.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** ISO-8601 instant, as sent by the backend. */
  accessExpiresAt: string;
}

interface AuthTokenState {
  tokens: AuthTokens | null;
  /**
   * The tenant these tokens were issued for.
   *
   * WHY it is kept here: `POST /auth/refresh` takes
   * `{ companyCode, refreshToken }`, but `TokenResponse` never echoes the
   * company back. Unless the client remembers what it signed in with, it cannot
   * refresh at all — the session would die at the first access-token expiry.
   */
  companyCode: string | null;
  setTokens: (tokens: AuthTokens, companyCode?: string) => void;
  setCompanyCode: (companyCode: string | null) => void;
  clearTokens: () => void;
}

/**
 * Tokens live in a zustand store — not React state, not the query cache.
 *
 * WHY zustand and not context: the API client is a plain module with no render
 * tree, and it needs the access token on every request. A store readable
 * imperatively (`useAuthTokenStore.getState()`) works from outside React, which
 * context does not. Tokens are also client state — the server never re-sends
 * what is inside them once issued — so this is the correct half of the split,
 * with TanStack Query owning everything fetched.
 *
 * SECURITY TRADE-OFF, stated plainly: tokens are persisted to localStorage, so
 * a successful XSS on this origin can exfiltrate the refresh token. The backend
 * issues bearer tokens rather than httpOnly cookies, so *something* client-side
 * must hold them; localStorage is chosen so an office PWA survives a restart
 * the way users expect. Fixing that properly is a server-side change (httpOnly
 * refresh cookie), not a frontend one.
 */
export const STORAGE_KEY = "coms-auth-tokens";

/**
 * Treat the access token as dead this long before it really expires, so a
 * request is never sent with a token that expires in flight.
 */
const EXPIRY_SKEW_MS = TOKEN_EXPIRY_SKEW_MS;

export const useAuthTokenStore = create<AuthTokenState>()(
  persist(
    (set) => ({
      tokens: null,
      companyCode: null,

      setTokens: (tokens, companyCode) =>
        set((state) => ({
          tokens,
          companyCode: companyCode ?? state.companyCode,
        })),

      setCompanyCode: (companyCode) => set({ companyCode }),

      // Clearing the tokens also forgets the tenant, so a different company
      // signing in on the same device cannot inherit the previous code.
      clearTokens: () => set({ tokens: null, companyCode: null }),
    }),
    {
      name: STORAGE_KEY,
      // Only data is persisted — never the functions.
      partialize: (state) => ({
        tokens: state.tokens,
        companyCode: state.companyCode,
      }),
    },
  ),
);

/**
 * Imperative accessors for `api-client.ts`, which runs outside React and
 * therefore cannot call the hook.
 */
export const authTokens = {
  get: (): AuthTokens | null => useAuthTokenStore.getState().tokens,
  set: (tokens: AuthTokens, companyCode?: string): void =>
    useAuthTokenStore.getState().setTokens(tokens, companyCode),
  clear: (): void => useAuthTokenStore.getState().clearTokens(),
  getCompanyCode: (): string | null => useAuthTokenStore.getState().companyCode,
  hasUsableAccessToken: (): boolean => {
    const tokens = useAuthTokenStore.getState().tokens;
    if (!tokens) return false;
    return Date.parse(tokens.accessExpiresAt) - EXPIRY_SKEW_MS > Date.now();
  },
};
