import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePagination } from "@/shared/hooks/use-pagination";
import { DataPagination } from "@/components/pagination";

interface DashboardListCardProps<T> {
  title: string;
  items: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  pageSize?: number;
  emptyMessage?: string;
}

export function DashboardListCard<T>({
  title,
  items,
  keyExtractor,
  renderItem,
  pageSize = 5,
  emptyMessage,
}: DashboardListCardProps<T>) {
  const { t } = useTranslation();
  const pagination = usePagination(items, pageSize);

  return (
    <Card>
      <CardHeader className="text-center font-bold">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        {pagination.pageRows.length > 0 ? (
          <ul className="divide-y divide-cocoa-100">
            {pagination.pageRows.map((item) => (
              <li key={keyExtractor(item)}>{renderItem(item)}</li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyMessage ?? t("common.empty")}
          </p>
        )}

        <DataPagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          onPageChange={pagination.setPage}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          className="mt-4"
        />
      </CardContent>
    </Card>
  );
}