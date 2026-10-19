import { useTranslation } from "react-i18next";
import type { SubscriptionResponse } from "@/api/subscription";
import { formatDate } from "@/lib/utils";
import {
  SubscriptionStatusBadge,
  TenantStatusBadge,
} from "@/features/subscription/subscription-status-badge";

/** One label/value pair. Local so the subscription screen owes nothing to a
 *  component that lives inside the enterprises feature. */
function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-cocoa-500">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-cocoa-900">
        {value}
      </dd>
    </div>
  );
}

/**
 * The read-only facts of the current subscription, exactly as the server
 * returns them. Nothing here is editable — activate/suspend are the only
 * writes the backend offers, and they live in the actions component.
 */
export function SubscriptionDetails({
  subscription,
}: {
  subscription: SubscriptionResponse;
}) {
  const { t } = useTranslation();

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Detail
        label={t("subscription.company")}
        value={subscription.displayName}
      />
      <Detail
        label={t("subscription.companyCode")}
        value={subscription.companyCode}
      />
      <Detail
        label={t("subscription.legalName")}
        value={subscription.legalName ?? "—"}
      />
      <Detail
        label={t("subscription.plan")}
        value={subscription.planCode}
      />
      <Detail
        label={t("subscription.tenantStatus")}
        value={<TenantStatusBadge status={subscription.tenantStatus} />}
      />
      <Detail
        label={t("subscription.subscriptionStatus")}
        value={
          <SubscriptionStatusBadge status={subscription.subscriptionStatus} />
        }
      />
      <Detail
        label={t("subscription.periodStart")}
        value={formatDate(subscription.currentPeriodStart)}
      />
      <Detail
        label={t("subscription.periodEnd")}
        value={
          subscription.currentPeriodEnd
            ? formatDate(subscription.currentPeriodEnd)
            : t("subscription.noEndDate")
        }
      />
      <Detail
        label={t("subscription.startedAt")}
        value={formatDate(subscription.startedAt)}
      />
      <Detail
        label={t("subscription.suspendedAt")}
        value={
          subscription.suspendedAt
            ? formatDate(subscription.suspendedAt)
            : t("subscription.notSuspended")
        }
      />
    </dl>
  );
}
