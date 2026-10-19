// src/components/register-card.tsx
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data-table";
import { DataPagination } from "./pagination";

interface RegisterCardProps<T> {
  title: string;
  description?: string;
  headerAction?: ReactNode;
  filter?: ReactNode;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyTitle: string;
  emptyDescription: string;
  actionsLabel?: string;
  rowActions?: (row: T) => ReactNode;
  page: number;
  pageCount: number;
  setPage: Dispatch<SetStateAction<number>>;
  totalItems?: number;
  pageSize?: number;
  /** extra content after the table (pagination, notes…) */
  children?: ReactNode;
}

/**
 * Purely presentational register layout: centered title, dense table,
 * optional status filter. No domain logic lives here (Claude.md: keep
 * domain logic out of visual components).
 */
export function RegisterCard<T>({
  title,
  description,
  headerAction,
  filter,
  columns,
  rows,
  rowKey,
  emptyTitle,
  emptyDescription,
  actionsLabel,
  rowActions,
  page,
  pageCount,
  pageSize,
  setPage,
  totalItems
}: RegisterCardProps<T>) {
  const filterRow = filter ? (
    <div className="mt-6 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-end sm:justify-start">
      {filter}
    </div>
  ) : null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {headerAction}
          </div>
          {description && (
            <p className="text-sm text-cocoa-500">{description}</p>
          )}
        </div>
        {filterRow}
      </CardHeader>
      <CardContent className="pt-3">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={rowKey}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          actionsLabel={actionsLabel}
          rowActions={rowActions}
        />
        <DataPagination
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
          totalItems={totalItems}
          pageSize={pageSize}
          className="mt-4"
        />
      </CardContent>
    </Card>
  );
}