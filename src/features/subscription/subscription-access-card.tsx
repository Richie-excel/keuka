import { useTranslation } from "react-i18next";
import { CreditCard, ShieldCheck, ShieldX } from "lucide-react";
import type { SubscriptionResponse } from "@/api/subscription";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  SubscriptionStatusBadge,
  TenantStatusBadge,
} from "@/features/subscription/subscription-status-badge";
import { SubscriptionActions } from "@/features/subscription/subscription-actions";

/**
 * The headline of the subscription screen: is this company allowed to work
 * right now, and (for an administrator) the switch to change it.
 *
 * `operationalAccess` is read straight from the server rather than derived from
 * the two statuses, because the server owns that rule and this screen must show
 * the server's answer — not a second copy of it that could disagree.
 */
export function SubscriptionAccessCard({
  subscription,
  canManage,
}: {
  subscription: SubscriptionResponse;
  canManage: boolean;
}) {
  const { t } = useTranslation();
  const operational = subscription.operationalAccess;

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-lg",
                operational
                  ? "bg-pod-100 text-pod-700"
                  : "bg-rust-100 text-rust-700",
              )}
            >
              {operational ? (
                <ShieldCheck className="size-6" aria-hidden="true" />
              ) : (
                <ShieldX className="size-6" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-cocoa-900">
                  {subscription.planCode}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-sm bg-cocoa-100 px-2 py-0.5 text-xs font-medium text-cocoa-700">
                  <CreditCard className="size-3.5" aria-hidden="true" />
                  {subscription.companyCode}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <SubscriptionStatusBadge
                  status={subscription.subscriptionStatus}
                />
                <TenantStatusBadge status={subscription.tenantStatus} />
              </div>
              <p className="mt-3 max-w-prose text-sm text-cocoa-500">
                {operational
                  ? t("subscription.operationalHint")
                  : t("subscription.blockedHint")}
              </p>
            </div>
          </div>

          <SubscriptionActions
            subscription={subscription}
            canManage={canManage}
          />
        </div>
      </CardContent>
    </Card>
  );
}
