import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Building2, Info, Pencil, Plus } from "lucide-react";
import type { WarehouseSummary } from "@/api/warehouses";
import { PageHeader } from "@/shared/layout/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { TableRowActions } from "@/components/table-row-actions";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/page-skeleton";
import { WAREHOUSE_PAGE_SIZE } from "@/constants";
import { PermissionKey, SystemRole } from "@/enums";
import { useAuth } from "@/shared/hooks/useAuth";
import { useSubscription } from "@/shared/hooks/use-subscription";
import { useWarehouses } from "@/shared/hooks/use-warehouses";
import { useApiErrorMessage } from "@/shared/hooks/use-api-error-message";
import { Detail } from "@/features/enterprises/detail-list";
import { WarehouseDialog } from "@/features/enterprises/warehouse-dialog";
import { CompanyContactDialog } from "@/features/enterprises/company-contact-dialog";

type WarehouseDialogState =
  | { mode: "create" }
  | { mode: "view" | "edit"; item: WarehouseSummary }
  | null;

/**
 * The enterprise console for a company's own staff — the Boss and anyone else
 * trusted with `WAREHOUSE_*`.
 *
 * WHY THIS EXISTS SEPARATELY FROM `enterprises-page.tsx` — that screen is the
 * PLATFORM register: it reads `GET /enterprises`, which is guarded by the
 * platform-only `TENANT_READ`, and it can create, suspend and reactivate whole
 * companies. A Boss holds no `TENANT_*` authority at all (by design — those
 * permissions reach across every tenant on the server), so the register was
 * invisible to the very person who runs a company. That is the gap this page
 * closes: it shows the ONE enterprise the session already belongs to, and lets
 * its owner manage the warehouses inside it.
 *
 * WHERE THE ENTERPRISE'S OWN DETAILS COME FROM — `GET /subscription`. It is the
 * only endpoint that returns the current tenant's `displayName`, `legalName` and
 * `companyCode` to an ordinary authenticated user, with no platform authority
 * required. Nothing here can read or touch another company, because the server
 * resolves the tenant from the session rather than from anything this page sends.
 */
export function MyEnterprisePage() {
  const { t } = useTranslation();
  const { hasPermission, hasAnyRole } = useAuth();
  const [dialog, setDialog] = useState<WarehouseDialogState>(null);
  const [contactOpen, setContactOpen] = useState(false);
  // The letterhead contact details are the company's to set: its boss.
  const canEditContact = hasAnyRole(SystemRole.BOSS);

  const subscription = useSubscription();
  const warehouses = useWarehouses({ page: 1, size: WAREHOUSE_PAGE_SIZE });

  const canCreateWarehouse = hasPermission(PermissionKey.WAREHOUSE_CREATE);
  const canEditWarehouse = hasPermission(PermissionKey.WAREHOUSE_UPDATE);

  const subscriptionError = useApiErrorMessage(subscription.error);
  const warehousesError = useApiErrorMessage(warehouses.error);

  const columns: Column<WarehouseSummary>[] = [
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
      <PageSkeleton loading={subscription.isPending || warehouses.isPending}>
      <div>
      <PageHeader
        title={t("enterprises.myTitle")}
        description={t("enterprises.myDescription")}
        icon={Building2}
        action={
          canCreateWarehouse && (
            <Button
              type="button"
              onClick={() => setDialog({ mode: "create" })}
              className="mb-4 gap-2"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("dashboard.warehouse.createTitle")}
            </Button>
          )
        }
      />

      <section className="rounded-xl border border-cocoa-100 bg-white p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-cocoa-900">
          {t("enterprises.identityHeading")}
        </h2>
        <p className="mt-1 max-w-2xl text-xs text-cocoa-500">
          {t("enterprises.identityDescription")}
        </p>

        {subscription.isPending ? (
          // Stand-in rows the skeleton is measured from until the record arrives.
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Detail key={index} label={t("dashboard.enterprise.displayName")} value="—" />
            ))}
          </dl>
        ) : subscription.isError ? (
          <p role="alert" className="py-4 text-sm text-destructive">
            {subscriptionError}
          </p>
        ) : (
          <>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Detail
                label={t("dashboard.enterprise.displayName")}
                value={subscription.data.displayName}
              />
              <Detail
                label={t("dashboard.enterprise.legalName")}
                value={subscription.data.legalName ?? "—"}
              />
              <Detail
                label={t("dashboard.enterprise.companyCode")}
                value={subscription.data.companyCode}
              />
              <Detail
                label={t("dashboard.enterprise.plan")}
                value={subscription.data.planCode}
              />
              <Detail
                label={t("dashboard.enterprise.subscriptionStatus")}
                value={t(
                  `status.subscription.${subscription.data.subscriptionStatus}`,
                  subscription.data.subscriptionStatus,
                )}
              />
              <Detail
                label={t("dashboard.enterprise.tenantStatus")}
                value={t(
                  `status.tenant.${subscription.data.tenantStatus}`,
                  subscription.data.tenantStatus,
                )}
              />
            </dl>

            {!subscription.data.operationalAccess && (
              <p className="mt-4 flex items-start gap-2 rounded-md bg-amber-100 px-3 py-2.5 text-xs text-amber-700">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {t("enterprises.noOperationalAccess")}
              </p>
            )}

            <div className="mt-6 border-t border-cocoa-100 pt-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-cocoa-900">
                    {t("enterprises.contact.heading")}
                  </h3>
                  <p className="mt-1 max-w-2xl text-xs text-cocoa-500">
                    {t("enterprises.contact.description")}
                  </p>
                </div>
                {canEditContact && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setContactOpen(true)}>
                    <Pencil className="size-4" aria-hidden="true" />
                    {t("enterprises.contact.edit")}
                  </Button>
                )}
              </div>
              <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <Detail label={t("enterprises.contact.address")} value={subscription.data.address || "—"} />
                <Detail label={t("enterprises.contact.phone")} value={subscription.data.phone || "—"} />
                <Detail label={t("enterprises.contact.email")} value={subscription.data.email || "—"} />
              </dl>
            </div>
          </>
        )}
      </section>

      <section className="mt-8 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-cocoa-900">
              {t("enterprises.myWarehousesHeading")}
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-cocoa-500">
              {t("enterprises.myWarehousesDescription")}
            </p>
          </div>
          {canCreateWarehouse && (
            <Button
              variant="outline"
              onClick={() => setDialog({ mode: "create" })}
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("dashboard.warehouse.createTitle")}
            </Button>
          )}
        </div>

        {warehouses.isError ? (
          <p role="alert" className="py-4 text-sm text-destructive">
            {warehousesError}
          </p>
        ) : (
          <DataTable
            columns={columns}
            rows={warehouses.data?.content ?? []}
            rowKey={(row) => row.id}
            emptyTitle={t("dashboard.noWarehouses")}
            emptyDescription={t("enterprises.myWarehousesEmpty")}
            actionsLabel={t("enterprises.rowActions")}
            rowActions={(row) => (
              <TableRowActions
                actionsLabel={t("enterprises.rowActions")}
                canView
                onView={() => setDialog({ mode: "view", item: row })}
                canEdit={canEditWarehouse}
                onEdit={() => setDialog({ mode: "edit", item: row })}
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
      </div>
      </PageSkeleton>

      {subscription.data && canEditContact && (
        <CompanyContactDialog
          open={contactOpen}
          onOpenChange={setContactOpen}
          company={subscription.data}
        />
      )}

      {dialog && (
        <WarehouseDialog
          key={dialog.mode === "create" ? "create" : dialog.item.id}
          open
          mode={dialog.mode}
          warehouse={dialog.mode === "create" ? undefined : dialog.item}
          // The create form derives the warehouse code from the enterprise's own
          // names, so the identity read above is what feeds it. Until that has
          // arrived there is nothing to derive from, and the dialog is not
          // reachable anyway because the button needs a settled session.
          enterprise={subscription.data}
          canEdit={canEditWarehouse}
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
