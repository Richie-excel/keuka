import { useTranslation } from "react-i18next";
import { formatWeight } from "@/lib/utils";
import {
  DocumentPage,
  Line,
  MetaRow,
  SectionTitle,
  Signatures,
} from "@/components/documents/document-frame";
import type { CompanyIdentity, DeliveryNoteData } from "@/components/documents/types";

/**
 * The delivery note (bordereau de livraison) that travels with a truck
 * loading. It states what LEFT the warehouse — the company's declared
 * weights — and leaves a reception box for the partner to write what
 * ARRIVED. The two are separate facts: the declared weights are never amended.
 */
export function DeliveryNote({
  data,
  company,
}: {
  data: DeliveryNoteData;
  company: CompanyIdentity;
}) {
  const { t } = useTranslation();

  return (
    <DocumentPage company={company} title={t("documents.deliveryNote.title")} reference={data.reference}>
      <section className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
        <MetaRow label={t("documents.deliveryNote.noteNo")} value={data.noteNo} />
        <MetaRow label={t("documents.deliveryNote.date")} value={data.date} />
        <MetaRow label={t("documents.deliveryNote.destination")} value={data.destination} />
        <MetaRow label={t("documents.deliveryNote.status")} value={data.statusLabel} />
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
        <section>
          <SectionTitle>{t("documents.deliveryNote.consignee")}</SectionTitle>
          <table className="mt-1 w-full">
            <tbody>
              <Line label={t("documents.deliveryNote.name")} value={data.consignee.name} />
              <Line label={t("documents.deliveryNote.location")} value={data.consignee.location || "—"} />
              <Line label={t("documents.deliveryNote.contact")} value={data.consignee.contactPerson || "—"} />
              <Line label={t("documents.deliveryNote.phone")} value={data.consignee.phone || "—"} />
            </tbody>
          </table>
        </section>
        <section>
          <SectionTitle>{t("documents.deliveryNote.transport")}</SectionTitle>
          <table className="mt-1 w-full">
            <tbody>
              <Line
                label={t("documents.deliveryNote.vehicle")}
                value={[data.vehicleNumber, data.vehicleType].filter(Boolean).join(" · ")}
              />
              <Line label={t("documents.deliveryNote.driver")} value={data.driverName} />
              <Line label={t("documents.deliveryNote.license")} value={data.driverLicense} />
              <Line label={t("documents.deliveryNote.phone")} value={data.driverPhone || "—"} />
              {data.escortName && (
                <Line label={t("documents.deliveryNote.escort")} value={data.escortName} />
              )}
            </tbody>
          </table>
        </section>
      </div>

      <section className="mt-4 rounded border border-black/60 p-3 text-xs">
        <SectionTitle>{t("documents.deliveryNote.goods")}</SectionTitle>
        <p className="mt-1">{t("documents.deliveryNote.goodsDescription")}</p>
        {data.bagCount != null && (
          <div className="mt-2 flex items-center justify-between gap-4">
            <span className="text-black/70">{t("documents.deliveryNote.bags")}</span>
            <span className="font-medium">{data.bagCount}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between gap-4">
          <span className="text-black/70">{t("documents.deliveryNote.declaredGross")}</span>
          <span className="font-medium">{formatWeight(data.declaredGrossWeight)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4 border-t border-dashed border-black/40 pt-2">
          <span className="text-sm font-bold uppercase">{t("documents.deliveryNote.declaredNet")}</span>
          <span className="text-sm font-bold">{formatWeight(data.declaredNetWeight)}</span>
        </div>
      </section>

      {data.notes && (
        <p className="mt-3 text-xs">
          <span className="text-black/60">{t("documents.deliveryNote.notes")}: </span>
          {data.notes}
        </p>
      )}

      {/* Filled in by hand by the partner on reception. */}
      <section className="mt-4 rounded border border-dashed border-black/50 p-3 text-xs">
        <SectionTitle>{t("documents.deliveryNote.reception")}</SectionTitle>
        <p className="mt-1 text-[10px] text-black/60">{t("documents.deliveryNote.receptionHint")}</p>
        <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {[
            t("documents.deliveryNote.receivedGross"),
            t("documents.deliveryNote.receivedNet"),
            t("documents.deliveryNote.receivedOn"),
            t("documents.deliveryNote.remarks"),
          ].map((label) => (
            <div key={label} className="flex items-end gap-2">
              <span className="shrink-0 text-black/70">{label}:</span>
              <span className="h-4 flex-1 border-b border-dotted border-black/50" />
            </div>
          ))}
        </div>
      </section>

      <Signatures
        labels={[
          t("documents.deliveryNote.signDispatcher"),
          t("documents.deliveryNote.signDriver"),
          t("documents.deliveryNote.signReceiver"),
        ]}
      />
    </DocumentPage>
  );
}
