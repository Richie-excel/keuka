import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageSkeleton } from "@/components/page-skeleton";
import { PageHeader } from "@/shared/layout/page-header";

export function SyncStatusPage() {
  const { t } = useTranslation();

  return (
    <PageSkeleton>
      <div>
        <PageHeader
          title={t("synchronization.title")}
          description={t("synchronization.description")}
          icon={RefreshCw}
        />
        <EmptyState
          icon={RefreshCw}
          title={t("synchronization.apiUnavailableTitle")}
          description={t("synchronization.apiUnavailableDescription")}
        />
      </div>
    </PageSkeleton>
  );
}
