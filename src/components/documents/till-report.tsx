import { useTranslation } from "react-i18next";
import { formatMoney } from "@/lib/utils";
import {
  DocumentPage,
  MetaRow,
  SectionTitle,
  Signatures,
} from "@/components/documents/document-frame";
import type {
  CompanyIdentity,
  TillReportData,
  TillReportLine,
} from "@/components/documents/types";

const signed = (amount: number) => `${amount < 0 ? "−" : "+"} ${formatMoney(Math.abs(amount))}`;

/**
 * A till's report for the boss: the float, every provision, the cash paid out
 * by kind, what the till should hold, what was counted and the variance.
 * Printed for an open till it is an interim report (no count yet).
 *
 * Every figure comes from the server's own till movements and totals.
 */
export function TillReport({
  data,
  company,
}: {
  data: TillReportData;
  company: CompanyIdentity;
}) {
  const { t } = useTranslation();
  const variance = data.variance ?? 0;

  return (
    <DocumentPage
      company={company}
      title={t(data.isOpen ? "documents.till.interimTitle" : "documents.till.title")}
      reference={data.reference}
    >
      <section className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
        <MetaRow label={t("documents.till.reportNo")} value={data.reportNo} />
        <MetaRow label={t("documents.till.cashier")} value={data.cashierName} />
        <MetaRow label={t("documents.till.openedAt")} value={data.openedAt} />
        <MetaRow
          label={t("documents.till.closedAt")}
          value={data.closedAt ?? t("documents.till.stillOpen")}
        />
        {data.closedByName && (
          <MetaRow label={t("documents.till.closedBy")} value={data.closedByName} />
        )}
      </section>

      <section className="mt-4 rounded border border-black/60 p-3 text-xs">
        <SummaryRow label={t("documents.till.openingFloat")} value={formatMoney(data.openingBalance)} />
        <SummaryRow label={t("documents.till.provisions")} value={`+ ${formatMoney(data.totalProvisions)}`} />
        <SummaryRow label={t("documents.till.payouts")} value={`− ${formatMoney(data.totalPayouts)}`} />
        <div className="mt-2 flex items-center justify-between gap-4 border-t border-dashed border-black/40 pt-2 text-sm font-bold">
          <span className="uppercase">
            {t(data.isOpen ? "documents.till.inTillNow" : "documents.till.expected")}
          </span>
          <span>{formatMoney(data.expected)}</span>
        </div>
        {!data.isOpen && (
          <>
            <SummaryRow label={t("documents.till.counted")} value={formatMoney(data.declared ?? 0)} />
            <div className="mt-1 flex items-center justify-between gap-4 font-bold">
              <span>{t("documents.till.variance")}</span>
              <span>
                {variance === 0 ? formatMoney(0) : signed(variance)}
                {variance !== 0 && (
                  <span className="ml-1 font-normal text-black/60">
                    ({t(variance < 0 ? "documents.till.shortage" : "documents.till.surplus")})
                  </span>
                )}
              </span>
            </div>
          </>
        )}
      </section>

      {data.payoutsByType.length > 0 && (
        <section className="mt-4">
          <SectionTitle>{t("documents.till.payoutsByType")}</SectionTitle>
          <table className="mt-1 w-full text-xs">
            <tbody>
              {data.payoutsByType.map((row) => (
                <tr key={row.label}>
                  <td className="py-0.5 text-black/70">{row.label}</td>
                  <td className="py-0.5 text-center text-black/60">×{row.count}</td>
                  <td className="py-0.5 text-right">{formatMoney(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <LinesTable title={t("documents.till.provisionsHeading")} lines={data.provisions} empty={t("documents.till.none")} />
      <LinesTable title={t("documents.till.movementsHeading")} lines={data.movements} empty={t("documents.till.none")} />

      {data.notes && (
        <p className="mt-3 text-xs">
          <span className="text-black/60">{t("documents.till.notes")}: </span>
          {data.notes}
        </p>
      )}

      <Signatures labels={[t("documents.till.signCashier"), t("documents.till.signManager")]} />
    </DocumentPage>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-1 flex items-center justify-between gap-4 first:mt-0">
      <span className="text-black/70">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function LinesTable({ title, lines, empty }: { title: string; lines: TillReportLine[]; empty: string }) {
  return (
    <section className="mt-4">
      <SectionTitle>{title}</SectionTitle>
      {lines.length === 0 ? (
        <p className="mt-1 text-xs text-black/60">{empty}</p>
      ) : (
        <table className="mt-1 w-full text-[10px]">
          <tbody>
            {lines.map((line, index) => (
              <tr key={index} className="border-b border-dotted border-black/20 align-top">
                <td className="py-0.5 pr-2 whitespace-nowrap text-black/60">{line.when}</td>
                <td className="py-0.5 pr-2">{line.label}</td>
                <td className="py-0.5 pr-2 text-black/60">{line.description || ""}</td>
                <td className="py-0.5 text-right whitespace-nowrap">{signed(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
