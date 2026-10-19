import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusCircle, TrendingUp } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { DataPagination } from "@/components/pagination";
import { PageHeader } from "@/shared/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { PageSkeleton } from "@/components/page-skeleton";
import {
  useCocoaPrices,
  useCurrentCocoaPrice,
  usePublishCocoaPrice,
} from "@/shared/hooks/use-cocoa-prices";
import { formatDate, formatMoney } from "@/lib/utils";
import type { CocoaPriceResponse } from "@/interfaces";
import { useAuth } from "@/shared/hooks/useAuth";
import { useApiErrorMessage } from "@/shared/hooks/use-api-error-message";
import { PermissionKey } from "@/enums";
import { Button } from "@/components/ui/button";
import { useUiFlag } from "@/store/ui-store";
import { PricingDialog } from "./pricing-dialog";
import { PAGE_SIZE } from "@/constants";

export function PricingPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const query = useCocoaPrices({ page, size: PAGE_SIZE });
  const { hasPermission } = useAuth();

  const canCreate = hasPermission(PermissionKey.PRICE_CREATE);

  const currentPrice = useCurrentCocoaPrice();
  const createPrice = usePublishCocoaPrice();
  const dialog = useUiFlag("pricing.dialog", { resetOnUnmount: true });

  const listError = useApiErrorMessage(query.error);

  const columns: Column<CocoaPriceResponse>[] = [
    {
      header: t("pricing.columnPricePerKg"),
      cell: (price) => formatMoney(price.pricePerKg),
    },
    {
      header: t("pricing.columnEffectiveFrom"),
      cell: (price) => formatDate(price.effectiveFrom),
      hideOnMobile: true,
    },
    {
      header: t("pricing.columnStatus"),
      cell: (price) => t(`status.price.${price.status}`, price.status),
    },
    {
      header: t("pricing.columnSetBy"),
      cell: (price) => price.setBy ?? "—",
      hideOnMobile: true,
    },
  ];

  return (
    <div>
      <PageSkeleton loading={query.isPending || currentPrice.isPending}>
      <div>
      <PageHeader
        title={t("pricing.title")}
        description={t("pricing.description")}
        icon={TrendingUp}
        action={
          canCreate && (
            <Button
              type="button"
              onClick={() => dialog.set(true)}
              className="mb-4 gap-2"
            >
              <PlusCircle className="size-4" aria-hidden="true" />
              {t("pricing.publishPriceAction")}
            </Button>
          )
        }
      />

      {(currentPrice.isSuccess || currentPrice.isPending) && (
        <div className="mb-4 max-w-sm">
          <StatCard
            label={t("pricing.currentPriceCard")}
            value={formatMoney(currentPrice.data?.pricePerKg ?? 0)}
            icon={TrendingUp}
          />
        </div>
      )}

      {query.isError ? (
        <p role="alert" className="py-8 text-center text-sm text-destructive">
          {listError}
        </p>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={query.data?.content ?? []}
            rowKey={(price) => price.id}
            emptyTitle={t("pricing.emptyTitle")}
            emptyDescription={t("pricing.emptyDescription")}
          />
          {query.data && query.data.totalPages > 1 && (
            <DataPagination
              page={page}
              pageCount={query.data.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
      </div>
      </PageSkeleton>

      <PricingDialog
        open={dialog.value}
        onOpenChange={dialog.set}
        currentPrice={currentPrice.data ?? null}
        publishing={createPrice.isPending}
        onPublish={(request) => createPrice.submitAsync(request)}
      />
    </div>
  );
}
