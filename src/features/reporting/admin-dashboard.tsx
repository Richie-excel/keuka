import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRight,
  Building2,
  Plus,
  ShieldCheck,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { AuditEvent, PageParams, PageResponse } from "@/interfaces";
import { PermissionKey } from "@/enums";
import { auditApi } from "@/api/audit";
import { qk } from "@/shared/hooks/query-keys";
import { useAuth } from "@/shared/hooks/useAuth";
import { useEnterprises } from "@/shared/hooks/use-enterprises";
import { useWarehouses } from "@/shared/hooks/use-warehouses";
import { PageHeader } from "@/shared/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { DataTable, type Column } from "@/components/data-table";
import { TableRowActions } from "@/components/table-row-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSkeleton } from "@/components/page-skeleton";
import { ADMIN_DASHBOARD_PAGE_SIZE } from "@/constants";
import type { EnterpriseResponse } from "@/api/enterprises";
import type { WarehouseSummary } from "@/api/warehouses";
import { EnterpriseDialog } from "@/features/enterprises/enterprise-dialog";
import { WarehouseDialog } from "@/features/enterprises/warehouse-dialog";
import { PlatformSubscriptions } from "@/features/subscription/platform-subscriptions";
import { formatDateTime } from "@/lib/utils";

const FIRST_PAGE: PageParams = { page: 1, size: ADMIN_DASHBOARD_PAGE_SIZE };

type AdminDialog =
  | { kind: "enterprise"; mode: "create" }
  | { kind: "enterprise"; mode: "view" | "edit"; item: EnterpriseResponse }
  | { kind: "warehouse"; mode: "create" }
  | { kind: "warehouse"; mode: "view" | "edit"; item: WarehouseSummary }
  | null;

/**
 * The admin dashboard — the platform operator's landing, for SYSTEM_ADMIN.
 *
 * Its remit is every TENANT on the server, not the day-to-day operations of
 * one: the enterprise register, the warehouses beneath it, the subscription and
 * the audit trail. Operational figures (purchases, stock, payables) belong to
 * the CLIENT dashboard, because an enterprise user is scoped to their own
 * company while this screen is scoped to the platform.
 */
export function AdminDashboard() {
  const { t } = useTranslation();
  const { user, hasPermission } = useAuth();
  const [dialog, setDialog] = useState<AdminDialog>(null);

  const canReadEnterprises = hasPermission(PermissionKey.TENANT_READ);
  const canReadWarehouses = hasPermission(PermissionKey.WAREHOUSE_READ);
  const canReadAudit = hasPermission(PermissionKey.AUDIT_READ);

  const enterprises = useEnterprises(FIRST_PAGE, canReadEnterprises);
  const warehouses = useWarehouses(FIRST_PAGE, canReadWarehouses);
  const audit = useQuery<PageResponse<AuditEvent>>({
    queryKey: qk.audit.list(FIRST_PAGE),
    queryFn: () => auditApi.list(FIRST_PAGE),
    enabled: canReadAudit,
  });

  // A disabled query stays `isPending` forever, so each one only counts as
  // loading when the user may read it.
  const loading =
    (canReadEnterprises && enterprises.isPending) ||
    (canReadWarehouses && warehouses.isPending) ||
    (canReadAudit && audit.isPending);

  const actions = (
    <div className="flex flex-wrap gap-2">
      {hasPermission(PermissionKey.TENANT_CREATE) && (
        <Button
          size="sm"
          onClick={() => setDialog({ kind: "enterprise", mode: "create" })}
        >
          <Plus />
          {t("dashboard.enterprise.createTitle")}
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageSkeleton loading={loading}>
        <div className="space-y-6">
          <PageHeader
            title={t("dashboard.admin.title", {
              name: user?.fullName.split(" ")[0] ?? "",
            })}
            description={t("dashboard.admin.description")}
            icon={ShieldCheck}
            action={
              hasPermission(PermissionKey.TENANT_CREATE) ||
              hasPermission(PermissionKey.WAREHOUSE_CREATE)
                ? actions
                : undefined
            }
          />

          <section
            aria-label={t("dashboard.admin.title", { name: "" })}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {canReadEnterprises && (
              <StatCard
                label={t("dashboard.enterprises")}
                value={
                  enterprises.data
                    ? String(enterprises.data.totalElements)
                    : "…"
                }
                icon={Building2}
              />
            )}
            {canReadWarehouses && (
              <StatCard
                label={t("dashboard.warehouses")}
                value={
                  warehouses.data ? String(warehouses.data.totalElements) : "…"
                }
                icon={WarehouseIcon}
              />
            )}
          </section>

          {/* The per-tenant subscription endpoint answers only for a signed-in
          company, and a platform admin has none — so the admin sees every
          company's plan here, read from the enterprise register. */}
          {canReadEnterprises && <PlatformSubscriptions />}

          {canReadEnterprises && (
            <AdminSection
              title={t("dashboard.enterprises")}
              error={enterprises.error?.message}
              link={{
                to: "/enterprises",
                label: t("dashboard.admin.openEnterprises"),
              }}
            >
              <DataTable
                columns={enterpriseColumns(t)}
                rows={enterprises.data?.content ?? []}
                rowKey={(item) => item.tenantId}
                emptyTitle={t("dashboard.noEnterprises")}
                emptyDescription={t("dashboard.noEnterprisesDescription")}
                rowActions={(item) => (
                  <TableRowActions
                    labels={{
                      view: t("common.actions.view"),
                      edit: t("common.actions.edit"),
                      delete: t("common.actions.delete"),
                    }}
                    canView
                    onView={() =>
                      setDialog({ kind: "enterprise", mode: "view", item })
                    }
                    canEdit={hasPermission(PermissionKey.TENANT_UPDATE)}
                    onEdit={() =>
                      setDialog({ kind: "enterprise", mode: "edit", item })
                    }
                  />
                )}
              />
            </AdminSection>
          )}

          {canReadWarehouses && (
            <AdminSection
              title={t("dashboard.warehouses")}
              error={warehouses.error?.message}
            >
              <DataTable
                columns={warehouseColumns(t)}
                rows={warehouses.data?.content ?? []}
                rowKey={(item) => item.id}
                emptyTitle={t("dashboard.noWarehouses")}
                emptyDescription={t("dashboard.noWarehousesDescription")}
                rowActions={(item) => (
                  <TableRowActions
                    labels={{
                      view: t("common.actions.view"),
                      edit: t("common.actions.edit"),
                      delete: t("common.actions.delete"),
                    }}
                    canView
                    onView={() =>
                      setDialog({ kind: "warehouse", mode: "view", item })
                    }
                    canEdit={hasPermission(PermissionKey.WAREHOUSE_UPDATE)}
                    onEdit={() =>
                      setDialog({ kind: "warehouse", mode: "edit", item })
                    }
                  />
                )}
              />
            </AdminSection>
          )}

          {canReadAudit && (
            <AdminSection
              title={t("dashboard.auditEvents")}
              error={audit.error?.message}
              link={{ to: "/audit", label: t("dashboard.openAudit") }}
            >
              <DataTable
                columns={auditColumns(t)}
                rows={audit.data?.content ?? []}
                rowKey={(item) => item.id}
                emptyTitle={t("audit.emptyTitle")}
                emptyDescription={t("audit.emptyDescription")}
              />
            </AdminSection>
          )}
        </div>
      </PageSkeleton>

      {dialog?.kind === "enterprise" && (
        <EnterpriseDialog
          key={`${dialog.mode}-${"item" in dialog ? dialog.item.tenantId : "new"}`}
          open
          mode={dialog.mode}
          enterprise={"item" in dialog ? dialog.item : undefined}
          canEdit={hasPermission(PermissionKey.TENANT_UPDATE)}
          canManageStatus={hasPermission(PermissionKey.TENANT_UPDATE)}
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
          canEdit={hasPermission(PermissionKey.WAREHOUSE_UPDATE)}
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

function AdminSection({
  title,
  error,
  link,
  children,
}: {
  title: string;
  error?: string;
  link?: { to: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p role="alert" className="py-4 text-sm text-destructive">
            {error}
          </p>
        ) : (
          children
        )}
        {link && !error && (
          <Link
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-cocoa-700 hover:text-cocoa-900"
            to={link.to}
          >
            {link.label}
            <ArrowUpRight className="size-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function enterpriseColumns(
  t: (key: string) => string,
): Column<EnterpriseResponse>[] {
  return [
    { header: t("dashboard.companyCode"), cell: (row) => row.companyCode },
    { header: t("dashboard.company"), cell: (row) => row.displayName },
    { header: t("dashboard.enterprise.plan"), cell: (row) => row.planCode },
    { header: t("dashboard.status"), cell: (row) => row.tenantStatus },
  ];
}

function warehouseColumns(
  t: (key: string) => string,
): Column<WarehouseSummary>[] {
  return [
    { header: t("dashboard.warehouseCode"), cell: (row) => row.code },
    { header: t("dashboard.warehouse.name"), cell: (row) => row.name },
    {
      header: t("dashboard.status"),
      cell: (row) =>
        row.active
          ? t("dashboard.warehouse.active")
          : t("dashboard.warehouse.inactive"),
    },
  ];
}

function auditColumns(t: (key: string) => string): Column<AuditEvent>[] {
  return [
    { header: t("dashboard.action"), cell: (row) => row.action },
    { header: t("dashboard.actor"), cell: (row) => row.actorUsername ?? "—" },
    {
      header: t("dashboard.date"),
      cell: (row) =>
        formatDateTime(row.createdAt),
      hideOnMobile: true,
    },
  ];
}
