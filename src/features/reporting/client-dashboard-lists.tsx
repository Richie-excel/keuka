import { useTranslation } from "react-i18next";
import type {
  PrefinanceResponse,
  PurchaseResponse,
  StockMovementResponse,
} from "@/interfaces";
import { DashboardListCard } from "@/components/dashboard-list-card";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatMoney, formatWeight } from "@/lib/utils";
import { PAYABLE_STATUS, PREFINANCE_STATUS } from "@/shared/status";
import { DASHBOARD_CARD_PAGE_SIZE } from "@/constants";

/**
 * The list columns of the client dashboard. As with the charts, these receive
 * already-fetched rows and render them; the orchestrator owns both the fetch
 * and the RBAC gate, so a cashier without PAYMENT_READ never receives a
 * prefinance list to display.
 */

export function RecentPurchasesCard({
  purchases,
}: {
  purchases: PurchaseResponse[];
}) {
  const { t } = useTranslation();
  return (
    <DashboardListCard
      title={t("dashboard.client.recentPurchases")}
      items={purchases}
      keyExtractor={(purchase) => purchase.id}
      pageSize={DASHBOARD_CARD_PAGE_SIZE}
      emptyMessage={t("dashboard.client.noRecentPurchases")}
      renderItem={(purchase) => {
        // Only the payable status maps to a badge. A purchase with no payable
        // (none in practice) simply shows no badge rather than guessing — the
        // purchase status enum and the payable status enum are not the same set.
        const status = purchase.payable?.status;
        const config = status ? PAYABLE_STATUS[status] : undefined;
        return (
          <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium text-cocoa-900">
                {formatWeight(purchase.netWeight)} · {formatDate(purchase.purchaseDate)}
              </p>
              <p className="truncate text-cocoa-500">
                {purchase.farmerId ?? purchase.buyerId ?? "—"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-medium text-cocoa-900">
                {formatMoney(purchase.amount)}
              </span>
              {config && status && (
                <StatusBadge
                  label={t(config.labelKey, status)}
                  tone={config.tone}
                />
              )}
            </div>
          </div>
        );
      }}
    />
  );
}

export function BuyerPrefinanceCard({
  prefinances,
}: {
  prefinances: PrefinanceResponse[];
}) {
  const { t } = useTranslation();
  return (
    <DashboardListCard
      title={t("dashboard.client.buyerPrefinance")}
      items={prefinances}
      keyExtractor={(item) => item.id}
      pageSize={DASHBOARD_CARD_PAGE_SIZE}
      emptyMessage={t("dashboard.client.noBuyers")}
      renderItem={(item) => {
        const config = PREFINANCE_STATUS[item.status];
        return (
          <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium text-cocoa-900">
                {item.buyerName ?? item.buyerId}
              </p>
              <p className="truncate text-cocoa-500">
                {t("dashboard.client.advanced", {
                  amount: formatMoney(item.amount),
                })}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-medium text-cocoa-900">
                {item.outstandingAdvance > 0
                  ? formatMoney(item.outstandingAdvance)
                  : "—"}
              </p>
              {config && (
                <StatusBadge
                  label={t(config.labelKey, item.status)}
                  tone={config.tone}
                />
              )}
            </div>
          </div>
        );
      }}
    />
  );
}

export function StockMovementsCard({
  movements,
}: {
  movements: StockMovementResponse[];
}) {
  const { t } = useTranslation();
  return (
    <DashboardListCard
      title={t("dashboard.client.recentMovements")}
      items={movements}
      keyExtractor={(item) => item.id}
      pageSize={DASHBOARD_CARD_PAGE_SIZE}
      emptyMessage={t("dashboard.client.noMovements")}
      renderItem={(item) => (
        <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium text-cocoa-900">
              {t(`dashboard.client.movement.${item.type}`, item.type)}
            </p>
            <p className="truncate text-cocoa-500">{formatDate(item.movedAt)}</p>
          </div>
          <span className="shrink-0 font-medium text-cocoa-900">
            {formatWeight(item.quantityKg)}
          </span>
        </div>
      )}
    />
  );
}
