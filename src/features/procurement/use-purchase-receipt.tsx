import { useTranslation } from "react-i18next";
import { purchasesApi } from "@/api/purchases";
import { PurchaseReceipt } from "@/components/documents/purchase-receipt";
import { useDocumentPrinter } from "@/components/documents/print-context";
import { formatReceiptNo, type ReceiptSettlement } from "@/components/documents/types";
import { useAuth } from "@/shared/hooks/useAuth";
import { useCompanyIdentity } from "@/shared/hooks/use-company-identity";
import { formatDateTime } from "@/lib/utils";
import { PaymentMethod, PaymentStatus, PermissionKey } from "@/enums";
import type { PartnerResponse, PurchaseResponse } from "@/interfaces";

/**
 * Prints a purchase receipt. The party's name and phone come from the partner
 * (a purchase stores only the partner id); the figures come straight off the
 * purchase, which the server already priced.
 */
export function usePurchaseReceiptPrinter() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const printer = useDocumentPrinter();
  const { company } = useCompanyIdentity();

  /**
   * How the purchase was settled: the part that repaid a prefinance (offset
   * payments, no cash) and the money actually paid. Read fresh at print time;
   * `undefined` when the payments cannot be read, so the receipt still prints.
   */
  async function receiptSettlement(
    purchase: PurchaseResponse,
  ): Promise<ReceiptSettlement | undefined> {
    if (!hasPermission(PermissionKey.PAYMENT_READ)) return undefined;
    try {
      const payments = (await purchasesApi.payments(purchase.id)).filter(
        (payment) => payment.status !== PaymentStatus.VOIDED,
      );
      const offsets = payments.filter((p) => p.method === PaymentMethod.PREFINANCE_OFFSET);
      const paid = payments.filter((p) => p.method !== PaymentMethod.PREFINANCE_OFFSET);
      const settled = payments.reduce((sum, p) => sum + p.amount, 0);
      return {
        prefinanceRepaid: offsets.reduce((sum, p) => sum + p.amount, 0),
        payments: paid.map((p) => ({
          methodLabel: t(`payments.methods.${p.method}`, p.method),
          amount: p.amount,
          reference: p.reference,
        })),
        remaining: purchase.payable?.remaining ?? Math.max(purchase.amount - settled, 0),
      };
    } catch {
      return undefined;
    }
  }

  return async function printReceipt(
    purchase: PurchaseResponse,
    partner: PartnerResponse | undefined,
  ) {
    const partnerId = purchase.farmerId ?? purchase.buyerId ?? "";
    const settlement = await receiptSettlement(purchase);
    printer.printDocument(
      <PurchaseReceipt
        company={company}
        data={{
          receiptNo: formatReceiptNo(purchase.id, purchase.purchaseDate),
          purchaseDate: formatDateTime(purchase.purchaseDate),
          party: {
            kind: purchase.farmerId ? "FARMER" : "BUYER",
            name: partner?.name ?? (partnerId || "—"),
            phone: partner?.phone,
          },
          grossWeight: purchase.grossWeight,
          // Never guessed: an unmeasured humidity prints as "—".
          humidity: purchase.humidity ?? null,
          refraction: purchase.refraction ?? purchase.grossWeight - purchase.netWeight,
          netWeight: purchase.netWeight,
          unitPrice: purchase.unitPrice,
          // A buyer's purchase at their prefinance price carries no published
          // price id (see PurchaseService.create).
          pricing: purchase.buyerId && !purchase.priceId ? "AGREED" : "MARKET",
          amount: purchase.amount,
          currency: purchase.currency,
          settlement,
          deliveries: (purchase.deliveries ?? []).map((line) => ({
            time: formatDateTime(line.deliveredAt),
            grossWeight: line.grossWeight,
            netWeight: line.netWeight,
            unitPrice: line.unitPrice,
            amount: line.amount,
          })),
          reference: purchase.id,
        }}
      />,
    );
  };
}
