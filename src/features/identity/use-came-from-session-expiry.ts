import { useLocation } from "react-router-dom";
import { isSessionExpiredState } from "@/features/identity/session-expiry";

/**
 * True when this history entry says the user was signed out, rather than
 * having walked to the sign-in screen themselves.
 *
 * The login screen uses it to explain what happened. Landing on a bare form
 * with no explanation is the thing that makes people think they were hacked or
 * that they mistyped something — the notice is worth the four lines it costs.
 */
export function useCameFromSessionExpiry(): boolean {
  return isSessionExpiredState(useLocation().state);
}
