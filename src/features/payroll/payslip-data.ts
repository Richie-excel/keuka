import type { TFunction } from "i18next";
import { formatDate, formatMonth, localDateKey } from "@/lib/utils";
import type { PayslipData } from "@/components/documents/types";
import type { EmployeeResponse, SalaryResponse } from "@/interfaces";

/** This month in LOCAL time ("yyyy-MM"); the UTC month is wrong around midnight on the 1st. */
export function currentMonth(): string {
  return localDateKey(new Date()).slice(0, 7);
}

/**
 * An employee's payslip for one month ("yyyy-MM"): the salary actually paid
 * in that month, and what is still owed today. The backend has no pay period,
 * so the month is a client-side window over the payouts' own times.
 */
export function buildPayslipData(
  employee: EmployeeResponse,
  payouts: SalaryResponse[],
  month: string,
  t: TFunction,
): PayslipData {
  // `paidAt` is a UTC instant: compare the LOCAL month, or a payout made
  // just after midnight on the 1st lands in the previous month.
  const inMonth = payouts.filter((payout) => localDateKey(payout.paidAt).slice(0, 7) === month);
  const paid = inMonth.reduce((sum, payout) => sum + payout.amount, 0);
  const latest = inMonth.reduce<string | undefined>(
    (acc, payout) => (!acc || payout.paidAt > acc ? payout.paidAt : acc),
    undefined,
  );

  return {
    payslipNo: `PAY-${month.replace("-", "")}-${employee.id
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 6)
      .toUpperCase()}`,
    periodLabel: formatMonth(month),
    employeeName: employee.fullName,
    employeePosition: t(`personnel.types.${employee.employeeType}`, employee.employeeType),
    employeePhone: employee.phone,
    employeeIdCard: employee.idCardNumber,
    grossAmount: paid,
    netAmount: paid,
    salaryDue: employee.salaryDue ?? 0,
    paidAmount: paid,
    paymentDate: latest ? formatDate(latest) : undefined,
    // Salary is always paid out of a cashier's till.
    paymentMethod: inMonth.length > 0 ? t("payments.methods.CASH") : undefined,
    // Who signed for the money — the payout's own signature record.
    receivedBy:
      [...new Set(inMonth.map((payout) => payout.signatureName).filter(Boolean))].join(", ") ||
      undefined,
    paymentStatus: paid > 0 ? "PAID" : "PENDING",
    statusStamp: paid > 0 ? t("status.payroll.PAID") : undefined,
    salaryId: inMonth[0]?.id ?? employee.id,
  };
}
