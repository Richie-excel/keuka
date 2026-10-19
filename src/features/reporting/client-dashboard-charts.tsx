import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/chart-card";
import { CHART_TICK } from "@/lib/chart-theme";
import { Money, Weight } from "@/components/amount-display";
import { formatWeight } from "@/lib/utils";

/**
 * The charts of the client dashboard. Each one takes numbers the orchestrator
 * has already derived from a real endpoint, so nothing here fetches and nothing
 * here decides what a user may see — the RBAC filter is the caller's job.
 */

export interface PurchaseTrendPoint {
  date: string;
  value: number;
}

export function PurchaseTrendCard({ data }: { data: PurchaseTrendPoint[] }) {
  const { t } = useTranslation();
  return (
    <ChartCard title={t("dashboard.client.purchaseTrend")}>
      <BarChart data={data}>
        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={CHART_TICK} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={CHART_TICK}
          tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
        />
        <Tooltip formatter={(value) => <Money amount={Number(value)} />} wrapperClassName="rounded-lg"/>
        <Bar dataKey="value" fill="var(--color-cocoa-700)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartCard>
  );
}

export interface PricePoint {
  date: string;
  price: number;
}

export function PriceHistoryCard({ data }: { data: PricePoint[] }) {
  const { t } = useTranslation();
  return (
    <ChartCard title={t("dashboard.client.cocoaPriceHistory")}>
      <LineChart data={data}>
        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={CHART_TICK} />
        <YAxis tickLine={false} axisLine={false} tick={CHART_TICK} />
        <Tooltip wrapperClassName="rounded-lg"
          formatter={(value) => (
            <>
              <Money amount={Number(value)} />
              /kg
            </>
          )}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="var(--color-cocoa-700)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--color-cocoa-700)" }}
        />
      </LineChart>
    </ChartCard>
  );
}

export interface SliceDatum {
  name: string;
  value: number;
  color: string;
}

export function DeliveryStatusCard({ data }: { data: SliceDatum[] }) {
  const { t } = useTranslation();
  return (
    <ChartCard title={t("dashboard.client.logisticsStatus")}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={46}
          outerRadius={68}
          paddingAngle={3}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip wrapperClassName="rounded-lg" />
      </PieChart>
    </ChartCard>
  );
}

export interface PrefinanceBalancePoint {
  buyer: string;
  advanced: number;
  outstanding: number;
}

export function PrefinanceBalancesCard({
  data,
}: {
  data: PrefinanceBalancePoint[];
}) {
  const { t } = useTranslation();
  return (
    <ChartCard title={t("dashboard.client.buyerBalances")}>
      <BarChart data={data}>
        <XAxis dataKey="buyer" tickLine={false} axisLine={false} tick={CHART_TICK} />
        <YAxis tickLine={false} axisLine={false} tick={CHART_TICK} />
        <Tooltip wrapperClassName="rounded-lg" formatter={(value) => <Money amount={Number(value)} />} />
        <Bar dataKey="advanced" fill="var(--color-cocoa-300)" />
        <Bar dataKey="outstanding" fill="var(--color-amber-500)" />
      </BarChart>
    </ChartCard>
  );
}

/** On-hand stock for the caller's warehouse — a single bar, but one real figure. */
export function StockBalanceCard({ quantityKg }: { quantityKg: number }) {
  const { t } = useTranslation();
  const data = [{ name: t("dashboard.client.stockOnHand"), value: quantityKg }];
  return (
    <ChartCard title={t("dashboard.client.stockOnHand")}>
      <BarChart data={data}>
        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={CHART_TICK} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={CHART_TICK}
          tickFormatter={(value) => formatWeight(Number(value))}
        />
        <Tooltip wrapperClassName="rounded-lg" formatter={(value) => <Weight kg={Number(value)} />} />
        <Bar dataKey="value" fill="var(--color-pod-500)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartCard>
  );
}