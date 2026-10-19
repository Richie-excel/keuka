import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmployeeTypeBadge } from "@/components/role-badge";
import {
  Banknote,
  ClipboardList,
  Coins,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/shared/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { DataTable, type Column } from "@/components/data-table";
import { DataPagination } from "@/components/pagination";
import { StatusBadge } from "@/components/status-badge";
import { TableRowActions } from "@/components/table-row-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/shared/hooks/useAuth";
import { useEmployees, useEmployee } from "@/shared/hooks/use-employees";
import {
  useCollectSalary,
  useSalaryHistory,
} from "@/shared/hooks/use-payroll";
import { useOpenCashSession } from "@/shared/hooks/use-cash-sessions";
import { formatMoney, formatDate, formatDateTime, localDateKey } from "@/lib/utils";
import { PermissionKey } from "@/enums";
import type { EmployeeResponse } from "@/interfaces";
import Loader from "@/components/loader";
import { PageSkeleton } from "@/components/page-skeleton";
import {
  PAGE_SIZE,
  PAYROLL_HISTORY_PAGE_SIZE,
  PAYSLIP_HISTORY_SIZE,
} from "@/constants";
import { employeesApi } from "@/api/employees";
import { payrollApi } from "@/api/payroll";
import { Payslip } from "@/components/documents/payslip";
import { useDocumentPrinter } from "@/components/documents/print-context";
import { usePrintPrompt } from "@/components/documents/use-print-prompt";
import { useCompanyIdentity } from "@/shared/hooks/use-company-identity";
import {
  buildPayslipData,
  currentMonth,
} from "@/features/payroll/payslip-data";
import { PayslipAction } from "@/features/payroll/payslip-action";
import { SalaryPayoutForm } from "@/features/payroll/salary-payout-form";

/** Which part of an employee's payroll the dialog is showing. */
type PayrollMode = "history" | "collect";

export function PayrollPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(0);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeResponse | null>(null);
  const [historyPage, setHistoryPage] = useState(0);

  const employeesQuery = useEmployees({ page, size: PAGE_SIZE });
  const employeeQuery = useEmployee(selectedEmployee?.id);
  const employee = employeeQuery.data ?? selectedEmployee;
  const advanceBalance = employee?.advanceBalance ?? 0;
  // Salary is due a full month after the hire date; until then payouts are advances.
  const inFirstMonth = Boolean(
    employee?.salaryDueFrom && localDateKey(new Date()) < employee.salaryDueFrom,
  );
  const canManagePayroll = hasPermission(PermissionKey.PAYROLL_CREATE);
  const canCollectSalary = canManagePayroll;
  const cashSessionQuery = useOpenCashSession(canCollectSalary);
  const historyQuery = useSalaryHistory(employee?.id, {
    page: historyPage,
    size: PAYROLL_HISTORY_PAGE_SIZE,
  });
  const collectMutation = useCollectSalary();
  const [mode, setMode] = useState<PayrollMode>("history");
  const printPrompt = usePrintPrompt();
  const printer = useDocumentPrinter();
  const { company } = useCompanyIdentity();

  const employees = employeesQuery.data?.content ?? [];
  const dueTotal = employees.reduce(
    (sum, current) => sum + (current.salaryDue ?? 0),
    0,
  );
  const employeesOwed = employees.filter(
    (current) => (current.salaryDue ?? 0) > 0,
  ).length;

  const columns: Column<EmployeeResponse>[] = [
    {
      header: t("payroll.columnEmployee"),
      cell: (current) => (
        <span className="font-medium text-cocoa-900">{current.fullName}</span>
      ),
    },
    {
      header: t("personnel.columnType"),
      cell: (current) => <EmployeeTypeBadge type={current.employeeType} />,
      hideOnMobile: true,
    },
    {
      header: t("payroll.pendingPayroll"),
      cell: (current) => (
        <span className="font-semibold tabular-nums text-cocoa-900">
          {formatMoney(current.salaryDue ?? 0)}
        </span>
      ),
    },
    {
      header: t("personnel.columnStatus"),
      cell: (current) => (
        <StatusBadge
          label={
            (current.salaryDue ?? 0) > 0
              ? t("payroll.owed")
              : t("payroll.settled")
          }
          tone={(current.salaryDue ?? 0) > 0 ? "pending" : "positive"}
        />
      ),
    },
  ];

  /** Each row action opens the employee in its own mode, showing only its form. */
  function openEmployee(current: EmployeeResponse, nextMode: PayrollMode) {
    setSelectedEmployee(current);
    setMode(nextMode);
    setHistoryPage(0);
    collectMutation.reset();
  }

  function closeEmployee(open: boolean) {
    if (!open) setSelectedEmployee(null);
  }

  async function submitCollection(input: {
    amount: number;
    signatureName: string;
    notes?: string;
  }) {
    const session = cashSessionQuery.openSession;
    if (!employee || !session) return;
    await collectMutation.submitAsync({
      employeeId: employee.id,
      input: { ...input, cashSessionId: session.id },
    });
    setHistoryPage(0);
    // Offer this month's payslip. Read fresh at print time so it includes the
    // payout just made and what is still owed now.
    const employeeId = employee.id;
    printPrompt.prompt({
      title: t("documents.prompt.payslipTitle"),
      description: t("documents.prompt.payslipText", {
        name: employee.fullName,
      }),
      print: async () => {
        const [fresh, payouts] = await Promise.all([
          employeesApi.byId(employeeId),
          payrollApi.history(employeeId, {
            page: 1,
            size: PAYSLIP_HISTORY_SIZE,
          }),
        ]);
        printer.printDocument(
          <Payslip
            company={company}
            data={buildPayslipData(fresh, payouts.content, currentMonth(), t)}
          />,
        );
      },
    });
  }

  if (employeesQuery.isError)
    return (
      <p role="alert" className="py-8 text-center text-sm text-destructive">
        {employeesQuery.error.message}
      </p>
    );

  return (
    <div>
      <PageSkeleton loading={employeesQuery.isPending}>
        <div>
          <PageHeader
            title={t("payroll.title")}
            icon={ClipboardList}
            description={t("payroll.description")}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              label={t("payroll.totalDueOnPage")}
              value={formatMoney(dueTotal)}
              icon={Coins}
              tone={dueTotal > 0 ? "pending" : "positive"}
            />
            <StatCard
              label={t("payroll.employeesOwed")}
              value={String(employeesOwed)}
              icon={UserRound}
              tone={employeesOwed > 0 ? "pending" : "positive"}
            />
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{t("payroll.employeeBalances")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <DataTable
                columns={columns}
                rows={employees}
                rowKey={(current) => current.id}
                emptyTitle={t("payroll.emptyTitle")}
                emptyDescription={t("payroll.emptyDescription")}
                actionsLabel={t("common.actions.row")}
                rowActions={(current) => (
                  <TableRowActions
                    actionsLabel={t("common.actions.row")}
                    labels={{
                      view: t("payroll.historyAction"),
                      edit: t("common.actions.edit"),
                      delete: t("common.actions.delete"),
                    }}
                    canView={hasPermission(PermissionKey.PAYROLL_READ)}
                    onView={() => openEmployee(current, "history")}
                    extraActions={[
                      {
                        id: "collect",
                        label: t("payroll.collectAction"),
                        icon: Banknote,
                        visible: canCollectSalary,
                        onClick: () => openEmployee(current, "collect"),
                      },
                    ]}
                  />
                )}
              />
              {employeesQuery.data && employeesQuery.data.totalPages > 1 && (
                <DataPagination
                  page={page + 1}
                  pageCount={employeesQuery.data.totalPages}
                  onPageChange={(nextPage) => setPage(nextPage - 1)}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </PageSkeleton>

      {printPrompt.dialog}
      <Dialog open={selectedEmployee !== null} onOpenChange={closeEmployee}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl hide-scrollbar">
          <DialogHeader>
            <DialogTitle>
              {employee?.fullName}
              <span className="font-normal text-cocoa-500">
                {" "}
                · {t(`payroll.modes.${mode}.title`)}
              </span>
            </DialogTitle>
            <DialogDescription>
              {t(`payroll.modes.${mode}.description`)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-cocoa-50 p-3">
            <span className="text-sm text-cocoa-700">
              {t("payroll.currentDue")}
            </span>
            <span className="text-xl font-semibold tabular-nums text-cocoa-900">
              {formatMoney(employee?.salaryDue ?? 0)}
            </span>
            {advanceBalance > 0 && (
              <span className="basis-full text-xs text-cocoa-600">
                {t("payroll.advance.outstanding", {
                  amount: formatMoney(advanceBalance),
                })}
              </span>
            )}
            {employee?.active && employee.monthlySalary && employee.nextSalaryDate && (
              <span className="basis-full text-xs text-cocoa-600">
                {t("payroll.automatic.next", {
                  amount: formatMoney(employee.monthlySalary),
                  date: formatDate(employee.nextSalaryDate),
                })}
              </span>
            )}
          </div>

          {employee?.hireDate && !employee.monthlySalary && (
            <p role="alert" className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {t("payroll.automatic.agreedSalaryMissing")}
            </p>
          )}

          {employee && !employee.hireDate && (
            <p role="alert" className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {t("payroll.advance.hireDateRequired")}
            </p>
          )}
          {employee?.hireDate && inFirstMonth && (
            <p role="status" className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {t("payroll.advance.firstMonth", {
                date: formatDate(employee.salaryDueFrom),
              })}
            </p>
          )}

          {mode === "history" && employee && (
            <PayslipAction employee={employee} />
          )}

          {(collectMutation.isError ||
            employeeQuery.isError ||
            historyQuery.isError) && (
            <p role="alert" className="text-sm text-destructive">
              {collectMutation.error?.message ??
                employeeQuery.error?.message ??
                historyQuery.error?.message}
            </p>
          )}
          {collectMutation.isSuccess && (
            <p role="status" className="text-sm text-pod-700">
              {t("payroll.collectionSaved")}
            </p>
          )}

          <div className="grid grid-cols-1 gap-5">
            {mode === "collect" && canCollectSalary && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t(inFirstMonth ? "payroll.advance.title" : "payroll.collectTitle")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cashSessionQuery.isPending ? (
                    <div className="flex justify-center py-5">
                      <Loader />
                    </div>
                  ) : cashSessionQuery.isError ? (
                    <p role="alert" className="text-sm text-destructive">
                      {cashSessionQuery.error.message}
                    </p>
                  ) : !employee?.hireDate ? (
                    <p className="text-sm text-cocoa-600">
                      {t("payroll.advance.hireDateRequired")}
                    </p>
                  ) : inFirstMonth && !employee.monthlySalary ? (
                    <p className="text-sm text-cocoa-600">
                      {t("payroll.advance.agreedSalaryRequired")}
                    </p>
                  ) : !cashSessionQuery.openSession ? (
                    <p role="alert" className="text-sm text-amber-700">
                      {t("payroll.openTillRequired")}
                    </p>
                  ) : (
                    <>
                      <p className="mb-3 rounded-md bg-pod-100 px-3 py-2 text-xs text-pod-700">
                        {t("payroll.tillAvailable", {
                          amount: formatMoney(
                            cashSessionQuery.openSession.availableBalance,
                          ),
                        })}
                      </p>
                      <SalaryPayoutForm
                        key={employee?.id}
                        advance={inFirstMonth}
                        salaryDue={
                          inFirstMonth
                            ? Math.max(0, (employee.monthlySalary ?? 0) - advanceBalance)
                            : (employee.salaryDue ?? 0)
                        }
                        tillBalance={
                          cashSessionQuery.openSession.availableBalance
                        }
                        saving={collectMutation.isPending}
                        onSubmit={submitCollection}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {mode === "history" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("payroll.payoutHistory")}</CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                {historyQuery.isPending ? (
                  <div className="flex justify-center py-5">
                    <Loader />
                  </div>
                ) : historyQuery.isError ? (
                  <p role="alert" className="text-sm text-destructive">
                    {historyQuery.error.message}
                  </p>
                ) : historyQuery.data.content.length === 0 ? (
                  <p className="text-sm text-cocoa-500">
                    {t("payroll.noPayouts")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {historyQuery.data.content.map((payout) => (
                      <div
                        key={payout.id}
                        className="flex flex-col justify-between gap-1 border-b border-cocoa-100 py-2 text-sm sm:flex-row sm:items-center"
                      >
                        <div>
                          <p className="font-medium text-cocoa-900">
                            {formatMoney(payout.amount)}
                            {payout.kind === "ADVANCE" && (
                              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                                {t("payroll.advance.badge")}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-cocoa-500">
                            {t("payroll.signedBy", {
                              name: payout.signatureName,
                            })}
                          </p>
                        </div>
                        <time className="text-xs text-cocoa-500">
                          {formatDateTime(payout.paidAt)}
                        </time>
                      </div>
                    ))}
                  </div>
                )}
                {historyQuery.data && historyQuery.data.totalPages > 1 && (
                  <div className="mt-3">
                    <DataPagination
                      page={historyPage + 1}
                      pageCount={historyQuery.data.totalPages}
                      onPageChange={(nextPage) => setHistoryPage(nextPage - 1)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
