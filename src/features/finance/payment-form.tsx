import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Banknote, Hash } from "lucide-react";
import { Field } from "@/components/field";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { useDialogBusy } from "@/components/ui/dialog-busy";
import { useOpenCashSession } from "@/shared/hooks/use-cash-sessions";
import { useAuth } from "@/shared/hooks/useAuth";
import { MANUAL_PAYMENT_METHODS, PaymentMethod, PermissionKey } from "@/enums";
import { formatMoney } from "@/lib/utils";
import type { PurchaseResponse } from "@/interfaces";
import type { PaymentDialogProps } from "./payment-dialog";
import { DialogFooter } from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { sanitizeAmountInput } from "@/lib/amount";
import { apiErrorMessage } from "@/lib/api-error-message";
import { useApiErrorMessage } from "@/shared/hooks/use-api-error-message";

interface PaymentFieldValues {
  purchaseId: string;
  amount: string;
  method: PaymentMethod;
  reference: string;
}

function findPurchase(unpaid: PurchaseResponse[], purchaseId: string) {
  return unpaid.find((purchase) => purchase.id === purchaseId) ?? unpaid[0];
}

function isValidAmount(value: string, max: number) {
  const amount = Number(value);
  return (
    value.trim() !== "" &&
    Number.isFinite(amount) &&
    amount > 0 &&
    amount <= max
  );
}

export function PaymentForm({
  unpaid,
  partnerName,
  pending,
  onSave,
  onClose,
}: {
  unpaid: PurchaseResponse[];
  /** The seller's name for a purchase (farmer or buyer). */
  partnerName: (purchase: PurchaseResponse) => string;
  pending: boolean;
  onSave: PaymentDialogProps["onSave"];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canReadCashSession = hasPermission(PermissionKey.CASH_SESSION_READ);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    trigger,
    clearErrors,
    formState: { errors, isValid, isSubmitting },
  } = useForm<PaymentFieldValues>({
    mode: "onChange",
    defaultValues: {
      purchaseId: unpaid[0].id,
      amount: "",
      method: PaymentMethod.CASH,
      reference: "",
    },
  });

  const purchaseId = useWatch({ control, name: "purchaseId" });
  const method = useWatch({ control, name: "method" });

  const selectedPurchase = findPurchase(unpaid, purchaseId);
  const maxAmount = selectedPurchase.payable?.remaining ?? 0;

  const cashSession = useOpenCashSession(
    method === PaymentMethod.CASH && canReadCashSession,
  );
  const cashSessionId = cashSession.openSession?.id;
  const cashBlocked =
    method === PaymentMethod.CASH && (!canReadCashSession || !cashSessionId);
  const cashSessionError = useApiErrorMessage(cashSession.error);

  // While saving: loader on the submit button, Cancel disabled, dialog locked.
  const busy = pending || isSubmitting;
  useDialogBusy(busy);

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root.serverError");
    const purchase = findPurchase(unpaid, values.purchaseId);
    try {
      await onSave(purchase.id, {
        amount: Number(values.amount),
        method: values.method,
        reference: values.reference.trim() || undefined,
        ...(values.method === PaymentMethod.CASH && cashSessionId
          ? { cashSessionId }
          : {}),
      });
      onClose();
    } catch (cause) {
      setError("root.serverError", {
        type: "server",
        message: apiErrorMessage(cause),
      });
    }
  });

  const serverError = errors.root?.serverError?.message;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {cashSession.isError && method === PaymentMethod.CASH && (
        <p role="alert" className="text-sm text-destructive">
          {cashSessionError}
        </p>
      )}
      <Field
        label={t("payments.whichPurchase")}
        htmlFor="purchase-select"
        required
      >
        <Controller
          name="purchaseId"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Select
              value={field.value}
              required
              onValueChange={(value) => {
                field.onChange(value);
                void trigger("amount");
              }}
            >
              <SelectTrigger id="purchase-select" className="w-full">
                <SelectValue placeholder={t("payments.whichPurchase")} />
              </SelectTrigger>
              <SelectContent>
                {unpaid.map((purchase) => (
                  <SelectItem key={purchase.id} value={purchase.id}>
                    {t("payments.purchaseOption", {
                      name: partnerName(purchase),
                      amount: formatMoney(purchase.payable?.remaining ?? 0),
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field
        label={t("payments.amountPaidNow")}
        htmlFor="payment-amount"
        required
        hint={t("payments.amountPaidNowHint", {
          amount: formatMoney(maxAmount),
        })}
      >
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <Banknote className="size-5"/>
          </InputGroupAddon>
          <InputGroupInput
            id="payment-amount"
            type="text"
            max={maxAmount || undefined}
            inputMode="decimal"
            autoComplete="off"
            required
            {...register("amount", {
              required: true,
              validate: (value, values) =>
                isValidAmount(
                  value,
                  findPurchase(unpaid, values.purchaseId).payable?.remaining ??
                    0,
                ),
              onChange: (event) =>
                setValue("amount", sanitizeAmountInput(event.target.value), {
                  shouldValidate: true,
                }),
            })}
          />
        </InputGroup>
      </Field>
      <Field label={t("payments.method")} htmlFor="payment-method" required>
        <Controller
          name="method"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="payment-method" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MANUAL_PAYMENT_METHODS.map((paymentMethod) => (
                  <SelectItem key={paymentMethod} value={paymentMethod}>
                    {t(`payments.methods.${paymentMethod}`, paymentMethod)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field label={t("payments.reference")} htmlFor="payment-reference">
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <Hash className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            id="payment-reference"
            maxLength={160}
            {...register("reference")}
          />
        </InputGroup>
      </Field>
      {method === PaymentMethod.CASH && !cashSessionId && (
        <p role="alert" className="text-sm text-destructive">
          {canReadCashSession
            ? t("payments.cashTillRequired")
            : t("payments.cashTillPermissionRequired")}
        </p>
      )}
      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          {t("common.cancel")}
        </Button>
        <SubmitButton pending={busy} disabled={!isValid || cashBlocked}>
          {t("payments.recordPayment")}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}
