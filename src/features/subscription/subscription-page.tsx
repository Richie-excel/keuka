import { useTranslation } from "react-i18next";
import { CreditCard, Info } from "lucide-react";
import { PermissionKey, SystemRole } from "@/enums";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/shared/hooks/useAuth";
import { useSubscription } from "@/shared/hooks/use-subscription";
import { PageHeader } from "@/shared/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { PageSkeleton } from "@/components/page-skeleton";
import { SubscriptionAccessCard } from "@/features/subscription/subscription-access-card";
import { SubscriptionDetails } from "@/features/subscription/subscription-details";
import { SubscriptionTimeline } from "@/features/subscription/subscription-timeline";
import { PlatformSubscriptions } from "@/features/subscription/platform-subscriptions";
import { MyPlanCard } from "@/features/subscription/my-plan-card";

export function SubscriptionPage() {
  const { t } = useTranslation();
  const { hasPermission, hasAnyRole } = useAuth();
  const subscription = useSubscription();

  const canManage = hasAnyRole(SystemRole.SYSADMIN);
  const canReadEnterprises = hasPermission(PermissionKey.TENANT_READ);

  const isMissing =
    subscription.error instanceof ApiError && subscription.error.status === 404;
  const showPlatformView = isMissing && canReadEnterprises;

  return (
    <PageSkeleton loading={subscription.isPending}>
    <div className="space-y-6">
      <PageHeader
        title={t("subscription.title")}
        description={t("subscription.description")}
        icon={CreditCard}
      />

      {subscription.isPending ? (
        // Stand-in blocks the skeleton is measured from until the record arrives.
        <div className="space-y-4">
          <div data-skeleton-role="image" className="h-24 rounded-xl" />
          <div className="grid gap-4 lg:grid-cols-3">
            <div data-skeleton-role="image" className="h-48 rounded-xl lg:col-span-2" />
            <div data-skeleton-role="image" className="h-48 rounded-xl" />
          </div>
        </div>
      ) : subscription.isError ? (
        showPlatformView ? (
          <>
            <p className="flex items-start gap-2 rounded-md bg-amber-100 px-3 py-2.5 text-xs text-amber-700">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {t("subscription.platform.noTenant")}
            </p>
            <PlatformSubscriptions />
          </>
        ) : isMissing ? (
          <EmptyState
            icon={CreditCard}
            title={t("subscription.emptyTitle")}
            description={t("subscription.emptyDescription")}
          />
        ) : (
          <p role="alert" className="py-8 text-center text-sm text-destructive">
            {subscription.error.message}
          </p>
        )
      ) : (
        <>
          <SubscriptionAccessCard
            subscription={subscription.data}
            canManage={canManage}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t("subscription.detailsHeading")}</CardTitle>
              </CardHeader>
              <CardContent>
                <SubscriptionDetails subscription={subscription.data} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <SubscriptionTimeline subscription={subscription.data} />
              </CardContent>
            </Card>
          </div>

          <MyPlanCard planCode={subscription.data.planCode} />

          <p className="text-xs text-cocoa-500">
            {t("subscription.serverNote")}
          </p>
        </>
      )}
    </div>
    </PageSkeleton>
  );
}
