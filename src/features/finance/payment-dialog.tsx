import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import type { CreatePaymentRequest, PurchaseResponse } from "@/interfaces";
import { Button } from "@/components/ui/button";
import { PaymentForm } from "./payment-form";

export interface PaymentDialogProps {
  open: boolean;
  purchases: PurchaseResponse[];
  /** The seller's name for a purchase (farmer or buyer). */
  partnerName: (purchase: PurchaseResponse) => string;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (purchaseId: string, input: CreatePaymentRequest) => Promise<void>;
}

export function PaymentDialog({
  open,
  purchases,
  partnerName,
  pending,
  onOpenChange,
  onSave,
}: PaymentDialogProps) {
  const { t } = useTranslation();

  const unpaid = purchases.filter(
    (purchase) => (purchase.payable?.remaining ?? 0) > 0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("payments.newPaymentTitle")}</DialogTitle>
          <DialogDescription>
            {t("payments.newPaymentDescription")}
          </DialogDescription>
        </DialogHeader>
        {unpaid.length === 0 ? (
          <>
            <p className="text-sm text-cocoa-500">{t("payments.allPaidUp")}</p>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("common.cancel")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Mounted only while the dialog is open, so every opening starts
          // from fresh defaults and no reset effect is needed.
          <PaymentForm
            unpaid={unpaid}
            partnerName={partnerName}
            pending={pending}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
