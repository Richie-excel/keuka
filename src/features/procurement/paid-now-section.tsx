import { Controller, useWatch, type Control, type UseFormRegister } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Banknote, Hash, Info } from "lucide-react";
import { Field } from "@/components/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { formatMoney } from "@/lib/utils";
import { sanitizeAmountInput } from "@/lib/amount";
import { MANUAL_PAYMENT_METHODS, PaymentMethod } from "@/enums";
import type { CashSessionResponse } from "@/interfaces";
import type { PurchaseFormValues } from "./purchase-form";

/**
 * "Paid now": pay the partner at the scale, recorded with the purchase in one
 * go. Cash comes out of the cashier's own open till.
 *
 * The fields belong to the purchase form's own `useForm`; this only renders
 * them. The amount follows "left to pay" until the cashier types one.
 */
export function PaidNowSection({
  control,
  register,
  amountToPay,
  effectiveAmount,
  till,
  tillLoading,
  error,
}: {
  control: Control<PurchaseFormValues>;
  register: UseFormRegister<PurchaseFormValues>;
  /** What is left to pay after any prefinance repayment. */
  amountToPay: number;
  /** The amount that will be sent (typed, or following `amountToPay`). */
  effectiveAmount: string;
  till: CashSessionResponse | undefined;
  tillLoading: boolean;
  error?: string;
}) {
  const { t } = useTranslation();
  const enabled = useWatch({ control, name: "payNow" });
  const method = useWatch({ control, name: "payMethod" });
  const isCash = method === PaymentMethod.CASH;

  return (
    <div className="mb-2 rounded-lg border border-cocoa-100 p-4">
      <div className="flex items-center gap-2">
        <Controller
          name="payNow"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="purchase-paid-now"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
          )}
        />
        <Label htmlFor="purchase-paid-now" className="font-medium">
          {t("purchases.paidNow.label")}
        </Label>
      </div>
      <p className="mt-1 text-xs text-cocoa-500">
        {t(enabled ? "purchases.paidNow.hint" : "purchases.paidNow.onCredit")}
      </p>

      {enabled && (
        <div className="mt-3 grid gap-x-3 sm:grid-cols-2">
          <Field label={t("purchases.paidNow.method")} htmlFor="paid-now-method">
            <Controller
              name="payMethod"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="paid-now-method" className="w-full">
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
          <Field
            label={t("purchases.paidNow.amount")}
            htmlFor="paid-now-amount"
            hint={t("purchases.paidNow.leftToPay", { amount: formatMoney(amountToPay) })}
            error={error}
          >
            <Controller
              name="payAmount"
              control={control}
              render={({ field }) => (
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Banknote className="text-muted-foreground" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="paid-now-amount"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={effectiveAmount}
                    aria-invalid={Boolean(error)}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(sanitizeAmountInput(event.target.value))}
                  />
                </InputGroup>
              )}
            />
          </Field>

          {!isCash && (
            <Field label={t("purchases.paidNow.reference")} htmlFor="paid-now-reference">
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Hash className="text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  id="paid-now-reference"
                  maxLength={120}
                  {...register("payReference")}
                />
              </InputGroup>
            </Field>
          )}

          {isCash && (
            <p
              className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs sm:col-span-2 ${
                till ? "bg-pod-100 text-pod-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {tillLoading ? (
                "…"
              ) : till ? (
                t("purchases.paidNow.tillAvailable", { amount: formatMoney(till.availableBalance) })
              ) : (
                <span>
                  {t("purchases.paidNow.noTill")}{" "}
                  <Link to="/finance/till" className="font-medium underline">
                    {t("purchases.paidNow.openTill")}
                  </Link>
                </span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
