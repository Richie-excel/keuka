import { useTranslation } from "react-i18next";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageSkeleton } from "@/components/page-skeleton";
import { PageHeader } from "@/shared/layout/page-header";

function ReportingUnavailablePage() {
  const { t } = useTranslation();

  return (
    <PageSkeleton>
      <div>
        <PageHeader title={t("reporting.title")} description={t("reporting.description")} icon={BarChart3} />
        <EmptyState icon={BarChart3} title={t("reporting.apiUnavailableTitle")} description={t("reporting.apiUnavailableDescription")} />
      </div>
    </PageSkeleton>
  );
}

export function DashboardPage() {
  return <ReportingUnavailablePage />;
}

export function ReportsPage() {
  return <ReportingUnavailablePage />;
}