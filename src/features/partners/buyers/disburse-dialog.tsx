import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { useDialogBusy } from "@/components/ui/dialog-busy";
import { PaymentMethod } from "@/enums";
import type { PrefinanceResponse } from "@/interfaces";
import { apiErrorMessage } from "@/lib/api-error-message";
import { formatMoney } from "@/lib/utils";
import { useOpenCashSession } from "@/shared/hooks/use-cash-sessions";
import { useDisbursePrefinance } from "@/shared/hooks/use-prefinances";

/**
 * Hands over in cash what an advance still has to give: an advance recorded
 * before advances were paid out as they were recorded. The cash leaves the
 * till and the buyer owes it.
 */
export function DisburseDialog({
  prefinance,
  onOpenChange,
}: {
  prefinance: PrefinanceResponse | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={Boolean(prefinance)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("buyers.disburse.title")}</DialogTitle>
          <DialogDescription>{t("buyers.disburse.description")}</DialogDescription>
        </DialogHeader>
        {prefinance && (
          <DisburseBody prefinance={prefinance} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DisburseBody({
  prefinance,
  onClose,
}: {
  prefinance: PrefinanceResponse;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const tillQuery = useOpenCashSession();
  const till = tillQuery.openSession;
  const disburse = useDisbursePrefinance();
  const [error, setError] = useState<string>();
  useDialogBusy(disburse.isPending);

  const remaining = prefinance.amount - prefinance.disbursedAmount;
  const exceedsTill = Boolean(till && remaining > till.availableBalance);

  async function confirm() {
    setError(undefined);
    try {
      await disburse.submitAsync({
        id: prefinance.id,
        input: { amount: remaining, method: PaymentMethod.CASH },
      });
      onClose();
    } catch (cause) {
      setError(apiErrorMessage(cause));
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex justify-between rounded-lg bg-muted/60 p-3 text-sm font-medium">
        <span>{t("buyers.disburse.amount")}</span>
        <span>{formatMoney(remaining)}</span>
      </div>
      <p
        role="status"
        className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${
          till && !exceedsTill ? "bg-pod-100 text-pod-700" : "bg-amber-100 text-amber-700"
        }`}
      >
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {tillQuery.isPending ? (
          "…"
        ) : till ? (
          t(exceedsTill ? "purchases.paidNow.exceedsTill" : "purchases.paidNow.tillAvailable", {
            amount: formatMoney(till.availableBalance),
          })
        ) : (
          <span>
            {t("purchases.paidNow.noTill")}{" "}
            <Link to="/finance/till" className="font-medium underline">
              {t("purchases.paidNow.openTill")}
            </Link>
          </span>
        )}
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={disburse.isPending}>
          {t("common.cancel")}
        </Button>
        <SubmitButton
          pending={disburse.isPending}
          disabled={!till || exceedsTill}
          onClick={confirm}
        >
          {t("buyers.disburse.submit")}
        </SubmitButton>
      </DialogFooter>
    </div>
  );
}
