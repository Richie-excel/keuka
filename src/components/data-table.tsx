import type { ReactNode } from 'react'
import { EmptyState } from '@/components/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  header: string
  cell: (row: T) => ReactNode
  /** Hide this column on small screens — keeps mobile tables scannable. */
  hideOnMobile?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  emptyTitle: string
  emptyDescription: string
  rowActions?: (row: T) => ReactNode
  actionsLabel?: string
  onRowClick?: (row: T) => void
}

/**
 * One table implementation for the whole app. Every module (purchases,
 * inventory, buyers, payroll...) describes its own columns and passes
 * data — none of them re-implement table markup, empty states, or mobile
 * column-hiding. This is the single place responsive table behavior lives.
 */
export function DataTable<T>({ columns, rows, rowKey, emptyTitle, emptyDescription, rowActions, onRowClick, actionsLabel = 'Actions' }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="overflow-hidden rounded-lg border border-cocoa-100">
      <Table>
        <TableHeader className="bg-cocoa-50 text-xs uppercase tracking-normal text-cocoa-500">
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.header}
                className={col.hideOnMobile ? 'hidden px-4 py-3 sm:table-cell' : 'px-4 py-3'}
              >
                {col.header}
              </TableHead>
            ))}
            {rowActions && <TableHead className="w-12 px-2 py-3 text-right">{actionsLabel}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {rows.map((row) => (
            <TableRow key={rowKey(row)}   
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn('hover:bg-cocoa-50/50', onRowClick && 'cursor-pointer')}

            >
              {columns.map((col) => (
                <TableCell
                  key={col.header}
                  className={col.hideOnMobile ? 'hidden px-4 py-3 sm:table-cell' : 'px-4 py-3'}
                >
                  {col.cell(row)}
                </TableCell>
              ))}
              {rowActions && (
                // The menu renders in a portal, but React events still bubble to
                // the row — without this, choosing an action also fires onRowClick.
                <TableCell className="px-2 py-2 text-right" onClick={(event) => event.stopPropagation()}>
                  {rowActions(row)}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
