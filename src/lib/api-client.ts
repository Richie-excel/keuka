import { API, ApiRoutes } from "@/api/routes";
import { authTokens, type AuthTokens } from "@/store/auth-token-store";
import i18n from "../../i18n";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? API).replace(/\/+$/, "");

export type KnownApiErrorCode =
  | "VALIDATION_FAILED"
  | "INVALID_CREDENTIALS"
  | "USER_DISABLED"
  | "ACCESS_DENIED"
  | "PAYMENT_EXCEEDS_BALANCE"
  | "CASH_SESSION_REQUIRED"
  | "INSUFFICIENT_CASH"
  | "INSUFFICIENT_SALARY_DUE"
  | "BUYER_NOT_TRUSTED"
  | "INVALID_MEASUREMENT"
  | "PARTNER_REQUIRED"
  | "OPEN_CASH_SESSION_EXISTS"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAUTHENTICATED"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "UNKNOWN";

export type ApiErrorCode = KnownApiErrorCode | (string & {});

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "ApiError";
  }

  get isBusinessRuleViolation(): boolean {
    return this.status === 422 || this.code === "VALIDATION_FAILED";
  }
}

export class SessionExpiredError extends ApiError {
  constructor() {
    super(401, "UNAUTHENTICATED", "Session expired. Please sign in again.");
    this.name = "SessionExpiredError";
  }
}

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

function expireSession(): void {
  // Only a session that EXISTED can expire.
  //
  // WHY the guard: `performRefresh` also reaches here when there is nothing to
  // refresh, which happens on a cold start for a visitor who never signed in.
  // Without this check that visitor would broadcast "your session expired" at
  // the first authenticated request, and the app would react by ushering them
  // to the login screen — or off a public page they were reading happily.
  const hadSession = authTokens.get() !== null;

  authTokens.clear();

  if (!hadSession) return;
  sessionExpiredListeners.forEach((listener) => listener());
}


export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  idempotencyKey?: string;
  signal?: AbortSignal;
  auth?: boolean;
}

async function performFetch(
  path: string,
  options: RequestOptions,
  accessToken: string | null,
): Promise<Response> {
  const headers = new Headers();
  headers.set("Accept", "application/json");
  // The server writes emails (invitations…) in the language the user works in.
  if (i18n.language) headers.set("Accept-Language", i18n.language);
  if (options.body !== undefined)
    headers.set("Content-Type", "application/json");
  if (options.idempotencyKey)
    headers.set("Idempotency-Key", options.idempotencyKey);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  try {
    return await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? "GET",
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      headers,
      signal: options.signal,
    });
  } catch (cause) {
    throw new ApiError(0, "NETWORK_ERROR", "The server could not be reached.", {
      cause,
    });
  }
}

let refreshInFlight: Promise<AuthTokens> | null = null;

function refreshTokens(): Promise<AuthTokens> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function performRefresh(): Promise<AuthTokens> {
  const current = authTokens.get();
  if (!current?.refreshToken) {
    expireSession();
    throw new SessionExpiredError();
  }

  const response = await performFetch(
    ApiRoutes.auth.refresh,
    {
      method: "POST",
      body: {
        companyCode: authTokens.getCompanyCode(),
        refreshToken: current.refreshToken,
      },
    },
    null,
  );

  if (!response.ok) {
    expireSession();
    throw new SessionExpiredError();
  }

  const tokens = (await response.json()) as AuthTokens;
  authTokens.set(tokens);
  return tokens;
}

async function ensureAccessToken(): Promise<string> {
  if (authTokens.hasUsableAccessToken()) {
    return authTokens.get()!.accessToken;
  }
  const tokens = await refreshTokens();
  return tokens.accessToken;
}

function fallbackCodeFor(status: number): ApiErrorCode {
  if (status === 401) return "UNAUTHENTICATED";
  if (status === 403) return "ACCESS_DENIED";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN";
}

async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as {
    code?: string;
    message?: string;
  } | null;

  return new ApiError(
    response.status,
    body?.code ?? fallbackCodeFor(response.status),
    body?.message ?? response.statusText ?? "Request failed",
  );
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const needsAuth = options.auth !== false;
  const accessToken = needsAuth ? await ensureAccessToken() : null;

  let response = await performFetch(path, options, accessToken);

  if (response.status === 401 && needsAuth) {
    const tokens = await refreshTokens();
    response = await performFetch(path, options, tokens.accessToken);

    if (response.status === 401) {
      expireSession();
      throw new SessionExpiredError();
    }
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, idempotencyKey?: string) =>
    request<T>(path, { method: "POST", body, idempotencyKey }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),

  delete: <T>(path: string, idempotencyKey?: string) =>
    request<T>(path, { method: "DELETE", idempotencyKey }),
};
