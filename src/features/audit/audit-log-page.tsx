import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Search, X } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { DataPagination } from "@/components/pagination";
import { PageSkeleton } from "@/components/page-skeleton";
import { PageHeader } from "@/shared/layout/page-header";
import { useAuditEvents } from "@/shared/hooks/use-audit";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import Loader from "@/components/loader";
import { AUDIT_PAGE_SIZE } from "@/constants";
import type { AuditEvent } from "@/interfaces";
import { formatDateTime } from "@/lib/utils";

export function AuditLogPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  // Searched on the server (the log grows without end), once typing pauses.
  const term = useDebouncedValue(search.trim(), 350);
  const query = useAuditEvents({ page, size: AUDIT_PAGE_SIZE }, undefined, term);
  const searching = query.isFetching && search.trim() !== "";

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }
  const columns: Column<AuditEvent>[] = [
    { header: t("audit.columnWhat"), cell: (event) => event.action },
    {
      header: t("audit.columnWho"),
      cell: (event) => event.actorUsername ?? event.actorUserId ?? "—",
    },
    {
      header: t("audit.columnWhen"),
      cell: (event) =>
        formatDateTime(event.createdAt),
      hideOnMobile: true,
    },
    {
      header: t("audit.columnEventType"),
      cell: (event) => event.eventType,
      hideOnMobile: true,
    },
  ];

  return (
    <PageSkeleton loading={query.isPending}>
      <div>
        <PageHeader
          title={t("audit.title")}
          description={t("audit.description")}
          icon={FileText}
          action={
            <InputGroup className="w-full sm:w-80">
              <InputGroupAddon align="inline-start">
                {searching ? <Loader className="size-4 shrink-0" /> : <Search className="text-muted-foreground" />}
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={search}
                onChange={(event) => changeSearch(event.target.value)}
                placeholder={t("audit.searchPlaceholder")}
                aria-label={t("audit.searchLabel")}
                maxLength={100}
                autoComplete="off"
              />
              {search && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label={t("audit.clearSearch")}
                    onClick={() => changeSearch("")}
                  >
                    <X />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
          }
        />
        {query.isError ? (
          <p role="alert" className="py-8 text-center text-sm text-destructive">
            {query.error.message}
          </p>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={query.data?.content ?? []}
              rowKey={(event) => event.id}
              emptyTitle={t(term ? "audit.noMatchTitle" : "audit.emptyTitle")}
              emptyDescription={
                term ? t("audit.noMatchDescription", { term }) : t("audit.emptyDescription")
              }
            />
            {query.data && query.data.totalPages > 1 && (
              <DataPagination
                page={page}
                pageCount={query.data.totalPages}
                onPageChange={setPage}
                className="mt-2"
              />
            )}
          </>
        )}
      </div>
    </PageSkeleton>
  );
}
