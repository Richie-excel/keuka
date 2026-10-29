import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings2 } from "lucide-react";
import { PermissionKey, type SubscriptionStatus } from "@/enums";
import type { EnterpriseResponse } from "@/api/enterprises";
import { useEnterprises } from "@/shared/hooks/use-enterprises";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data-table";
import Loader from "@/components/loader";
import { DataPagination } from "@/components/pagination";
import { formatDate } from "@/lib/utils";
import { PLATFORM_SUBSCRIPTIONS_PAGE_SIZE } from "@/constants";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/shared/hooks/useAuth";
import { EnterpriseDialog } from "@/features/enterprises/enterprise-dialog";
import {
  SubscriptionStatusBadge,
  TenantStatusBadge,
} from "@/features/subscription/subscription-status-badge";

/**
 * Subscriptions across every enterprise, read from the tenant register.
 *
 * WHY this exists: `GET /api/v1/subscription` answers only for the SIGNED-IN
 * tenant — it resolves the tenant from the request. A platform administrator
 * has no tenant of their own, so that endpoint returns 404 for them, and a
 * per-tenant subscription card reads as "no data" even though enterprises
 * plainly have plans. The register (`GET /enterprises`) carries each tenant's
 * `planCode`/`subscriptionStatus`, so it is the correct source for a
 * platform-wide view.
 *
 * Each row opens the company's dialog, where the operator changes its plan,
 * renews or suspends it — on the boss's behalf, e.g. once the company has paid.
 */
export function PlatformSubscriptions() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKey.TENANT_UPDATE);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{ mode: "view" | "edit"; item: EnterpriseResponse } | null>(null);
  const enterprises = useEnterprises({
    page,
    size: PLATFORM_SUBSCRIPTIONS_PAGE_SIZE,
  });

  const columns: Column<EnterpriseResponse>[] = [
    {
      header: t("subscription.company"),
      cell: (row) => (
        <span className="font-medium text-cocoa-900">{row.displayName}</span>
      ),
    },
    {
      header: t("subscription.companyCode"),
      cell: (row) => row.companyCode,
      hideOnMobile: true,
    },
    { header: t("subscription.plan"), cell: (row) => row.planCode },
    {
      header: t("subscription.subscriptionStatus"),
      cell: (row) => (
        <SubscriptionStatusBadge
          status={row.subscriptionStatus as SubscriptionStatus}
        />
      ),
    },
    {
      header: t("subscription.tenantStatus"),
      cell: (row) => <TenantStatusBadge status={row.tenantStatus} />,
      hideOnMobile: true,
    },
    {
      header: t("subscription.periodEnd"),
      cell: (row) =>
        row.currentPeriodEnd ? formatDate(row.currentPeriodEnd) : "—",
      hideOnMobile: true,
    },
    {
      header: t("subscription.operationalAccess"),
      cell: (row) =>
        row.operationalAccess
          ? t("subscription.granted")
          : t("subscription.blocked"),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("subscription.platform.heading")}</CardTitle>
        <p className="text-xs text-cocoa-500">
          {t("subscription.platform.description")}
        </p>
      </CardHeader>
      <CardContent>
        {enterprises.isPending ? (
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        ) : enterprises.isError ? (
          <p role="alert" className="py-4 text-sm text-destructive">
            {enterprises.error.message}
          </p>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={enterprises.data.content}
              rowKey={(row) => row.tenantId}
              emptyTitle={t("subscription.platform.emptyTitle")}
              emptyDescription={t("subscription.platform.emptyDescription")}
              actionsLabel={t("subscription.platform.actions")}
              onRowClick={(row) => setDialog({ mode: "view", item: row })}
              rowActions={(row) => (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setDialog({ mode: "view", item: row })}
                >
                  <Settings2 />
                  <span className="hidden sm:inline">{t("subscription.platform.manage")}</span>
                </Button>
              )}
            />
            <DataPagination
              page={page}
              pageCount={enterprises.data.totalPages}
              onPageChange={setPage}
              totalItems={enterprises.data.totalElements}
            />
          </>
        )}
      </CardContent>
      {dialog && (
        <EnterpriseDialog
          key={`${dialog.mode}-${dialog.item.tenantId}`}
          open
          mode={dialog.mode}
          enterprise={dialog.item}
          canEdit={canManage}
          canManageStatus={canManage}
          onEdit={() => setDialog({ mode: "edit", item: dialog.item })}
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}
    </Card>
  );
}
