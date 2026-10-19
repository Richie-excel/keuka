import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { SystemRole } from "@/enums";
import { useAuth } from "@/shared/hooks/useAuth";
import { PageHeader } from "@/shared/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { PageSkeleton } from "@/components/page-skeleton";
import { ClientStatGrid } from "@/features/reporting/client-dashboard-stats";
import {
  DeliveryStatusCard,
  PrefinanceBalancesCard,
  PriceHistoryCard,
  PurchaseTrendCard,
  StockBalanceCard,
} from "@/features/reporting/client-dashboard-charts";
import {
  BuyerPrefinanceCard,
  RecentPurchasesCard,
  StockMovementsCard,
} from "@/features/reporting/client-dashboard-lists";
import { useClientDashboard } from "@/features/reporting/use-client-dashboard";
import { DashboardQuickActions } from "@/features/reporting/dashboard-quick-actions";
import { AnalysisFab } from "@/features/analysis/analysis-fab";

/**
 * The client dashboard — where the BOSS and every warehouse-scoped user lands
 * after signing in.
 *
 * HIGHLY RBAC: every tile, chart and list is gated on the permission that
 * governs its endpoint, and the gating lives in `useClientDashboard` so a card
 * cannot be rendered without its data having been fetched with the right
 * authority (or skipped without it). A BUYER sees prices, purchases and
 * prefinance; a CASHIER sees the till; a BOSS sees all of it. A user with none
 * of these reads gets an explicit empty state rather than an empty page.
 */
export function ClientDashboard() {
  const { t } = useTranslation();
  const { user, hasAnyRole } = useAuth();
  const dashboard = useClientDashboard();
  const { flags } = dashboard;
  const navigate = useNavigate();

  const greetingKey = hasAnyRole(SystemRole.BOSS)
    ? "dashboard.greetingBoss"
    : hasAnyRole(SystemRole.CASHIER)
      ? "dashboard.greetingCashier"
      : "dashboard.greetingFinSec";

  const showCharts =
    flags.canReadPurchases ||
    flags.canReadPrices ||
    flags.canReadInventory ||
    flags.canReadDeliveries ||
    flags.canReadPrefinance;

  const showLists =
    flags.canReadPurchases || flags.canReadPrefinance || flags.canReadInventory;

  return (
    <>
    <PageSkeleton loading={dashboard.isLoading}>
      <div className="space-y-6">
        <PageHeader
          title={t("dashboard.welcome", {
            name: user?.fullName.split(" ")[0] ?? "",
          })}
          description={t(greetingKey)}
          icon={Building2}
          action={<DashboardQuickActions />}
        />

        {!dashboard.hasAnySection ? (
          <EmptyState
            icon={Building2}
            title={t("dashboard.client.noAccessTitle")}
            description={t("dashboard.client.noAccessDescription")}
          />
        ) : (
          <>
            <ClientStatGrid tiles={dashboard.tiles} />

            {showCharts && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {flags.canReadPurchases &&
                  dashboard.purchaseTrend.length > 0 && (
                    <PurchaseTrendCard data={dashboard.purchaseTrend} />
                  )}
                {flags.canReadPrices && dashboard.pricePoints.length > 0 && (
                  <PriceHistoryCard data={dashboard.pricePoints} />
                )}
                {flags.canReadInventory && (
                  <StockBalanceCard quantityKg={dashboard.stockKg} />
                )}
                {flags.canReadDeliveries &&
                  dashboard.deliveryMix.some((slice) => slice.value > 0) && (
                    <DeliveryStatusCard data={dashboard.deliveryMix} />
                  )}
                {flags.canReadPrefinance &&
                  dashboard.prefinanceBalances.length > 0 && (
                    <PrefinanceBalancesCard
                      data={dashboard.prefinanceBalances}
                    />
                  )}
              </div>
            )}

            {showLists && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {flags.canReadPurchases && (
                  <RecentPurchasesCard purchases={dashboard.purchases} />
                )}
                {flags.canReadPrefinance && (
                  <BuyerPrefinanceCard prefinances={dashboard.prefinances} />
                )}
                {flags.canReadInventory && (
                  <StockMovementsCard movements={dashboard.movements} />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PageSkeleton>

    {/* The BOSS launches the AI analysis from here too: it opens the analysis page writing. */}
    {hasAnyRole(SystemRole.BOSS) && (
      <AnalysisFab
        title={t("analysis.report.write")}
        description={t("analysis.report.fabTooltip", { count: 30 })}
        onLaunch={() => navigate("/analysis?write=1")}
      />
    )}
    </>
  );
}
