import { useMemo, useState } from "react";

export function usePagination<T>(rows: T[], pageSize: number = 8) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(Math.max(1, page), pageCount)
  const pageRows = useMemo(
    () => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [rows, safePage, pageSize],
  )
  return useMemo(
    () => ({ page: safePage, setPage, pageCount, pageSize, pageRows, totalItems: rows.length }),
    [safePage, pageCount, pageSize, pageRows, rows.length],
  )
}