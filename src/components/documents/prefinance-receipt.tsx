import { useTranslation } from "react-i18next";
import { formatMoney, formatWeight } from "@/lib/utils";
import {
  DocumentPage,
  Line,
  MetaRow,
  SectionTitle,
  Signatures,
} from "@/components/documents/document-frame";
import type { CompanyIdentity, PrefinanceReceiptData } from "@/components/documents/types";

/**
 * The buyer's acknowledgement of a prefinance advance — the proof of the debt.
 * It states the money advanced and the agreed price per kg at which the buyer
 * repays it in cocoa, then where the advance stands on the day it is printed.
 */
export function PrefinanceReceipt({
  data,
  company,
}: {
  data: PrefinanceReceiptData;
  company: CompanyIdentity;
}) {
  const { t } = useTranslation();

  return (
    <DocumentPage company={company} title={t("documents.prefinance.title")} reference={data.reference}>
      <section className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
        <MetaRow label={t("documents.prefinance.receiptNo")} value={data.receiptNo} />
        <MetaRow label={t("documents.prefinance.advanceDate")} value={data.advanceDate} />
        <MetaRow label={t("documents.prefinance.buyer")} value={data.buyer.name} />
        <MetaRow label={t("documents.prefinance.phone")} value={data.buyer.phone || "—"} />
        <MetaRow label={t("documents.prefinance.idCard")} value={data.buyer.idCard || "—"} />
        <MetaRow label={t("documents.prefinance.address")} value={data.buyer.address || "—"} />
      </section>

      <section className="mt-4 rounded border border-black/60 p-3 text-xs">
        <SectionTitle>{t("documents.prefinance.terms")}</SectionTitle>
        <div className="mt-2 flex items-center justify-between gap-4">
          <span className="text-black/70">{t("documents.prefinance.agreedPrice")}</span>
          <span className="font-medium">{formatMoney(data.pricePerKg)}/kg</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-4">
          <span className="text-black/70">{t("documents.prefinance.equivalent")}</span>
          <span className="font-medium">{formatWeight(data.equivalentKg)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4 border-t border-dashed border-black/40 pt-2">
          <span className="text-sm font-bold uppercase">{t("documents.prefinance.amount")}</span>
          <span className="text-sm font-bold">{formatMoney(data.amount)}</span>
        </div>
      </section>

      <p className="mt-3 text-xs leading-relaxed">
        {t("documents.prefinance.commitment", {
          name: data.buyer.name,
          amount: formatMoney(data.amount),
          price: formatMoney(data.pricePerKg),
        })}
      </p>

      <section className="mt-4">
        <SectionTitle>{t("documents.prefinance.statement")}</SectionTitle>
        <table className="mt-1 w-full text-xs">
          <tbody>
            <Line label={t("documents.prefinance.delivered")} value={formatWeight(data.deliveredQuantity)} />
            <Line label={t("documents.prefinance.repaid")} value={formatMoney(data.repaidValue)} />
            <Line label={t("documents.prefinance.outstanding")} value={formatMoney(data.outstanding)} strong />
            <Line label={t("documents.prefinance.status")} value={data.statusLabel} />
          </tbody>
        </table>
      </section>

      {data.notes && (
        <p className="mt-3 text-xs">
          <span className="text-black/60">{t("documents.prefinance.notes")}: </span>
          {data.notes}
        </p>
      )}

      <Signatures
        labels={[
          t("documents.prefinance.signBuyer"),
          t("documents.prefinance.signManager"),
          t("documents.prefinance.signCashier"),
        ]}
      />
    </DocumentPage>
  );
}
