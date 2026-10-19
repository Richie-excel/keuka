import { useTranslation } from "react-i18next";
import { formatMoney, formatWeight } from "@/lib/utils";
import {
  DocumentFooter,
  DocumentHeader,
  DocumentWatermark,
  Line,
} from "@/components/documents/document-frame";
import type {
  CompanyIdentity,
  PurchaseReceiptData,
} from "@/components/documents/types";


export function PurchaseReceipt({
  data,
  company,
}: {
  data: PurchaseReceiptData;
  company: CompanyIdentity;
}) {
  const { t } = useTranslation();
  const percent = (value?: number | null) =>
    value === null || value === undefined ? "—" : `${value.toFixed(2)} %`;

  const settlement = data.settlement;
  const lines = data.deliveries ?? [];
  const partyLabel =
    data.party.kind === "FARMER"
      ? t("documents.receipt.farmer")
      : t("documents.receipt.buyer");

  return (
    <div className="relative mx-auto w-full max-w-[180mm] overflow-hidden bg-white p-6 text-black sm:p-8">
      <DocumentWatermark text={company.legalName || company.displayName} />

      <div className="relative z-10">
        <DocumentHeader company={company} title={t("documents.receipt.title")} />

        <section className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
          <MetaLine
            label={t("documents.receipt.receiptNo")}
            value={data.receiptNo}
          />
          <MetaLine label={partyLabel} value={data.party.name} />
          <MetaLine label={t("documents.receipt.date")} value={data.purchaseDate} />
          <MetaLine
            label={t("documents.receipt.phone")}
            value={data.party.phone ?? "—"}
          />
        </section>

        {lines.length > 1 && (
          <section className="mt-4">
            <h3 className="text-xs font-semibold uppercase">
              {t("documents.receipt.deliveriesHeading", { count: lines.length })}
            </h3>
            <table className="mt-1 w-full text-[10px]">
              <thead>
                <tr className="border-b border-black/40 text-left">
                  <th className="py-0.5 font-medium">{t("documents.receipt.time")}</th>
                  <th className="py-0.5 text-right font-medium">{t("documents.receipt.grossWeight")}</th>
                  <th className="py-0.5 text-right font-medium">{t("documents.receipt.netWeight")}</th>
                  <th className="py-0.5 text-right font-medium">{t("documents.receipt.price")}</th>
                  <th className="py-0.5 text-right font-medium">{t("documents.receipt.amount")}</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index} className="border-b border-dotted border-black/20">
                    <td className="py-0.5">{line.time}</td>
                    <td className="py-0.5 text-right">{formatWeight(line.grossWeight)}</td>
                    <td className="py-0.5 text-right">{formatWeight(line.netWeight)}</td>
                    <td className="py-0.5 text-right">{formatMoney(line.unitPrice)}/kg</td>
                    <td className="py-0.5 text-right">{formatMoney(line.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className="mt-4">
          <h3 className="text-xs font-semibold uppercase">
            {t(lines.length > 1 ? "documents.receipt.dayTotalHeading" : "documents.receipt.measurementsHeading")}
            <span className="font-normal normal-case text-black/60">
              {" "}
              {t("documents.receipt.measurementsNote")}
            </span>
          </h3>
          <table className="mt-1 w-full text-xs">
            <tbody>
              <Line
                label={t("documents.receipt.grossWeight")}
                value={formatWeight(data.grossWeight)}
              />
              <Line
                label={t("documents.receipt.humidity")}
                value={percent(data.humidity)}
              />
              <Line
                label={t("documents.receipt.refraction")}
                value={formatWeight(data.refraction)}
              />
              <Line
                label={t("documents.receipt.netWeight")}
                value={formatWeight(data.netWeight)}
                strong
              />
            </tbody>
          </table>
        </section>

        <section className="mt-4 rounded border border-black/60 p-3 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-black/70">
              {t(
                data.pricing === "AGREED"
                  ? "documents.receipt.agreedPrice"
                  : "documents.receipt.unitPrice",
              )}
            </span>
            <span className="font-medium">{formatMoney(data.unitPrice)}/kg</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-4 border-t border-dashed border-black/40 pt-2">
            <span className="text-sm font-bold uppercase">
              {t("documents.receipt.totalAmount")}
            </span>
            <span className="text-sm font-bold">
              {formatMoney(data.amount)}
            </span>
          </div>

          {settlement && (
            <div className="mt-2 space-y-1 border-t border-dashed border-black/40 pt-2">
              {settlement.prefinanceRepaid > 0 && (
                <SettlementRow
                  label={t("documents.receipt.prefinanceRepaid")}
                  value={`− ${formatMoney(settlement.prefinanceRepaid)}`}
                />
              )}
              {settlement.payments.map((payment, index) => (
                <SettlementRow
                  key={index}
                  label={
                    payment.reference
                      ? t("documents.receipt.paidWithRef", {
                          method: payment.methodLabel,
                          ref: payment.reference,
                        })
                      : t("documents.receipt.paidWith", { method: payment.methodLabel })
                  }
                  value={`− ${formatMoney(payment.amount)}`}
                />
              ))}
              <div className="flex items-center justify-between gap-4 pt-1 text-sm font-bold">
                <span className="uppercase">
                  {settlement.remaining > 0
                    ? t("documents.receipt.stillOwed")
                    : t("documents.receipt.settledInFull")}
                </span>
                <span>{formatMoney(settlement.remaining)}</span>
              </div>
            </div>
          )}
        </section>

        <section className="mt-10 grid grid-cols-3 gap-6 text-center text-[10px]">
          {[
            t(
              data.party.kind === "FARMER"
                ? "documents.receipt.signFarmer"
                : "documents.receipt.signBuyer",
            ),
            t("documents.receipt.signWarehouse"),
            t("documents.receipt.signCashier"),
          ].map((label) => (
            <div key={label}>
              <p className="font-semibold">{label}</p>
              <div className="mt-1 h-14 border-b border-dashed border-black/40" />
            </div>
          ))}
        </section>

        <DocumentFooter reference={data.reference} />
      </div>
    </div>
  );
}

function SettlementRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-black/70">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

/** A label/value line that reads like the printed form (label then value). */
function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between gap-2">
      <span className="font-medium">
        {label}: <span className="font-normal">{value}</span>
      </span>
    </p>
  );
}
