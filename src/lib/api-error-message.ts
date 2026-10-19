import i18n from "i18next";
import { ApiError } from "@/lib/api-client";

const CODE_KEY_PREFIX = "apiErrors.codes.";
const HTTP_KEY_PREFIX = "apiErrors.http.";
const NETWORK_KEY = "apiErrors.network";
const UNKNOWN_KEY = "apiErrors.unknown";


const UNINFORMATIVE_MESSAGES = new Set(["", "Request failed"]);

interface ErrorLike {
  status: number;
  code?: string;
  message?: string;
}

function asErrorLike(error: unknown): ErrorLike | null {
  if (error instanceof ApiError) {
    return { status: error.status, code: error.code, message: error.message };
  }

  if (typeof error !== "object" || error === null) return null;

  const candidate = error as {
    status?: unknown;
    code?: unknown;
    message?: unknown;
  };

  if (typeof candidate.status !== "number") return null;

  return {
    status: candidate.status,
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    message: typeof candidate.message === "string" ? candidate.message : undefined,
  };
}

/**
 * The translated key for a backend code, or `null` when we have not been taught
 * that code yet. `i18n.exists` is the check that makes this data-driven: adding
 * a line to `errors.json` is what teaches it, never a change here.
 */
export function apiErrorCodeKey(code: string | undefined): string | null {
  if (!code) return null;
  const key = `${CODE_KEY_PREFIX}${code}`;
  return i18n.exists(key) ? key : null;
}

/** The translated key for an HTTP status, or `null` when it is not a status we name. */
export function apiErrorStatusKey(status: number): string | null {
  const key = `${HTTP_KEY_PREFIX}${status}`;
  return i18n.exists(key) ? key : null;
}

/** The server's sentence when it actually said something, otherwise `null`. */
function usableServerMessage(message: string | undefined): string | null {
  if (message === undefined) return null;
  const trimmed = message.trim();
  if (UNINFORMATIVE_MESSAGES.has(trimmed)) return null;
  return trimmed;
}

export function apiErrorMessage(error: unknown): string {
  const described = asErrorLike(error);

  if (!described) return i18n.t(UNKNOWN_KEY);

  const byCode = apiErrorCodeKey(described.code);
  if (byCode) return i18n.t(byCode);

  if (described.status === 0) return i18n.t(NETWORK_KEY);

  const serverSaid = usableServerMessage(described.message);
  if (serverSaid) return serverSaid;

  const byStatus = apiErrorStatusKey(described.status);
  if (byStatus) return i18n.t(byStatus);

  return i18n.t(UNKNOWN_KEY);
}
