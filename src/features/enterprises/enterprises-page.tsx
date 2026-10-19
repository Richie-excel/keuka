import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Building2, Plus, Warehouse as WarehouseIcon } from "lucide-react";
import type { EnterpriseResponse } from "@/api/enterprises";
import type { WarehouseSummary } from "@/api/warehouses";
import { PageHeader } from "@/shared/layout/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { DataPagination } from "@/components/pagination";
import { TableRowActions } from "@/components/table-row-actions";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";
import { PageSkeleton } from "@/components/page-skeleton";
import { PAGE_SIZE, WAREHOUSE_PAGE_SIZE } from "@/constants";
import { PermissionKey } from "@/enums";
import { useAuth } from "@/shared/hooks/useAuth";
import {
  useEnterprises,
  useListEnterpriseWarehouses,
} from "@/shared/hooks/use-enterprises";
import { EnterpriseDialog } from "@/features/enterprises/enterprise-dialog";
import { WarehouseDialog } from "@/features/enterprises/warehouse-dialog";

type DialogState =
  | { kind: "enterprise"; mode: "create" }
  | { kind: "enterprise"; mode: "view" | "edit"; item: EnterpriseResponse }
  | { kind: "warehouse"; mode: "create" }
  | { kind: "warehouse"; mode: "view" | "edit"; item: WarehouseSummary }
  | null;

/**
 * The enterprise (tenant) register, and the warehouses belonging to whichever
 * enterprise is selected.
 *
 * WHY the two live on one screen: a warehouse has no meaning outside its
 * enterprise — it is the scoping unit below the tenant, and cash sessions,
 * inventory and role scope are all expressed per warehouse. Splitting them
 * across two pages would mean picking an enterprise twice to answer one
 * question ("what does this company run?").
 *
 * The page follows the house pattern established by the users and permissions
 * screens: a `PageHeader` with an icon chip, a `DataTable` register with row
 * actions, then a bordered detail section underneath.
 *
 * The warehouse section lists the SELECTED enterprise's warehouses
 * (`GET /warehouses/enterprise/{id}/warehouses`). The plain `GET /warehouses`
 * would not do: for the platform operator it returns every company's warehouses.
 */
export function EnterprisesPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<EnterpriseResponse | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);

  const enterprises = useEnterprises({ page, size: PAGE_SIZE });
  // Warehouses are opened a handful of times per enterprise, not per day, so
  // the whole collection is asked for at once and paginated only if the server
  // surprises us.
  const warehouses = useListEnterpriseWarehouses(selected?.tenantId, {
    page: 1,
    size: WAREHOUSE_PAGE_SIZE,
  });

  const canCreateEnterprise = hasPermission(PermissionKey.TENANT_CREATE);
  const canEditEnterprise = hasPermission(PermissionKey.TENANT_UPDATE);
  const canReadWarehouses = hasPermission(PermissionKey.WAREHOUSE_READ);
  const canCreateWarehouse = hasPermission(PermissionKey.WAREHOUSE_CREATE);
  const canEditWarehouse = hasPermission(PermissionKey.WAREHOUSE_UPDATE);

  const enterpriseColumns: Column<EnterpriseResponse>[] = [
    {
      header: t("dashboard.company"),
      cell: (row) => <span className="font-medium">{row.displayName}</span>,
    },
    {
      header: t("dashboard.companyCode"),
      cell: (row) => row.companyCode,
    },
    {
      header: t("dashboard.enterprise.plan"),
      cell: (row) => row.planCode,
      hideOnMobile: true,
    },
    {
      header: t("dashboard.status"),
      cell: (row) => row.tenantStatus,
    },
    {
      header: t("dashboard.enterprise.access"),
      cell: (row) => (row.operationalAccess ? t("common.yes") : t("common.no")),
      hideOnMobile: true,
    },
  ];

  const warehouseColumns: Column<WarehouseSummary>[] = [
    { header: t("dashboard.warehouseCode"), cell: (row) => row.code },
    {
      header: t("dashboard.warehouse.name"),
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      header: t("dashboard.warehouse.location"),
      cell: (row) => row.location ?? "—",
      hideOnMobile: true,
    },
    {
      header: t("dashboard.status"),
      cell: (row) =>
        row.active
          ? t("dashboard.warehouse.active")
          : t("dashboard.warehouse.inactive"),
    },
  ];

  return (
    <div>
      <PageSkeleton loading={enterprises.isPending}>
      <div>
      <PageHeader
        title={t("enterprises.title")}
        description={t("enterprises.description")}
        icon={Building2}
        action={
          canCreateEnterprise ? (
            <Button onClick={() => setDialog({ kind: "enterprise", mode: "create" })}>
              <Plus />
              {t("dashboard.enterprise.createTitle")}
            </Button>
          ) : undefined
        }
      />

      {enterprises.isError ? (
        <p role="alert" className="py-8 text-center text-sm text-destructive">
          {enterprises.error.message}
        </p>
      ) : (
        <>
          <DataTable
            columns={enterpriseColumns}
            rows={enterprises.data?.content ?? []}
            rowKey={(row) => row.tenantId}
            emptyTitle={t("enterprises.emptyTitle")}
            emptyDescription={t("enterprises.emptyDescription")}
            actionsLabel={t("enterprises.rowActions")}
            onRowClick={setSelected}
            rowActions={(row) => (
              <TableRowActions
                actionsLabel={t("enterprises.rowActions")}
                canView
                onView={() => setDialog({ kind: "enterprise", mode: "view", item: row })}
                canEdit={canEditEnterprise}
                onEdit={() => setDialog({ kind: "enterprise", mode: "edit", item: row })}
                extraActions={[
                  {
                    id: "warehouses",
                    label: t("enterprises.viewWarehouses"),
                    icon: WarehouseIcon,
                    visible: canReadWarehouses,
                    onClick: () => setSelected(row),
                  },
                ]}
                labels={{
                  view: t("common.actions.view"),
                  edit: t("common.actions.edit"),
                  delete: t("common.actions.delete"),
                }}
              />
            )}
          />
          {enterprises.data && enterprises.data.totalPages > 1 && (
            <DataPagination
              page={page}
              pageCount={enterprises.data.totalPages}
              onPageChange={setPage}
            />
          )}

          {/* Detail section, mirroring the permissions screen's read-only block. */}
          <section className="mt-8 space-y-3 border-t border-cocoa-100 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-cocoa-900">
                  {selected
                    ? t("enterprises.warehousesFor", { name: selected.displayName })
                    : t("enterprises.warehousesHeading")}
                </h2>
                <p className="mt-1 max-w-2xl text-xs text-cocoa-500">
                  {t("enterprises.warehousesDescription")}
                </p>
              </div>
              {canCreateWarehouse && selected && (
                <Button
                  variant="outline"
                  onClick={() => setDialog({ kind: "warehouse", mode: "create" })}
                >
                  <Plus />
                  {t("dashboard.warehouse.createTitle")}
                </Button>
              )}
            </div>

            {!selected ? (
              <p className="text-sm text-cocoa-500">
                {t("enterprises.selectHint")}
              </p>
            ) : warehouses.isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-20 h-20"/>
              </div>
            ) : warehouses.isError ? (
              <p role="alert" className="py-4 text-sm text-destructive">
                {warehouses.error.message}
              </p>
            ) : (
              <DataTable
                columns={warehouseColumns}
                rows={warehouses.data.content}
                rowKey={(row) => row.id}
                emptyTitle={t("dashboard.noWarehouses")}
                emptyDescription={t("dashboard.noWarehousesDescription")}
                actionsLabel={t("enterprises.rowActions")}
                rowActions={(row) => (
                  <TableRowActions
                    actionsLabel={t("enterprises.rowActions")}
                    canView
                    onView={() => setDialog({ kind: "warehouse", mode: "view", item: row })}
                    canEdit={canEditWarehouse}
                    onEdit={() => setDialog({ kind: "warehouse", mode: "edit", item: row })}
                    labels={{
                      view: t("common.actions.view"),
                      edit: t("common.actions.edit"),
                      delete: t("common.actions.delete"),
                    }}
                  />
                )}
              />
            )}
          </section>
        </>
      )}
      </div>
      </PageSkeleton>

      {dialog?.kind === "enterprise" && (
        <EnterpriseDialog
          key={`${dialog.mode}-${"item" in dialog ? dialog.item.tenantId : "new"}`}
          open
          mode={dialog.mode}
          enterprise={"item" in dialog ? dialog.item : undefined}
          canEdit={canEditEnterprise}
          canManageStatus={canEditEnterprise}
          onEdit={() =>
            "item" in dialog &&
            setDialog({ kind: "enterprise", mode: "edit", item: dialog.item })
          }
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}
      {dialog?.kind === "warehouse" && (
        <WarehouseDialog
          key={`${dialog.mode}-${"item" in dialog ? dialog.item.id : "new"}`}
          open
          mode={dialog.mode}
          warehouse={"item" in dialog ? dialog.item : undefined}
          // The create form derives the warehouse code from the enterprise it
          // belongs to, so it needs the legal and display names of the row the
          // user is working with.
          enterprise={selected ?? undefined}
          canEdit={canEditWarehouse}
          onEdit={() =>
            "item" in dialog &&
            setDialog({ kind: "warehouse", mode: "edit", item: dialog.item })
          }
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}
    </div>
  );
}
