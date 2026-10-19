export const LOGIN_PATH = "/login";

export const SESSION_EXPIRED_REASON = "session-expired" as const;

export interface SessionExpiredNavigationState {
  reason: typeof SESSION_EXPIRED_REASON;
}

export function isSessionExpiredState(
  state: unknown,
): state is SessionExpiredNavigationState {
  return (
    typeof state === "object" &&
    state !== null &&
    (state as { reason?: unknown }).reason === SESSION_EXPIRED_REASON
  );
}
