import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useCashSession } from "@/shared/hooks/use-cash-sessions";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { CashMovementType, CashSessionStatus } from "@/enums";
import type { CashSessionResponse, CashTransactionResponse } from "@/interfaces";

/**
 * Every movement of one till, newest first: provisions in, and the cash paid
 * out by purchases, expenses, prefinance disbursements and salaries.
 */
export function TillMovementsTable({
  transactions,
  emptyTitle,
}: {
  transactions: CashTransactionResponse[];
  emptyTitle: string;
}) {
  const { t } = useTranslation();
  const rows = [...transactions].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  const columns: Column<CashTransactionResponse>[] = [
    { header: t("till.columns.when"), cell: (tx) => formatDateTime(tx.occurredAt) },
    {
      header: t("till.columns.type"),
      cell: (tx) => t(`till.referenceTypes.${tx.referenceType ?? "OTHER"}`, tx.referenceType ?? "—"),
    },
    {
      header: t("till.columns.description"),
      cell: (tx) => tx.description || "—",
      hideOnMobile: true,
    },
    {
      header: t("till.columns.amount"),
      cell: (tx) => {
        const isIn = tx.movementType === CashMovementType.IN;
        return (
          <span className={`font-medium tabular-nums ${isIn ? "text-pod-700" : "text-cocoa-900"}`}>
            {isIn ? "+" : "−"}
            {formatMoney(tx.amount)}
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(tx) => tx.id}
      emptyTitle={emptyTitle}
      emptyDescription=""
    />
  );
}

/** One till from the history, read-only. */
export function TillDetailsDialog({
  session,
  onPrint,
  onOpenChange,
}: {
  session: CashSessionResponse | null;
  onPrint: (session: CashSessionResponse) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  // The list rows already carry movements; refetch for a till still open.
  const detail = useCashSession(session?.id);
  const current = detail.data ?? session;
  const isOpen = current?.status === CashSessionStatus.OPEN;

  return (
    <Dialog open={Boolean(session)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] hide-scrollbar overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t("till.details.title", { name: current?.openedByName ?? "—" })}
          </DialogTitle>
          <DialogDescription>
            {current &&
              t("till.details.description", {
                opened: formatDateTime(current.openedAt),
                closed: current.closedAt ? formatDateTime(current.closedAt) : "—",
              })}
          </DialogDescription>
        </DialogHeader>

        {!current ? (
          <div className="flex justify-center py-8">
            <Loader className="h-14 w-14" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={t(`till.status.${current.status}`)}
                tone={isOpen ? "pending" : "neutral"}
              />
              {current.closedByName && (
                <span className="text-xs text-cocoa-500">
                  {t("till.details.closedBy", { name: current.closedByName })}
                </span>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => onPrint(current)}
              >
                <Printer aria-hidden="true" />
                {t("documents.actions.printTillReport")}
              </Button>
            </div>
            <dl className="grid gap-3 rounded-lg bg-cocoa-50 p-3 text-sm sm:grid-cols-4">
              <Amount label={t("till.openingFloat")} value={current.openingBalance} />
              <Amount
                label={t(isOpen ? "till.available" : "till.expectedClosing")}
                value={isOpen ? current.availableBalance : current.expectedClosing}
              />
              <Amount label={t("till.declaredClosing")} value={current.declaredClosing} />
              <Amount label={t("till.variance")} value={current.variance} signed />
            </dl>
            <TillMovementsTable
              transactions={current.transactions ?? []}
              emptyTitle={t("till.noMovements")}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Amount({
  label,
  value,
  signed = false,
}: {
  label: string;
  value?: number | null;
  signed?: boolean;
}) {
  const tone =
    signed && value ? (value < 0 ? "text-destructive" : "text-pod-700") : "text-cocoa-900";
  return (
    <div>
      <dt className="text-cocoa-500">{label}</dt>
      <dd className={`mt-0.5 font-semibold tabular-nums ${tone}`}>
        {value === null || value === undefined
          ? "—"
          : `${signed && value > 0 ? "+" : ""}${formatMoney(value)}`}
      </dd>
    </div>
  );
}
