import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Package, Warehouse } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { DataPagination } from "@/components/pagination";
import { PageSkeleton } from "@/components/page-skeleton";
import { PageHeader } from "@/shared/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { useStockBalance, useStockMovements } from "@/shared/hooks/use-inventory";
import { formatWeight, formatDate } from "@/lib/utils";
import { PAGE_SIZE } from "@/constants";
import type { StockMovementResponse } from "@/interfaces";

export function InventoryPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const balance = useStockBalance();
  const movements = useStockMovements({ page, size: PAGE_SIZE });

  const columns: Column<StockMovementResponse>[] = [
    { header: t("inventory.movementType"), cell: (movement) => movement.type },
    {
      header: t("inventory.columnQuantity"),
      cell: (movement) => formatWeight(movement.quantityKg),
    },
    {
      header: t("inventory.movedAt"),
      cell: (movement) => formatDate(movement.movedAt),
      hideOnMobile: true,
    },
    {
      header: t("inventory.movementNotes"),
      cell: (movement) => movement.notes ?? movement.sourceType ?? "—",
      hideOnMobile: true,
    },
  ];

  return (
    <PageSkeleton loading={balance.isPending || movements.isPending}>
      <div>
        <PageHeader title={t("inventory.title")} icon={Package} />
        {balance.isError ? (
          <p role="alert" className="py-6 text-center text-sm text-destructive">
            {balance.error.message}
          </p>
        ) : (
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              label={t("inventory.totalStock")}
              value={formatWeight(balance.data?.quantityKg ?? 0)}
              icon={Warehouse}
            />
          </div>
        )}
        {movements.isError ? (
          <p role="alert" className="py-6 text-center text-sm text-destructive">
            {movements.error.message}
          </p>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={movements.data?.content ?? []}
              rowKey={(movement) => movement.id}
              emptyTitle={t("inventory.emptyTitle")}
              emptyDescription={t("inventory.emptyDescription")}
            />
            {movements.data && movements.data.totalPages > 1 && (
              <DataPagination
                page={page}
                pageCount={movements.data.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </PageSkeleton>
  );
}
