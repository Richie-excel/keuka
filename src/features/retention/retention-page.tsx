import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArchiveRestore, Hourglass, Trash2 } from "lucide-react";
import type { PurgeWatch } from "@/api/purge";
import { SystemRole } from "@/enums";
import { PageHeader } from "@/shared/layout/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { DataPagination } from "@/components/pagination";
import { PageSkeleton } from "@/components/page-skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PAGE_SIZE } from "@/constants";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/shared/hooks/useAuth";
import { useConfirm } from "@/shared/hooks/use-confirm";
import {
  useCancelPurge,
  usePurgeNow,
  usePurgeWatches,
} from "@/shared/hooks/use-purge";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Deactivated records counting down to their permanent deletion.
 *
 * WHY a screen for it: the server deletes deactivated accounts, partners,
 * employees and warehouses on its own after the retention period. Without a
 * place to see what is coming, the first anyone hears of it is a record that
 * is gone. Here a boss (their company's records) or the platform operator (all)
 * can keep a record, and the operator can delete one at once after review.
 */
export function RetentionPage() {
  const { t } = useTranslation();
  const { hasAnyRole } = useAuth();
  const [page, setPage] = useState(1);
  const watches = usePurgeWatches({ page, size: PAGE_SIZE });
  const keep = useCancelPurge();
  const purgeNow = usePurgeNow();
  const { ask, dialogProps } = useConfirm();
  const canPurgeNow = hasAnyRole(SystemRole.SYSADMIN);
  const busy = keep.isPending || purgeNow.isPending;

  function confirmKeep(watch: PurgeWatch) {
    ask({
      title: t("retention.keepTitle"),
      description: t("retention.keepDescription", { label: watch.label }),
      confirmLabel: t("retention.keep"),
      icon: ArchiveRestore,
      onConfirm: async () => {
        await keep.mutateAsync(watch.id);
      },
    });
  }

  function confirmPurgeNow(watch: PurgeWatch) {
    ask({
      title: t("retention.purgeTitle"),
      description: t("retention.purgeDescription", { label: watch.label }),
      confirmLabel: t("retention.purgeNow"),
      tone: "destructive",
      icon: Trash2,
      onConfirm: async () => {
        await purgeNow.mutateAsync(watch.id);
      },
    });
  }

  const columns: Column<PurgeWatch>[] = [
    {
      header: t("retention.record"),
      cell: (row) => (
        <span className="font-medium text-cocoa-900">{row.label}</span>
      ),
    },
    {
      header: t("retention.type"),
      cell: (row) =>
        t(`retention.types.${row.resourceType}`, {
          defaultValue: row.resourceType,
        }),
      hideOnMobile: true,
    },
    {
      header: t("retention.deactivatedAt"),
      cell: (row) => formatDate(row.deactivatedAt),
      hideOnMobile: true,
    },
    {
      header: t("retention.purgeAt"),
      cell: (row) => {
        const days = Math.max(
          0,
          Math.ceil((new Date(row.purgeAt).getTime() - Date.now()) / DAY_MS),
        );
        return (
          <span className="flex flex-col">
            <span>{formatDate(row.purgeAt)}</span>
            <span className="text-xs text-cocoa-500">
              {t("retention.inDays", { count: days })}
            </span>
          </span>
        );
      },
    },
    {
      header: t("retention.status"),
      cell: (row) => (
        <Badge
          variant={row.status === "NOTIFIED" ? "destructive" : "secondary"}
        >
          {t(`retention.statuses.${row.status}`)}
        </Badge>
      ),
      hideOnMobile: true,
    },
  ];

  return (
    <div>
      <PageSkeleton loading={watches.isPending}>
        <div>
          <PageHeader
            title={t("retention.title")}
            description={t("retention.description")}
            icon={Hourglass}
          />
          {watches.isError ? (
            <p
              role="alert"
              className="py-8 text-center text-sm text-destructive"
            >
              {watches.error.message}
            </p>
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={watches.data?.content ?? []}
                rowKey={(row) => row.id}
                emptyTitle={t("retention.emptyTitle")}
                emptyDescription={t("retention.emptyDescription")}
                actionsLabel={t("retention.actions")}
                rowActions={(row) => (
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => confirmKeep(row)}
                    >
                      <ArchiveRestore />
                      <span className="hidden sm:inline">
                        {t("retention.keep")}
                      </span>
                    </Button>
                    {canPurgeNow && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={busy}
                        aria-label={t("retention.purgeNow")}
                        onClick={() => confirmPurgeNow(row)}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                )}
              />
              {watches.data && (
                <DataPagination
                  page={page}
                  pageCount={watches.data.totalPages}
                  onPageChange={setPage}
                  totalItems={watches.data.totalElements}
                />
              )}
            </>
          )}
        </div>
      </PageSkeleton>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
