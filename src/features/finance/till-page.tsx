import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Coins,
  Lock,
  PlusCircle,
  Printer,
  Receipt,
  Vault,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data-table";
import { DataPagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { PageSkeleton } from "@/components/page-skeleton";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/shared/layout/page-header";
import { useAuth } from "@/shared/hooks/useAuth";
import {
  useAddCashProvision,
  useCashSessions,
  useCloseCashSession,
  useOpenCashSession,
  useOpenTill,
} from "@/shared/hooks/use-cash-sessions";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { PAGE_SIZE } from "@/constants";
import { CashMovementType, CashSessionStatus, PermissionKey } from "@/enums";
import type { CashSessionResponse } from "@/interfaces";
import { TillAmountDialog } from "./till-dialogs";
import { ExpenseDialog } from "./expense-dialog";
import { TillDetailsDialog, TillMovementsTable } from "./till-details";
import { TillReport } from "@/components/documents/till-report";
import { useDocumentPrinter } from "@/components/documents/print-context";
import { usePrintPrompt } from "@/components/documents/use-print-prompt";
import { useCompanyIdentity } from "@/shared/hooks/use-company-identity";
import { toTillReportData } from "./till-report-data";

type TillAction = "open" | "provision" | "close" | null;

const PROVISION = "PROVISION";

/**
 * The cashier's till: open it with a counted float, top it up with
 * provisions (each one recorded), watch every cash movement against it, and
 * close it by declaring the count. Below, the history of every till.
 *
 * Every figure here comes from the server (`availableBalance`, `expected`,
 * `variance`): only the server sees the cash taken out by purchases,
 * expenses, prefinances and salaries across the app.
 */
export function TillPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [action, setAction] = useState<TillAction>(null);
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<CashSessionResponse | null>(null);

  const canOpen = hasPermission(PermissionKey.CASH_SESSION_CREATE);
  const canUpdate = hasPermission(PermissionKey.CASH_SESSION_UPDATE);
  // Running costs are paid from this till too (vehicle parts, fuel, office supplies…).
  const canRecordExpense = hasPermission(PermissionKey.EXPENSE_CREATE);
  const [recordingExpense, setRecordingExpense] = useState(false);

  const current = useOpenCashSession();
  const history = useCashSessions({ page, size: PAGE_SIZE });
  const openTill = useOpenTill();
  const addProvision = useAddCashProvision();
  const closeTill = useCloseCashSession();

  const till = current.openSession;
  const printer = useDocumentPrinter();
  const printPrompt = usePrintPrompt();
  const { company } = useCompanyIdentity();

  function printReport(session: CashSessionResponse) {
    printer.printDocument(
      <TillReport company={company} data={toTillReportData(session, t)} />,
    );
  }
  const movements = till?.transactions ?? [];
  const provisions = movements.filter((tx) => tx.referenceType === PROVISION);
  const provisioned = provisions.reduce((sum, tx) => sum + tx.amount, 0);
  const paidOut = movements
    .filter((tx) => tx.movementType === CashMovementType.OUT)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const historyColumns: Column<CashSessionResponse>[] = [
    { header: t("till.columns.cashier"), cell: (s) => s.openedByName ?? "—" },
    {
      header: t("till.columns.opened"),
      cell: (s) => formatDateTime(s.openedAt),
    },
    {
      header: t("till.columns.status"),
      cell: (s) => (
        <StatusBadge
          label={t(`till.status.${s.status}`)}
          tone={s.status === CashSessionStatus.OPEN ? "pending" : "neutral"}
        />
      ),
    },
    {
      header: t("till.openingFloat"),
      cell: (s) => formatMoney(s.openingBalance),
      hideOnMobile: true,
    },
    {
      header: t("till.columns.balance"),
      cell: (s) =>
        formatMoney(
          s.status === CashSessionStatus.OPEN
            ? s.availableBalance
            : (s.declaredClosing ?? 0),
        ),
    },
    {
      header: t("till.variance"),
      cell: (s) =>
        s.variance === null || s.variance === undefined ? (
          "—"
        ) : (
          <span
            className={
              s.variance < 0
                ? "text-destructive"
                : s.variance > 0
                  ? "text-pod-700"
                  : ""
            }
          >
            {s.variance > 0 ? "+" : ""}
            {formatMoney(s.variance)}
          </span>
        ),
      hideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageSkeleton loading={current.isPending}>
        <div className="space-y-6">
          <PageHeader
            title={t("till.title")}
            description={t("till.description")}
            icon={Wallet}
            action={
              till ? (
                canUpdate && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => printReport(till)}
                    >
                      <Printer aria-hidden="true" />
                      {t("documents.actions.printTillReport")}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setAction("provision")}
                    >
                      <PlusCircle aria-hidden="true" />
                      {t("till.addProvision")}
                    </Button>
                    {canRecordExpense && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setRecordingExpense(true)}
                      >
                        <Receipt aria-hidden="true" />
                        {t("expenses.record")}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAction("close")}
                    >
                      <Lock aria-hidden="true" />
                      {t("till.closeTill")}
                    </Button>
                  </div>
                )
              ) : canOpen ? (
                <Button type="button" onClick={() => setAction("open")}>
                  <Vault aria-hidden="true" />
                  {t("till.openTill")}
                </Button>
              ) : undefined
            }
          />

          {current.isError ? (
            <p role="alert" className="py-4 text-sm text-destructive">
              {current.error.message}
            </p>
          ) : !till ? (
            <EmptyState
              icon={Vault}
              title={t("till.closedTitle")}
              description={t(
                canOpen ? "till.closedDescription" : "till.closedNoPermission",
              )}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label={t("till.openingFloat")}
                  value={formatMoney(till.openingBalance)}
                  icon={Vault}
                />
                <StatCard
                  label={t("till.provisions")}
                  value={formatMoney(provisioned)}
                  icon={ArrowDownToLine}
                  helper={t("till.provisionCount", {
                    count: provisions.length,
                  })}
                />
                <StatCard
                  label={t("till.paidOut")}
                  value={formatMoney(paidOut)}
                  icon={ArrowUpFromLine}
                />
                <StatCard
                  label={t("till.available")}
                  value={formatMoney(till.availableBalance)}
                  icon={Coins}
                  tone={till.availableBalance > 0 ? "positive" : "pending"}
                  helper={t("till.openedAt", {
                    date: formatDateTime(till.openedAt),
                  })}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{t("till.provisionsHeading")}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <TillMovementsTable
                    transactions={provisions}
                    emptyTitle={t("till.noProvisions")}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("till.movementsHeading")}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <TillMovementsTable
                    transactions={movements}
                    emptyTitle={t("till.noMovements")}
                  />
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t("till.historyHeading")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {history.isError ? (
                <p role="alert" className="py-4 text-sm text-destructive">
                  {history.error.message}
                </p>
              ) : (
                <>
                  <DataTable
                    columns={historyColumns}
                    rows={history.data?.content ?? []}
                    rowKey={(s) => s.id}
                    emptyTitle={t("till.noHistory")}
                    emptyDescription=""
                    onRowClick={setViewing}
                  />
                  {history.data && history.data.totalPages > 1 && (
                    <DataPagination
                      page={page}
                      pageCount={history.data.totalPages}
                      onPageChange={setPage}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </PageSkeleton>

      {/* Outside PageSkeleton so the dialogs are unaffected by skeleton rendering. */}
      {printPrompt.dialog}
      <ExpenseDialog open={recordingExpense} onOpenChange={setRecordingExpense} />
      <TillAmountDialog
        open={action === "open"}
        onOpenChange={(open) => !open && setAction(null)}
        title={t("till.openTill")}
        description={t("till.openDescription")}
        amountLabel={t("till.openingFloat")}
        amountHint={t("till.openingFloatHint")}
        submitLabel={t("till.openTill")}
        allowZero
        saving={openTill.isPending}
        onSubmit={(amount, notes) =>
          openTill.submitAsync({ openingBalance: amount, notes })
        }
      />

      {till && (
        <>
          <TillAmountDialog
            open={action === "provision"}
            onOpenChange={(open) => !open && setAction(null)}
            title={t("till.addProvision")}
            description={t("till.provisionDescription")}
            amountLabel={t("till.provisionAmount")}
            submitLabel={t("till.addProvision")}
            saving={addProvision.isPending}
            onSubmit={(amount, notes) =>
              addProvision.submitAsync({
                id: till.id,
                input: { amount, notes },
              })
            }
          />
          <TillAmountDialog
            open={action === "close"}
            onOpenChange={(open) => !open && setAction(null)}
            title={t("till.closeTill")}
            description={t("till.closeDescription")}
            amountLabel={t("till.declaredClosing")}
            amountHint={t("till.declaredClosingHint")}
            submitLabel={t("till.closeTill")}
            allowZero
            renderSummary={(counted) => {
              const variance =
                counted === undefined
                  ? undefined
                  : counted - till.availableBalance;
              return (
                <div className="mb-4 space-y-1 rounded-lg bg-cocoa-50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-cocoa-500">
                      {t("till.expectedClosing")}
                    </span>
                    <span className="font-medium text-cocoa-900">
                      {formatMoney(till.availableBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cocoa-500">{t("till.variance")}</span>
                    <span
                      className={`font-semibold ${
                        variance === undefined || variance === 0
                          ? "text-cocoa-900"
                          : variance < 0
                            ? "text-destructive"
                            : "text-pod-700"
                      }`}
                    >
                      {variance === undefined
                        ? "—"
                        : `${variance > 0 ? "+" : ""}${formatMoney(variance)}`}
                    </span>
                  </div>
                </div>
              );
            }}
            saving={closeTill.isPending}
            onSubmit={(amount, notes) =>
              closeTill
                .submitAsync({
                  id: till.id,
                  input: { declaredClosing: amount, notes },
                })
                .then((closed) =>
                  printPrompt.prompt({
                    title: t("documents.prompt.tillTitle"),
                    description: t("documents.prompt.tillText"),
                    print: () => printReport(closed),
                  }),
                )
            }
          />
        </>
      )}

      <TillDetailsDialog
        session={viewing}
        onPrint={printReport}
        onOpenChange={(open) => !open && setViewing(null)}
      />
    </div>
  );
}
