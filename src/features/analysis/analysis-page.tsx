import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Banknote,
  BrainCircuit,
  HandCoins,
  Package,
  Scale,
  Sparkles,
  TrendingUp,
  Users,
  Vault,
} from "lucide-react";
import { PageHeader } from "@/shared/layout/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatDateTime, formatMoney, formatWeight } from "@/lib/utils";
import { useApiErrorMessage } from "@/shared/hooks/use-api-error-message";
import {
  useAnalysisSnapshot,
  useGenerateAnalysis,
  useLatestAnalysis,
} from "@/shared/hooks/use-analysis";
import type { BusinessSnapshot } from "@/interfaces";
import { ReportMarkdown } from "./report-markdown";
import { AnalysisFab } from "./analysis-fab";

const PERIODS = [7, 30, 90] as const;

/** "+12%" / "−8%" against the previous period, or nothing when there is no base. */
function change(current: number, previous: number): string | undefined {
  if (!previous) return undefined;
  const percent = Math.round(((current - previous) / previous) * 100);
  return `${percent > 0 ? "+" : percent < 0 ? "−" : ""}${Math.abs(percent)}%`;
}

/**
 * The owner's analysis page (BOSS only). The figures at the top are computed
 * live from the records. Below them, the open model's written report about
 * those figures: written on request (it can take a minute), then kept, so
 * opening the page never waits on the model.
 */
export function AnalysisPage() {
  const { t, i18n } = useTranslation();
  const language = i18n.language?.startsWith("en") ? "en" : "fr";
  const [days, setDays] = useState<number>(30);

  const snapshot = useAnalysisSnapshot(days);
  const latest = useLatestAnalysis(language);
  const generate = useGenerateAnalysis();
  const snapshotError = useApiErrorMessage(snapshot.error);
  const generateError = useApiErrorMessage(generate.error);
  const report = latest.data;

  // Arriving from the dashboard's AI button (?write=1): start writing at once, a single time.
  const [searchParams, setSearchParams] = useSearchParams();
  const launched = useRef(false);
  useEffect(() => {
    if (searchParams.get("write") !== "1" || launched.current) return;
    launched.current = true;
    generate.mutate({ days, language });
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, generate, days, language]);

  return (
    <div>
      <PageSkeleton loading={snapshot.isPending || latest.isPending}>
        <div className="space-y-6">
          <PageHeader
            title={t("analysis.title")}
            description={t("analysis.description")}
            icon={BrainCircuit}
            action={
              <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
                <SelectTrigger className="w-44" aria-label={t("analysis.period")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((period) => (
                    <SelectItem key={period} value={String(period)}>
                      {t("analysis.lastDays", { count: period })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />

          {snapshot.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {snapshotError}
            </p>
          ) : (
            snapshot.data && <Figures snapshot={snapshot.data} />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-cocoa-600" aria-hidden="true" />
                {t("analysis.report.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {generate.isPending && (
                <p role="status" className="rounded-md bg-cocoa-50 px-3 py-2 text-sm text-cocoa-700">
                  {t("analysis.report.writing")}
                </p>
              )}
              {generate.isError && (
                <p role="alert" className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {generateError}
                </p>
              )}

              {report ? (
                <>
                  <ReportMarkdown content={report.content} />
                  <p className="border-t border-cocoa-100 pt-3 text-xs text-cocoa-500">
                    {t("analysis.report.meta", {
                      model: report.model,
                      date: formatDateTime(report.generatedAt),
                      from: formatDate(report.periodFrom),
                      to: formatDate(report.periodTo),
                    })}
                  </p>
                  <p className="flex items-start gap-2 text-xs text-cocoa-500">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    {t("analysis.report.disclaimer")}
                  </p>
                </>
              ) : (
                !generate.isPending && (
                  <EmptyState
                    icon={Sparkles}
                    title={t("analysis.report.emptyTitle")}
                    description={t("analysis.report.emptyDescription")}
                  />
                )
              )}
            </CardContent>
          </Card>
        </div>
      </PageSkeleton>

      {/* Floating, outside the skeleton: always at hand, whatever is scrolled into view. */}
      <AnalysisFab
        title={t(report ? "analysis.report.refresh" : "analysis.report.write")}
        description={t(generate.isPending ? "analysis.report.writing" : "analysis.report.fabTooltip", { count: days })}
        pending={generate.isPending}
        onLaunch={() => generate.mutate({ days, language })}
      />
    </div>
  );
}

function Figures({ snapshot }: { snapshot: BusinessSnapshot }) {
  const { t } = useTranslation();
  const { purchases, previousPurchases, payables, stock, till, prefinance, payroll, prices } = snapshot;
  const kgChange = change(purchases.netKg, previousPurchases.netKg);

  return (
    <div className="space-y-4">
      <p className="text-sm text-cocoa-500">
        {t("analysis.periodRange", { from: formatDate(snapshot.from), to: formatDate(snapshot.to) })}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("analysis.figures.bought")}
          value={formatWeight(purchases.netKg)}
          icon={Scale}
          helper={
            kgChange
              ? t("analysis.figures.vsPrevious", { change: kgChange })
              : t("analysis.figures.purchaseCount", { count: purchases.count })
          }
        />
        <StatCard
          label={t("analysis.figures.spent")}
          value={formatMoney(purchases.amount)}
          icon={Banknote}
          helper={t("analysis.figures.averagePrice", { price: formatMoney(purchases.averagePricePerKg) })}
        />
        <StatCard
          label={t("analysis.figures.stock")}
          value={formatWeight(stock.onHandKg)}
          icon={Package}
          helper={t("analysis.figures.stockFlow", {
            received: formatWeight(stock.receivedKg),
            issued: formatWeight(stock.issuedKg),
          })}
        />
        <StatCard
          label={t("analysis.figures.price")}
          value={prices.currentPerKg != null ? formatMoney(prices.currentPerKg) : "—"}
          icon={TrendingUp}
          helper={t("analysis.figures.priceChanges", { count: prices.changes })}
        />
        <StatCard
          label={t("analysis.figures.owedSuppliers")}
          value={formatMoney(payables.outstanding)}
          icon={HandCoins}
          tone={payables.overdue > 0 ? "negative" : payables.open > 0 ? "pending" : "positive"}
          helper={
            payables.overdue > 0
              ? t("analysis.figures.overdue", { count: payables.overdue, amount: formatMoney(payables.overdueAmount) })
              : t("analysis.figures.openPayables", { count: payables.open })
          }
        />
        <StatCard
          label={t("analysis.figures.prefinance")}
          value={formatMoney(prefinance.outstanding)}
          icon={HandCoins}
          tone={prefinance.outstanding > 0 ? "pending" : "positive"}
          helper={t("analysis.figures.openPrefinance", { count: prefinance.open })}
        />
        <StatCard
          label={t("analysis.figures.till")}
          value={formatMoney(till.totalVariance)}
          icon={Vault}
          tone={till.shortfalls > 0 ? "negative" : "positive"}
          helper={
            till.shortfalls > 0
              ? t("analysis.figures.shortfalls", {
                  count: till.shortfalls,
                  largest: formatMoney(till.largestShortfall),
                })
              : t("analysis.figures.tillsClosed", { count: till.sessionsClosed })
          }
        />
        <StatCard
          label={t("analysis.figures.salaries")}
          value={formatMoney(payroll.salaryDue)}
          icon={Users}
          tone={payroll.salaryDue > 0 ? "pending" : "positive"}
          helper={t("analysis.figures.employees", { count: payroll.activeEmployees })}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("analysis.topSuppliers")}</CardTitle>
          </CardHeader>
          <CardContent>
            {snapshot.topSuppliers.length === 0 ? (
              <p className="text-sm text-cocoa-500">{t("analysis.noPurchases")}</p>
            ) : (
              <ul className="divide-y divide-cocoa-100 text-sm">
                {snapshot.topSuppliers.map((supplier) => (
                  <li key={supplier.name} className="flex justify-between gap-3 py-2">
                    <span className="font-medium text-cocoa-900">{supplier.name}</span>
                    <span className="text-right tabular-nums text-cocoa-600">
                      {formatWeight(supplier.netKg)} · {formatMoney(supplier.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("analysis.prefinanceExposure")}</CardTitle>
          </CardHeader>
          <CardContent>
            {prefinance.largest.length === 0 ? (
              <p className="text-sm text-cocoa-500">{t("analysis.noPrefinance")}</p>
            ) : (
              <ul className="divide-y divide-cocoa-100 text-sm">
                {prefinance.largest.map((buyer) => (
                  <li key={buyer.buyer} className="flex justify-between gap-3 py-2">
                    <span className="font-medium text-cocoa-900">{buyer.buyer}</span>
                    <span className="tabular-nums text-cocoa-600">{formatMoney(buyer.outstanding)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
