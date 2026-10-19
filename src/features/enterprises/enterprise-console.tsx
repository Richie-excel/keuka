import { PermissionKey } from "@/enums";
import { useAuth } from "@/shared/hooks/useAuth";
import { EnterprisesPage } from "@/features/enterprises/enterprises-page";
import { MyEnterprisePage } from "@/features/enterprises/my-enterprise-page";

/**
 * One URL (`/enterprises`), two screens — the same shape `/dashboard` already
 * uses for its admin/client split.
 *
 * WHY it is not two routes: both answer the same question ("what does this
 * company run?"), and both want the same sidebar entry. Two entries would show
 * a Boss a link they cannot open, or show the platform operator two near-identical
 * tabs. The choice is a permission question, not a data one:
 *
 *  - `TENANT_READ` — the platform-only authority behind `GET /enterprises`.
 *    Whoever holds it administers every tenant and gets the full register.
 *  - otherwise — the user is staff of one company. The server tells them which
 *    company they are through `GET /subscription`; they manage that one.
 */
export function EnterpriseConsole() {
  const { hasPermission } = useAuth();

  return hasPermission(PermissionKey.TENANT_READ) ? (
    <EnterprisesPage />
  ) : (
    <MyEnterprisePage />
  );
}
