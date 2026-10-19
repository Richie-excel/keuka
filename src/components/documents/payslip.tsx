import { useTranslation } from "react-i18next";
import { formatMoney } from "@/lib/utils";
import {
  DocumentFooter,
  DocumentHeader,
  DocumentWatermark,
  Line,
  MetaRow,
} from "@/components/documents/document-frame";
import type { CompanyIdentity, PayslipData } from "@/components/documents/types";

/**
 * An employee's salary statement for one month.
 *
 * Layout: letterhead, the employee block, earnings, any deductions, the money
 * box (gross → net, plus what is still owed), payment details when a payment
 * was made in the period, and two signature lines. Every amount comes from the
 * server; the payslip never recomputes money.
 */
export function Payslip({
  data,
  company,
}: {
  data: PayslipData;
  company: CompanyIdentity;
}) {
  const { t } = useTranslation();
  const deductions = data.deductions ?? [];
  const hasDeductions = deductions.length > 0;
  const hasPayment = Boolean(data.paymentDate);

  return (
    <div className="relative mx-auto w-full max-w-[180mm] overflow-hidden bg-white p-6 text-black sm:p-8">
      <DocumentWatermark text={company.legalName || company.displayName} />
      {data.statusStamp && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center"
        >
          <span className="-rotate-12 text-4xl font-black uppercase tracking-[0.35em] text-black/10 sm:text-5xl">
            {data.statusStamp}
          </span>
        </div>
      )}

      <div className="relative z-10">
        <DocumentHeader
          company={company}
          title={t("documents.payslip.title")}
        />

        <section className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
          <MetaRow
            label={t("documents.payslip.payslipNo")}
            value={data.payslipNo}
          />
          <MetaRow
            label={t("documents.payslip.period")}
            value={data.periodLabel}
          />
          <MetaRow
            label={t("documents.payslip.employee")}
            value={data.employeeName}
          />
          <MetaRow
            label={t("documents.payslip.position")}
            value={data.employeePosition ?? "—"}
          />
          <MetaRow
            label={t("documents.payslip.phone")}
            value={data.employeePhone ?? "—"}
          />
          <MetaRow
            label={t("documents.payslip.idCard")}
            value={data.employeeIdCard ?? "—"}
          />
          <MetaRow
            label={t("documents.payslip.status")}
            value={t(`status.payroll.${data.paymentStatus}`)}
          />
        </section>

        <section className="mt-4">
          <h3 className="text-xs font-semibold uppercase">
            {t("documents.payslip.earnings")}
          </h3>
          <table className="mt-1 w-full text-xs">
            <tbody>
              <Line
                label={t("documents.payslip.baseSalary")}
                value={formatMoney(data.grossAmount)}
              />
            </tbody>
          </table>
        </section>

        {hasDeductions && (
          <section className="mt-3">
            <h3 className="text-xs font-semibold uppercase">
              {t("documents.payslip.deductions")}
            </h3>
            <table className="mt-1 w-full text-xs">
              <tbody>
                {deductions.map((deduction) => (
                  <Line
                    key={deduction.label}
                    label={deduction.label}
                    value={`− ${formatMoney(deduction.amount)}`}
                  />
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Money box: stacked rows, dashed separator, bold NET PAY. */}
        <section className="mt-4 rounded border border-black/60 p-3 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-black/70">
              {t("documents.payslip.grossPay")}
            </span>
            <span className="font-medium">{formatMoney(data.grossAmount)}</span>
          </div>
          {hasDeductions && (
            <div className="mt-2 flex items-center justify-between gap-4">
              <span className="text-black/70">
                {t("documents.payslip.deductionsTotal")}
              </span>
              <span className="font-medium">
                − {formatMoney(deductions.reduce((sum, d) => sum + d.amount, 0))}
              </span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between gap-4 border-t border-dashed border-black/40 pt-2">
            <span className="text-sm font-bold uppercase">
              {t("documents.payslip.netPay")}
            </span>
            <span className="text-sm font-bold">
              {formatMoney(data.netAmount)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-4 border-t border-dashed border-black/40 pt-2">
            <span className="text-black/70">
              {t("documents.payslip.outstanding")}
            </span>
            <span className="font-medium">{formatMoney(data.salaryDue)}</span>
          </div>
        </section>

        {hasPayment && (
          <section className="mt-4">
            <h3 className="text-xs font-semibold uppercase">
              {t("documents.payslip.paymentDetails")}
            </h3>
            <table className="mt-1 w-full text-xs">
              <tbody>
                <Line
                  label={t("documents.payslip.paidOn")}
                  value={data.paymentDate ?? "—"}
                />
                <Line
                  label={t("documents.payslip.method")}
                  value={data.paymentMethod ?? "—"}
                />
                {data.paymentReference && (
                  <Line
                    label={t("documents.payslip.reference")}
                    value={data.paymentReference}
                  />
                )}
                {data.receivedBy && (
                  <Line
                    label={t("documents.payslip.receivedBy")}
                    value={data.receivedBy}
                  />
                )}
                {data.paidAmount !== undefined && (
                  <Line
                    label={t("documents.payslip.paidAmount")}
                    value={formatMoney(data.paidAmount)}
                    strong
                  />
                )}
              </tbody>
            </table>
          </section>
        )}

        <section className="mt-10 grid grid-cols-2 gap-6 text-center text-[10px]">
          {[
            t("documents.payslip.signEmployee"),
            t("documents.payslip.signPaidBy"),
          ].map((label) => (
            <div key={label}>
              <p className="font-semibold">{label}</p>
              <div className="mt-1 h-14 border-b border-dashed border-black/40" />
            </div>
          ))}
        </section>

        <DocumentFooter
          copyLabel={data.copyLabel}
          reference={data.salaryId}
        />
      </div>
    </div>
  );
}
