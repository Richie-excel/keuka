import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Banknote,
  Coins,
  HandCoins,
  Package,
  ReceiptText,
  Users2,
} from "lucide-react";
import { PermissionKey } from "@/enums";
import { purchasesApi } from "@/api/purchases";
import { prefinancesApi } from "@/api/prefinances";
import { deliveriesApi } from "@/api/deliveries";
import { inventoryApi } from "@/api/inventory";
import { cocoaPricesApi } from "@/api/cocoa-prices";
import { employeesApi } from "@/api/employees";
import { cashSessionsApi } from "@/api/cash-sessions";
import { qk } from "@/shared/hooks/query-keys";
import { useAuth } from "@/shared/hooks/useAuth";
import { CHART_COLORS } from "@/lib/chart-theme";
import {
  DASHBOARD_EMPLOYEE_SIZE,
  DASHBOARD_LIST_SIZE,
  DASHBOARD_MOVEMENT_SIZE,
  DASHBOARD_PRICE_HISTORY_SIZE,
} from "@/constants";
import {
  formatMoneyParts,
  formatWeightParts,
  localDateKey,
} from "@/lib/utils";
import { CashSessionStatus, DeliveryStatus } from "@/enums";
import type { SliceDatum } from "@/features/reporting/client-dashboard-charts";
import type { StatTile } from "@/features/reporting/client-dashboard-stats";

const LIST_PAGE = { page: 1, size: DASHBOARD_LIST_SIZE } as const;
const MOVEMENT_PAGE = { page: 1, size: DASHBOARD_MOVEMENT_SIZE } as const;
const PRICE_PAGE = { page: 1, size: DASHBOARD_PRICE_HISTORY_SIZE } as const;
const EMPLOYEE_PAGE = { page: 1, size: DASHBOARD_EMPLOYEE_SIZE } as const;

const DELIVERY_COLOR: Record<DeliveryStatus, string> = {
  LOADED: CHART_COLORS.cocoaMuted,
  IN_TRANSIT: CHART_COLORS.amber,
  DELIVERED: CHART_COLORS.pod,
  CANCELLED: CHART_COLORS.cocoa,
};

/**
 * Every fetch the client dashboard needs, gated by the permission that governs
 * it, plus the derived figures the cards draw.
 *
 * WHY a hook and not the component: the RBAC decisions (which tiles, charts and
 * lists a user may see) and the endpoint each one reads belong together. The
 * component then renders a plan it is handed instead of re-deciding access at
 * every JSX node, where one missed `enabled` would fire a request the server
 * would reject with 403.
 */
export function useClientDashboard() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const canReadPrices = hasPermission(PermissionKey.PRICE_READ);
  const canReadInventory = hasPermission(PermissionKey.INVENTORY_READ);
  const canReadCash = hasPermission(PermissionKey.CASH_SESSION_READ);
  const canReadPurchases = hasPermission(PermissionKey.PURCHASE_READ);
  const canReadPrefinance = hasPermission(PermissionKey.PREFINANCE_READ);
  const canReadDeliveries = hasPermission(PermissionKey.LOGISTICS_READ);
  const canReadEmployees = hasPermission(PermissionKey.EMPLOYEE_READ);

  const currentPrice = useQuery({
    queryKey: qk.cocoaPrices.current(),
    queryFn: cocoaPricesApi.current,
    enabled: canReadPrices,
  });
  const priceHistory = useQuery({
    queryKey: qk.cocoaPrices.list(PRICE_PAGE),
    queryFn: () => cocoaPricesApi.list(PRICE_PAGE),
    enabled: canReadPrices,
  });
  const inventoryBalance = useQuery({
    queryKey: qk.inventory.balance(),
    queryFn: () => inventoryApi.balance(),
    enabled: canReadInventory,
  });
  const stockMovements = useQuery({
    queryKey: qk.inventory.movements(MOVEMENT_PAGE),
    queryFn: () => inventoryApi.movements(MOVEMENT_PAGE),
    enabled: canReadInventory,
  });
  const purchases = useQuery({
    queryKey: qk.purchases.list(LIST_PAGE),
    queryFn: () => purchasesApi.list(LIST_PAGE),
    enabled: canReadPurchases,
  });
  // Totals come from the server: the list below is only the latest advances.
  const prefinanceSummary = useQuery({
    queryKey: qk.prefinances.summary(),
    queryFn: prefinancesApi.summary,
    enabled: canReadPrefinance,
  });
  const prefinances = useQuery({
    queryKey: qk.prefinances.list(LIST_PAGE),
    queryFn: () => prefinancesApi.list(LIST_PAGE),
    enabled: canReadPrefinance,
  });
  const deliveries = useQuery({
    queryKey: qk.deliveries.list(LIST_PAGE),
    queryFn: () => deliveriesApi.list(LIST_PAGE),
    enabled: canReadDeliveries,
  });
  const employees = useQuery({
    queryKey: qk.employees.list(EMPLOYEE_PAGE),
    queryFn: () => employeesApi.list(EMPLOYEE_PAGE),
    enabled: canReadEmployees,
  });
  const cashSessions = useQuery({
    queryKey: qk.cashSessions.list(LIST_PAGE),
    queryFn: () => cashSessionsApi.list(LIST_PAGE),
    enabled: canReadCash,
  });

  const purchaseRows = purchases.data?.content ?? [];
  const prefinanceRows = prefinances.data?.content ?? [];
  // Purchase dates are instants: compare and group by the LOCAL day.
  const today = localDateKey(new Date());

  const outstandingPayables = purchaseRows.filter(
    (purchase) => (purchase.payable?.status ?? "OPEN") !== "PAID",
  ).length;
  const salaryDue = (employees.data?.content ?? []).reduce(
    (sum, employee) => sum + (employee.salaryDue ?? 0),
    0,
  );
  const openCashSessions = (cashSessions.data?.content ?? []).filter(
    (session) => session.status === CashSessionStatus.OPEN,
  ).length;
  const buyersOwe = prefinanceSummary.data?.buyersOwe ?? 0;
  const buyersInDebt = prefinanceSummary.data?.buyersInDebt ?? 0;
  const companyOwesBuyers = prefinanceSummary.data?.companyOwesBuyers ?? 0;
  const todaysPurchases = purchaseRows
    .filter((purchase) => localDateKey(purchase.purchaseDate) === today)
    .reduce((sum, purchase) => sum + purchase.amount, 0);

  const purchaseTrend = [...new Set(purchaseRows.map((p) => localDateKey(p.purchaseDate)))]
    .sort()
    .slice(-14)
    .map((date) => ({
      date: date.slice(5),
      value: purchaseRows
        .filter((p) => localDateKey(p.purchaseDate) === date)
        .reduce((sum, p) => sum + p.amount, 0),
    }));

  const pricePoints = [...(priceHistory.data?.content ?? [])]
    .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))
    .map((entry) => ({
      date: localDateKey(entry.effectiveFrom).slice(5),
      price: entry.pricePerKg,
    }));

  const deliveryMix: SliceDatum[] = Object.values(DeliveryStatus).map(
    (status) => ({
      name: t(`status.delivery.${status}`, status),
      value: (deliveries.data?.content ?? []).filter(
        (delivery) => delivery.status === status,
      ).length,
      color: DELIVERY_COLOR[status],
    }),
  );

  const prefinanceBalances = prefinanceRows.slice(0, 8).map((item) => ({
    buyer: (item.buyerName ?? item.buyerId).slice(0, 10),
    advanced: item.amount,
    outstanding: item.outstandingAdvance,
  }));

  const tiles: StatTile[] = [];
  if (canReadPrices && currentPrice.data) {
    const price = formatMoneyParts(currentPrice.data.pricePerKg);
    tiles.push({
      key: "price",
      label: t("dashboard.currentPrice"),
      value: price.value,
      unit: `${price.unit}/${currentPrice.data.currency === "XAF" ? "kg" : currentPrice.data.currency}`,
      icon: Coins,
    });
  }
  if (canReadInventory && inventoryBalance.data) {
    tiles.push({
      key: "stock",
      label: t("dashboard.stockOnHand"),
      ...formatWeightParts(inventoryBalance.data.quantityKg),
      icon: Package,
    });
  }
  if (canReadPurchases) {
    tiles.push({
      key: "payables",
      label: t("dashboard.client.purchasesWaitingOnPayment"),
      value: String(outstandingPayables),
      icon: AlertCircle,
      tone: outstandingPayables ? "pending" : "positive",
      helper: t(
        outstandingPayables
          ? "dashboard.client.needsAttention"
          : "dashboard.client.allSettled",
      ),
    });
    tiles.push({
      key: "today",
      label: t("dashboard.client.todaysPurchases"),
      ...formatMoneyParts(todaysPurchases),
      icon: Banknote,
    });
  }
  if (canReadPrefinance) {
    tiles.push({
      key: "prefinance",
      label: t("dashboard.client.buyersStillOwing"),
      ...formatMoneyParts(buyersOwe),
      icon: Users2,
      tone: buyersOwe ? "pending" : "positive",
      helper: buyersInDebt
        ? t("dashboard.client.buyersInDebt", { count: buyersInDebt })
        : t("dashboard.client.allSettled"),
    });
    tiles.push({
      key: "owed-to-buyers",
      label: t("dashboard.client.companyOwesBuyers"),
      ...formatMoneyParts(companyOwesBuyers),
      icon: HandCoins,
      tone: companyOwesBuyers ? "negative" : "positive",
      helper: t(
        companyOwesBuyers
          ? "dashboard.client.companyOwesBuyersHint"
          : "dashboard.client.allSettled",
      ),
    });
  }
  if (canReadEmployees) {
    tiles.push({
      key: "salary",
      label: t("dashboard.salaryDue"),
      ...formatMoneyParts(salaryDue),
      icon: Users2,
      tone: salaryDue ? "pending" : "positive",
    });
  }
  if (canReadCash) {
    tiles.push({
      key: "cash",
      label: t("dashboard.openCashSessions"),
      value: String(openCashSessions),
      icon: ReceiptText,
    });
  }

  // A disabled query stays `isPending` forever, so each one only counts as
  // loading when the user may read it.
  const isLoading =
    (canReadPrices && (currentPrice.isPending || priceHistory.isPending)) ||
    (canReadInventory && (inventoryBalance.isPending || stockMovements.isPending)) ||
    (canReadPurchases && purchases.isPending) ||
    (canReadPrefinance && (prefinances.isPending || prefinanceSummary.isPending)) ||
    (canReadDeliveries && deliveries.isPending) ||
    (canReadEmployees && employees.isPending) ||
    (canReadCash && cashSessions.isPending);

  return {
    isLoading,
    flags: {
      canReadPrices,
      canReadInventory,
      canReadCash,
      canReadPurchases,
      canReadPrefinance,
      canReadDeliveries,
      canReadEmployees,
    },
    hasAnySection:
      canReadPurchases ||
      canReadInventory ||
      canReadPrefinance ||
      canReadDeliveries ||
      canReadPrices ||
      canReadEmployees ||
      canReadCash,
    tiles,
    purchaseTrend,
    pricePoints,
    deliveryMix,
    prefinanceBalances,
    purchases: purchaseRows.slice(0, 6),
    prefinances: prefinanceRows.slice(0, 6),
    movements: stockMovements.data?.content ?? [],
    stockKg: inventoryBalance.data?.quantityKg ?? 0,
  };
}