import { useState } from "react";
import { useTranslation } from "react-i18next";
import { localizePlan } from "@/features/subscription/localize-plan";
import { Layers, Plus } from "lucide-react";
import type { PlanResponse } from "@/api/plans";
import { PermissionKey } from "@/enums";
import { PageHeader } from "@/shared/layout/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { DataPagination } from "@/components/pagination";
import { TableRowActions } from "@/components/table-row-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSkeleton } from "@/components/page-skeleton";
import { PAGE_SIZE } from "@/constants";
import { useAuth } from "@/shared/hooks/useAuth";
import { usePlans } from "@/shared/hooks/use-plans";
import { useApiErrorMessage } from "@/shared/hooks/use-api-error-message";
import { PlanComparison } from "@/features/subscription/plan-comparison";
import { PlanDialog } from "@/features/subscription/plan-dialog";
import { formatPlanPrice } from "@/features/subscription/plan-price";

type DialogState =
  | { mode: "create" }
  | { mode: "view" | "edit"; item: PlanResponse }
  | null;

export function PlansPage() {
  const { t, i18n } = useTranslation();
  const { hasPermission } = useAuth();

  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>(null);

  const plans = usePlans({ page, size: PAGE_SIZE });

  const canCreate = hasPermission(PermissionKey.TENANT_CREATE);
  const canEdit = hasPermission(PermissionKey.TENANT_UPDATE);
  const errorMessage = useApiErrorMessage(plans.error);

  const columns: Column<PlanResponse>[] = [
    {
      header: t("plans.fields.name"),
      cell: (row) => <span className="font-medium">{localizePlan(row, i18n.language).name}</span>,
    },
    {
      header: t("plans.fields.code"),
      cell: (row) => <span className="font-mono text-xs">{row.code}</span>,
      hideOnMobile: true,
    },
    {
      header: t("plans.fields.price"),
      cell: (row) => formatPlanPrice(row.priceAmount, row.currency),
    },
    {
      header: t("plans.fields.billingPeriod"),
      cell: (row) => t(`plans.billingPeriod.${row.billingPeriod}`),
    },
    {
      header: t("plans.fields.features"),
      cell: (row) => String(row.features.length),
      hideOnMobile: true,
    },
    {
      header: t("dashboard.status"),
      cell: (row) =>
        row.active ? t("plans.status.active") : t("plans.status.inactive"),
    },
  ];

  const rows = plans.data?.content ?? [];

  return (
    <div>
      <PageSkeleton loading={plans.isPending}>
      <div>
      <PageHeader
        title={t("plans.title")}
        description={t("plans.description")}
        icon={Layers}
        action={
          canCreate ? (
            <Button type="button" onClick={() => setDialog({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              {t("plans.createPlan")}
            </Button>
          ) : undefined
        }
      />

      {plans.isError ? (
        <p role="alert" className="py-8 text-center text-sm text-destructive">
          {errorMessage}
        </p>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.code}
            emptyTitle={t("plans.emptyTitle")}
            emptyDescription={t("plans.emptyDescription")}
            actionsLabel={t("plans.rowActions")}
            onRowClick={(row) => setDialog({ mode: "view", item: row })}
            rowActions={(row) => (
              <TableRowActions
                actionsLabel={t("plans.rowActions")}
                canView
                onView={() => setDialog({ mode: "view", item: row })}
                canEdit={canEdit}
                onEdit={() => setDialog({ mode: "edit", item: row })}
                labels={{
                  view: t("common.actions.view"),
                  edit: t("common.actions.edit"),
                  delete: t("common.actions.delete"),
                }}
              />
            )}
          />
          {plans.data && plans.data.totalPages > 1 && (
            <DataPagination
              page={page}
              pageCount={plans.data.totalPages}
              onPageChange={setPage}
            />
          )}

          {rows.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>{t("plans.compare.heading")}</CardTitle>
                <p className="text-xs text-cocoa-500">
                  {t("plans.compare.description")}
                </p>
              </CardHeader>
              <CardContent className="p-0 pb-2">
                <PlanComparison plans={rows} />
              </CardContent>
            </Card>
          )}
        </>
      )}
      </div>
      </PageSkeleton>

      {dialog && (
        <PlanDialog
          key={
            dialog.mode === "create"
              ? "create"
              : `${dialog.mode}-${dialog.item.code}`
          }
          open
          mode={dialog.mode}
          plan={dialog.mode === "create" ? undefined : dialog.item}
          canEdit={canEdit}
          onEdit={() =>
            dialog.mode !== "create" &&
            setDialog({ mode: "edit", item: dialog.item })
          }
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}
    </div>
  );
}
