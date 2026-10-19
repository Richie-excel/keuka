import { useTranslation } from "react-i18next";
import { StatusBadge } from "@/components/status-badge";
import { SUBSCRIPTION_STATUS, TENANT_STATUS } from "@/shared/status";
import type { EnterpriseStatus, SubscriptionStatus } from "@/enums";

/**
 * The two tenancy statuses, rendered through the app's single status→tone
 * registry so a suspended plan is the same red here as everywhere else.
 *
 * WHY both live in one file: they appear side by side on the subscription page
 * (the company's status and the plan's status) and must never diverge visually.
 */
export function SubscriptionStatusBadge({
  status,
}: {
  status: SubscriptionStatus;
}) {
  const { t } = useTranslation();
  const config = SUBSCRIPTION_STATUS[status];
  return <StatusBadge label={t(config.labelKey, status)} tone={config.tone} />;
}

export function TenantStatusBadge({ status }: { status: EnterpriseStatus }) {
  const { t } = useTranslation();
  const config = TENANT_STATUS[status];
  return <StatusBadge label={t(config.labelKey, status)} tone={config.tone} />;
}
