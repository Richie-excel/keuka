import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn, getPageItems } from "@/lib/utils";

export type PageItem = number | "ellipsis-left" | "ellipsis-right";


interface DataPaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
}

export function DataPagination({
  page,
  pageCount,
  onPageChange,
  totalItems,
  className,
}: DataPaginationProps) {
  const { t } = useTranslation();

  // Nothing to page through: no lone highlighted "1" under an empty list.
  if (totalItems === 0 || pageCount < 1) return null;

  const items = getPageItems(page, pageCount);


  const go = (target: number) => (event: MouseEvent) => {
    event.preventDefault();
    if (target < 1 || target > pageCount || target === page) return;
    onPageChange(target);
  };

  const edgeClass = "pointer-events-none opacity-50";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between justify-self-end",
        className,
      )}
    >
      
      <Pagination
        aria-label={t("common.pagination.nav")}
        className="mx-0 w-auto justify-end"
      >
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={go(page - 1)}
              aria-disabled={page === 1 ? true : undefined}
              className={cn(page === 1 && edgeClass)}
            >
              <span className="hidden sm:inline">
                {t("common.pagination.previous")}
              </span>
            </PaginationPrevious>
          </PaginationItem>

          <PaginationItem className="md:hidden">
            <span className="px-2 text-sm text-muted-foreground">
              {t("common.pagination.pageOf", { page, pageCount })}
            </span>
          </PaginationItem>

          {items.map((item) =>
            typeof item === "number" ? (
              <PaginationItem key={item} className="hidden md:block">
                <PaginationLink
                  href="#"
                  isActive={item === page}
                  onClick={go(item)}
                  aria-label={t("common.pagination.pageLabel", { page: item })}
                  className={`${ item === page ? "bg-primary hover:bg-primary/70" : "bg-secondary/50 hover:bg-primary/40 hover:text-background"}`}
                >
                  <span>
                    {item}
                  </span>
                </PaginationLink>
              </PaginationItem>
            ) : (
              <PaginationItem key={item} className="hidden md:block">
                <PaginationEllipsis />
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={go(page + 1)}
              aria-disabled={page === pageCount ? true : undefined}
              className={cn(page === pageCount && edgeClass)}
            >
              <span className="hidden sm:inline">
                {t("common.pagination.next")}
              </span>
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}