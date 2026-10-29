import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { onSessionExpired } from "@/lib/api-client";
import { notifyInfo } from "@/lib/toast";
import {
  LOGIN_PATH,
  SESSION_EXPIRED_REASON,
  type SessionExpiredNavigationState,
} from "@/features/identity/session-expiry";

/**
 * Sends the app back to the sign-in screen the moment the session dies.
 *
 * THE BUG THIS FIXES: `api-client.ts` has always noticed a dead session — it
 * clears the tokens and notifies every `onSessionExpired` listener — but
 * nothing in the app ever subscribed, so the notification went nowhere. The
 * user was left on a fully rendered dashboard whose tokens had just been thrown
 * away: every later request failed as unauthenticated, and `useAuth().user`
 * kept returning the cached user for up to `staleTime`, so `ProtectedRoute` —
 * which only redirects when `user` is null — saw a signed-in user and stood
 * aside. Subscribing here closes that loop.
 *
 * WHERE it has to run: inside the router (it needs `useNavigate`) and outside
 * any route-specific branch, so a session that dies on any screen is caught.
 * `RootLayout` is the one element wrapping every route, public and protected
 * alike, which is why it is mounted there. `AuthProvider` would be the wrong
 * home: it sits above `RouterProvider` and has no navigation.
 *
 * This hook never decides WHETHER a user is authorised — the API and
 * `ProtectedRoute` do. It only makes the app look like what just became true.
 */
export function useSessionExpiryRedirect(): void {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();

  useEffect(() => {
    return onSessionExpired(() => {
      // Drop the whole cache for the same reason sign-out does: the session
      // query must fall back to null so `useAuth` and `ProtectedRoute` agree
      // the user is gone, and whoever signs in next on this device must not be
      // served the previous user's partners, purchases or cash from a warm
      // cache.
      queryClient.clear();
      // Said right here, not only by the notice on the sign-in screen: that notice
      // needs this navigation's state, and the protected page's own redirect to
      // /login (without it) can win the race once the cache is cleared. The toast
      // lives at the app root, so it survives the move to the sign-in screen.
      notifyInfo("toast.session.expired");

      // Already on the sign-in screen — usually because a background request
      // died while the form was open. A second navigation would achieve nothing
      // and risks wiping what the user has typed.
      if (pathname === LOGIN_PATH) return;

      navigate(LOGIN_PATH, {
        replace: true,
        state: {
          reason: SESSION_EXPIRED_REASON,
        } satisfies SessionExpiredNavigationState,
      });
    });
  }, [navigate, queryClient, pathname]);
}
