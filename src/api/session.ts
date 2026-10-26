import { ApiRoutes } from "@/api/routes";
import { request, ApiError } from "@/lib/api-client";
import { authTokens } from "@/store/auth-token-store";
import type { TokenResponse, UserResponse } from "@/interfaces";
import { type SystemRole } from "@/enums";

/**
 * Authentication, against the real backend contract.
 *
 * WHAT CHANGED AND WHY: this module used to assume `POST /auth/login` returned
 * the signed-in user and then fetch `/auth/session` — a route the backend does
 * not have. The server returns **tokens** from `/auth/login` and the user from
 * **`GET /auth/me`**. Two calls, in that order; getting it the other way round
 * means the app never learns who is signed in.
 *
 * It also carries `companyCode`/`warehouseCode`, which `LoginRequest` accepts and
 * `RefreshRequest` requires. The company code has to be remembered by the client
 * (see the auth store) because `TokenResponse` does not echo it back.
 */
export interface Credentials {
  companyCode?: string;
  warehouseCode?: string;
  username: string;
  password: string;
}

/**
 * DEMO-ONLY MOCK AUTH — remove once the backend is reachable from dev.
 *
 * Kept because the office backend is not always running on a developer's machine
 * or in CI, and the UI otherwise cannot be opened at all. The mock path returns
 * the SAME shapes as the real one, so nothing downstream branches on which is
 * active, and swapping it out is deleting this block.
 */
export const IS_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === "true";
const MOCK_SESSION_KEY = "mock-auth-user-id";
const simulateLatency = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 250));

const MOCK_USERS: UserResponse[] = [
  {
    id: "mock-admin",
    username: "admin",
    fullName: "Demo Administrator",
    email: "admin@example.com",
    active: true,
    roles: ["ADMIN" as SystemRole],
    permissions: [],
  },
];

function readMockSession(): UserResponse | null {
  const savedId = localStorage.getItem(MOCK_SESSION_KEY);
  return MOCK_USERS.find((user) => user.id === savedId) ?? null;
}

export const sessionApi = {
  async current(): Promise<UserResponse | null> {
    if (IS_MOCK_AUTH) {
      await simulateLatency();
      return readMockSession();
    }

    if (!authTokens.get()) return null;

    try {
      return await request<UserResponse>(ApiRoutes.auth.me);
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        authTokens.clear();
        return null;
      }
      throw error;
    }
  },

  async login(credentials: Credentials): Promise<UserResponse> {
    const { companyCode, warehouseCode, username, password } = credentials;

    if (IS_MOCK_AUTH) {
      await simulateLatency();
      const match = MOCK_USERS.find(
        (user) =>
          user.username.toLowerCase() === username.trim().toLowerCase() ||
          user.fullName.toLowerCase() === username.trim().toLowerCase(),
      );

      if (!match || !password.trim()) {
        throw new ApiError(
          401,
          "INVALID_CREDENTIALS",
          "Unknown user or password.",
        );
      }
      if (!match.active) {
        throw new ApiError(
          403,
          "USER_DISABLED",
          "This account is deactivated.",
        );
      }

      localStorage.setItem(MOCK_SESSION_KEY, match.id);
      return match;
    }
    const tokens = await request<TokenResponse>(ApiRoutes.auth.login, {
      method: "POST",
      body: { companyCode, warehouseCode, username, password },
      auth: false,
    });

    console.log(tokens);

    authTokens.set(
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessExpiresAt: tokens.accessExpiresAt,
      },
      companyCode,
    );

    return request<UserResponse>(ApiRoutes.auth.me);
  },

  async loginAsRole(role: SystemRole): Promise<UserResponse> {
    if (!IS_MOCK_AUTH) {
      throw new Error("loginAsRole is only available in mock mode.");
    }

    await simulateLatency();

    const match = MOCK_USERS.find((user) => user.roles.includes(role));
    if (!match) {
      throw new ApiError(404, "USER_NOT_FOUND", `No seeded user for ${role}.`);
    }

    localStorage.setItem(MOCK_SESSION_KEY, match.id);
    return match;
  },

  async logout(): Promise<void> {
    if (IS_MOCK_AUTH) {
      await simulateLatency();
      localStorage.removeItem(MOCK_SESSION_KEY);
      return;
    }

    try {
      // Server-side this revokes ALL refresh tokens for the user, so it must be
      // attempted before the local tokens are dropped.
      await request<void>(ApiRoutes.auth.logout, { method: "POST" });
    } finally {
      // Clear locally even if the call failed: the user asked to sign out, and
      // leaving live tokens in storage is the worse outcome.
      authTokens.clear();
    }
  },

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    if (IS_MOCK_AUTH) {
      await simulateLatency();
      if (!currentPassword.trim()) {
        throw new ApiError(
          400,
          "VALIDATION_FAILED",
          "Current password is required.",
        );
      }
      return;
    }

    // `ChangePasswordRequest` is `{ currentPassword, newPassword }` and the
    // server enforces 8–120 characters on the new one.
    await request<void>(ApiRoutes.auth.changePassword, {
      method: "POST",
      body: { currentPassword, newPassword },
    });
  },

  /** `PATCH /auth/me` — own name/email. Username is not changeable here. */
  async updateProfile(
    fullName?: string,
    email?: string,
  ): Promise<UserResponse> {
    if (IS_MOCK_AUTH) {
      await simulateLatency();
      const current = readMockSession();
      if (!current)
        throw new ApiError(401, "UNAUTHENTICATED", "Not signed in.");
      return {
        ...current,
        fullName: fullName ?? current.fullName,
        email: email ?? current.email,
      };
    }

    return request<UserResponse>(ApiRoutes.auth.me, {
      method: "PATCH",
      body: { fullName, email },
    });
  },
};
