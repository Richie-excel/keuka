import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PricingForm } from "@/features/pricing/pricing-form";
import { apiErrorMessage } from "@/lib/api-error-message";
import type { CocoaPriceResponse, CreateCocoaPriceRequest } from "@/interfaces";
import { formatMoney } from "@/lib/utils";


export function PricingDialog({
  open,
  onOpenChange,
  currentPrice,
  publishing,
  onPublish,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPrice?: CocoaPriceResponse | null;
  publishing: boolean;
  onPublish: (request: CreateCocoaPriceRequest) => Promise<unknown>;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("pricing.publishTitle")}</DialogTitle>
          <DialogDescription>{t("pricing.publishDescription")}</DialogDescription>
        </DialogHeader>

        {open && (
          <PricingDialogBody
            currentPrice={currentPrice}
            publishing={publishing}
            onClose={() => onOpenChange(false)}
            onPublish={onPublish}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * The form plus the confirmation gate.
 *
 * WHY A GATE AND NOT JUST A SUBMIT BUTTON — the price written here values EVERY
 * purchase recorded from that moment on, and it cannot be taken back: the backend
 * closes the previous interval rather than editing it, and purchases already
 * recorded keep the price they snapshotted. A mistyped "15000" for "1500" would
 * not be a typo a later edit fixes; it would be a day of overpaid farmers. The
 * second click is cheap; that is not.
 */
function PricingDialogBody({
  currentPrice,
  publishing,
  onClose,
  onPublish,
}: {
  currentPrice?: CocoaPriceResponse | null;
  publishing: boolean;
  onClose: () => void;
  onPublish: (request: CreateCocoaPriceRequest) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  /** The validated price awaiting "yes" — null means the gate is closed. */
  const [pending, setPending] = useState<CreateCocoaPriceRequest | null>(null);
  const [error, setError] = useState<string>();

  async function publish() {
    if (!pending) return;
    try {
      await onPublish(pending);
      onClose();
    } catch (cause) {
      // The gate closes either way, so the failure is reported here — behind it —
      // leaving the number the Boss typed in place to correct and retry.
      setError(apiErrorMessage(cause));
      setPending(null);
    }
  }

  return (
    <>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <PricingForm
        currentPrice={currentPrice}
        saving={publishing}
        onCancel={onClose}
        onSave={setPending}
      />

      <ConfirmDialog
        open={pending !== null}
        icon={TrendingUp}
        title={t("pricing.confirmTitle")}
        description={t("pricing.confirmDescription", {
          price: pending ? formatMoney(pending.pricePerKg) : "",
        })}
        confirmLabel={t("pricing.confirmLabel")}
        loading={publishing}
        onConfirm={publish}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
