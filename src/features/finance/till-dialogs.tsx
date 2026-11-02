import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";
import { useDialogBusy } from "@/components/ui/dialog-busy";
import { apiErrorMessage } from "@/lib/api-error-message";
import { formatDateTime, formatMoney } from "@/lib/utils";
import {
  useCashiers,
  useOpenTill,
  usePendingProvisions,
  useProvideCash,
} from "@/shared/hooks/use-cash-sessions";
import { TillForm, type TillFormProps } from "./till-form";

export interface TillAmountDialogProps extends Omit<TillFormProps, "onClose"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
}

/**
 * The dialog around {@link TillForm}, used for the till actions that take an
 * amount: a provision and the closing count.
 */
export function TillAmountDialog({
  open,
  onOpenChange,
  title,
  description,
  ...formProps
}: TillAmountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {open && <TillForm {...formProps} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

/**
 * The cashier opens their till. Nothing to type: it starts with what was counted
 * at its last closing, and the provisions the boss gave go in.
 */
export function OpenTillDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("till.openTill")}</DialogTitle>
          <DialogDescription>{t("till.openDescription")}</DialogDescription>
        </DialogHeader>
        {open && <OpenTillBody onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function OpenTillBody({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const pending = usePendingProvisions();
  const openTill = useOpenTill();
  const [error, setError] = useState<string>();
  useDialogBusy(openTill.isPending);

  const provisions = pending.data ?? [];
  const total = provisions.reduce((sum, provision) => sum + provision.amount, 0);

  async function confirm() {
    setError(undefined);
    try {
      await openTill.submitAsync({});
      onClose();
    } catch (cause) {
      setError(apiErrorMessage(cause));
    }
  }

  return (
    <div className="grid gap-3">
      <div className="rounded-lg bg-muted/60 p-3 text-sm">
        <div className="flex justify-between font-medium">
          <span>{t("till.pendingToReceive")}</span>
          <span>{formatMoney(total)}</span>
        </div>
        {provisions.length > 0 ? (
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {provisions.map((provision) => (
              <li key={provision.id} className="flex justify-between gap-3">
                <span className="truncate">
                  {t("till.providedBy", {
                    name: provision.providedByName ?? "—",
                    date: formatDateTime(provision.providedAt),
                  })}
                </span>
                <span className="shrink-0">{formatMoney(provision.amount)}</span>
              </li>
            ))}
          </ul>
        ) : (
          !pending.isPending && (
            <p className="mt-1 text-muted-foreground">{t("till.noPendingProvisions")}</p>
          )
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t("till.carryOverHint")}</p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={openTill.isPending}>
          {t("common.cancel")}
        </Button>
        <SubmitButton pending={openTill.isPending} onClick={confirm}>
          {t("till.openTill")}
        </SubmitButton>
      </DialogFooter>
    </div>
  );
}

/**
 * The boss gives a cashier cash. Into their till at once when it is open;
 * otherwise it waits for the cashier to open it. It never opens the till.
 */
export function ProvisionDialog({
  open,
  onOpenChange,
  defaultCashierId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selected, e.g. the cashier whose till is on screen. */
  defaultCashierId?: string;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("till.addProvision")}</DialogTitle>
          <DialogDescription>{t("till.provisionDescription")}</DialogDescription>
        </DialogHeader>
        {open && (
          <ProvisionBody
            defaultCashierId={defaultCashierId}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProvisionBody({
  defaultCashierId,
  onClose,
}: {
  defaultCashierId?: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const cashiers = useCashiers();
  const provide = useProvideCash();
  const list = cashiers.data ?? [];
  const [picked, setPicked] = useState(defaultCashierId ?? "");
  // The only cashier needs no choosing.
  const chosen = picked || (list.length === 1 ? list[0].id : "");
  const cashier = list.find((candidate) => candidate.id === chosen);

  return (
    <TillForm
      header={
        <Field
          label={t("till.cashier")}
          htmlFor="provision-cashier"
          required
          hint={
            cashiers.isSuccess && list.length === 0
              ? t("till.noCashiers")
              : cashier
                ? t(cashier.openSessionId ? "till.cashierTillOpen" : "till.cashierTillClosed")
                : undefined
          }
        >
          <Select
            value={chosen}
            onValueChange={setPicked}
            disabled={cashiers.isPending || list.length === 0}
          >
            <SelectTrigger id="provision-cashier" className="w-full">
              <SelectValue placeholder={t("till.chooseCashier")} />
            </SelectTrigger>
            <SelectContent>
              {list.map((candidate) => (
                <SelectItem key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      }
      canSubmit={Boolean(chosen)}
      amountLabel={t("till.provisionAmount")}
      submitLabel={t("till.addProvision")}
      saving={provide.isPending}
      onSubmit={(amount, notes) => provide.submitAsync({ cashierId: chosen, amount, notes })}
      onClose={onClose}
    />
  );
}
