import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageSkeleton } from "@/components/page-skeleton";
import { PageHeader } from "@/shared/layout/page-header";

export function ContractsPage() {
  const { t } = useTranslation();

  return (
    <PageSkeleton>
      <div>
        <PageHeader
          title={t("contracts.title")}
          icon={FileText}
          description={t("contracts.description")}
        />
        <EmptyState
          icon={FileText}
          title={t("contracts.apiUnavailableTitle")}
          description={t("contracts.apiUnavailableDescription")}
        />
      </div>
    </PageSkeleton>
  );
}