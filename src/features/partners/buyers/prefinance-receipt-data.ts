import type { TFunction } from "i18next";
import { formatDate } from "@/lib/utils";
import { formatDocumentNo, type PrefinanceReceiptData } from "@/components/documents/types";
import type { PartnerResponse, PrefinanceResponse } from "@/interfaces";

/** A prefinance advance as the buyer's printed acknowledgement. */
export function toPrefinanceReceiptData(
  prefinance: PrefinanceResponse,
  buyer: PartnerResponse | undefined,
  t: TFunction,
): PrefinanceReceiptData {
  const price = prefinance.historicalUnitPrice;
  return {
    receiptNo: formatDocumentNo("PF", prefinance.id, prefinance.advanceDate),
    advanceDate: formatDate(prefinance.advanceDate),
    buyer: {
      name: buyer?.name ?? prefinance.buyerName ?? prefinance.buyerId,
      phone: buyer?.phone,
      idCard: buyer?.idCardNumber,
      address: buyer?.address,
    },
    amount: prefinance.amount,
    pricePerKg: price,
    equivalentKg: price > 0 ? Math.round((prefinance.amount / price) * 1000) / 1000 : 0,
    deliveredQuantity: prefinance.deliveredQuantity,
    repaidValue: prefinance.deliveredValue,
    outstanding: prefinance.outstandingAdvance,
    statusLabel: t(`status.prefinance.${prefinance.status}`, prefinance.status),
    notes: prefinance.notes,
    reference: prefinance.id,
  };
}
