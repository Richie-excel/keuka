import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import type { PermissionKey, SystemRole } from "@/enums";
import Loader from "@/components/loader";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: PermissionKey[];
  requireAny?: boolean;
  requiredRoles?: SystemRole[];
  enterpriseOnly?: boolean;
}

const CHANGE_PASSWORD_PATH = "/auth/change-password";

export function ProtectedRoute({
  children,
  requiredPermissions,
  requireAny = false,
  requiredRoles,
  enterpriseOnly = false,
}: ProtectedRouteProps) {
  const { user, isLoading, hasAnyRole, isPlatform } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center bg-paper"
        aria-live="polite"
      >
        <Loader className="w-16 h-16" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Signed in with a one-time password: nothing else until they choose their own.
  if (user.mustChangePassword && location.pathname !== CHANGE_PASSWORD_PATH) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />;
  }

  if (enterpriseOnly && isPlatform) return <Navigate to="/forbidden" replace />;

  if (
    requiredRoles &&
    requiredRoles.length > 0 &&
    !hasAnyRole(...requiredRoles)
  ) {
    return <Navigate to="/forbidden" replace />;
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requireAny
      ? requiredPermissions.some((p) => user.permissions.includes(p))
      : requiredPermissions.every((p) => user.permissions.includes(p));

    if (!hasAccess) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return <>{children}</>;
}
