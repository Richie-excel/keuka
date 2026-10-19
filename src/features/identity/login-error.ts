import { ApiError } from "@/lib/api-client";


const FAILURE_KEYS: Record<string, string> = {
  INVALID_CREDENTIALS: "login.errorUnauthorized",
  AUTHENTICATION_FAILED: "login.errorUnauthorized",
  UNAUTHENTICATED: "login.errorUnauthorized",
  USER_DISABLED: "login.errorDisabled",

  INVALID_TENANT: "login.errorNoEnterprise",
  ENTERPRISE_NOT_FOUND: "login.errorNoEnterprise",
  TENANT_NOT_FOUND: "login.errorNoEnterprise",
  WAREHOUSE_NOT_FOUND: "login.errorNoWarehouse",
  WAREHOUSE_INACTIVE: "login.errorNoWarehouse",

  TENANT_SUSPENDED: "login.errorTenantSuspended",
  TENANT_INACTIVE: "login.errorTenantSuspended",
  SUBSCRIPTION_INACTIVE: "login.errorTenantSuspended",

  ACCESS_DENIED: "login.errorForbidden",
  FORBIDDEN: "login.errorForbidden",

  NETWORK_ERROR: "login.errorNetwork",
};

function keyForStatus(status: number): string | null {
  if (status === 0) return "login.errorNetwork";
  if (status === 401) return "login.errorUnauthorized";
  if (status === 403) return "login.errorForbidden";
  return null;
}

export function loginFailureKey(error: unknown): string {
  if (!(error instanceof ApiError)) return "login.errorGeneric";

  return (
    FAILURE_KEYS[error.code] ??
    keyForStatus(error.status) ??
    "login.errorGeneric"
  );
}
