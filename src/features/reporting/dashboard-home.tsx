import { SystemRole } from "@/enums";
import { useAuth } from "@/shared/hooks/useAuth";
import { AdminDashboard } from "@/features/reporting/admin-dashboard";
import { ClientDashboard } from "@/features/reporting/client-dashboard";

/**
 * The `/dashboard` landing.
 *
 * WHICH screen a person gets is a role decision, not a data one: the platform
 * operator (`SYSTEM_ADMIN`) administers every tenant and lands on the admin
 * dashboard, while the BOSS and every warehouse-scoped user land on the client
 * dashboard, which is scoped to their own company and filtered to their
 * permissions. There is no shared "generic" dashboard, because the two answer
 * different questions.
 */
export function DashboardHome() {
  const { hasAnyRole } = useAuth();
  return hasAnyRole(SystemRole.SYSADMIN) ? <AdminDashboard /> : <ClientDashboard />;
}
