import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Banknote, TrendingDown, TrendingUp } from "lucide-react";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { useDialogBusy } from "@/components/ui/dialog-busy";
import { DialogFooter } from "@/components/ui/dialog";
import { DatePicker } from "@/components/date-picker";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { formatMoney } from "@/lib/utils";
import { parseAmount, sanitizeAmountInput } from "@/lib/amount";
import {
  buildPublishRequest,
  emptyPricingFormValues,
  isValidPricePerKg,
  type PricingFormValues,
} from "@/features/pricing/pricing-form-values";
import type { CocoaPriceResponse, CreateCocoaPriceRequest } from "@/interfaces";

/**
 * The Boss's price form.
 *
 * WHY THIS SCREEN IS DIFFERENT FROM EVERY OTHER FORM IN THE APP — a cocoa price
 * cannot be edited, only superseded. `POST /cocoa-prices` appends a new row and
 * CLOSES the previous interval, so this form never has an "editing" mode and
 * never pre-fills the current price: doing so would invite someone to "correct"
 * a number by retyping it, which would silently re-price every purchase recorded
 * from now on. Every submission is deliberately a new statement.
 *
 * WHAT THE BOSS NEEDS TO SEE BEFORE COMMITTING — the size of the change. This is
 * the single number every purchase is valued at, so the form shows the price in
 * force today next to the new one, with the difference. The decision being made
 * is "up or down, and by how much", not "is 1500 typed correctly".
 */

function PriceChange({
  currentPrice,
  nextPrice,
}: {
  currentPrice: CocoaPriceResponse;
  nextPrice: number;
}) {
  const { t } = useTranslation();
  const delta = nextPrice - currentPrice.pricePerKg;
  const isRise = delta > 0;
  const Icon = isRise ? TrendingUp : TrendingDown;

  return (
    <div className="mt-2 rounded-lg border border-cocoa-100 bg-paper px-3 py-2 text-sm">
      <p className="text-cocoa-600">
        {t("pricing.currentPrice", {
          price: formatMoney(currentPrice.pricePerKg),
        })}
      </p>
      {delta === 0 ? (
        <p className="mt-1 text-cocoa-500">{t("pricing.changeSame")}</p>
      ) : (
        <p
          className={`mt-1 flex items-center gap-1.5 font-medium ${
            isRise ? "text-rust-700" : "text-cocoa-700"
          }`}
        >
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          {t(isRise ? "pricing.changeUp" : "pricing.changeDown", {
            amount: formatMoney(Math.abs(delta)),
          })}
        </p>
      )}
    </div>
  );
}

export function PricingForm({
  currentPrice,
  saving,
  onCancel,
  onSave,
}: {
  currentPrice?: CocoaPriceResponse | null;
  saving: boolean;
  onCancel: () => void;
  /** Hands a validated price to the caller, which is where the confirmation lives. */
  onSave: (request: CreateCocoaPriceRequest) => void;
}) {
  const { t } = useTranslation();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { isValid, isSubmitting },
  } = useForm<PricingFormValues>({
    mode: "onChange",
    defaultValues: emptyPricingFormValues(),
  });

  const typed = useWatch({ control, name: "pricePerKg" });
  const parsed = parseAmount(typed);
  const showChange = currentPrice != null && isValidPricePerKg(typed);

  // While saving: loader on the submit button, Cancel disabled, dialog locked.
  const pending = saving || isSubmitting;
  useDialogBusy(pending);

  const onSubmit = handleSubmit((values) => {
    onSave(buildPublishRequest(values));
  });

  return (
    <form onSubmit={onSubmit}>
      <Field
        label={t("pricing.newPriceLabel")}
        htmlFor="pricing-price"
        required
        hint={t("pricing.newPriceHint")}
      >
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <Banknote className="text-muted-foreground" aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            id="pricing-price"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            required
            placeholder={t("pricing.newPricePlaceholder")}
            {...register("pricePerKg", {
              required: true,
              validate: isValidPricePerKg,
              // Same treatment as every other money field in the app: the raw
              // keystroke is reduced to digits and at most two decimals.
              onChange: (event) =>
                setValue("pricePerKg", sanitizeAmountInput(event.target.value), {
                  shouldValidate: true,
                }),
            })}
          />
        </InputGroup>
      </Field>

      <Field
        label={t("pricing.effectiveFromLabel")}
        htmlFor="pricing-effective-from"
        hint={t("pricing.effectiveFromHint")}
      >
        <Controller
          name="effectiveFrom"
          control={control}
          render={({ field }) => (
            <DatePicker
              id="pricing-effective-from"
              value={field.value}
              onValueChange={field.onChange}
              placeholder={t("pricing.effectiveFromToday")}
              // Back-dating would leave purchases already recorded at the old
              // price sitting inside an interval that says otherwise.
              disabledDates={{ before: new Date() }}
              clearable
              clearLabel={t("pricing.effectiveFromClear")}
            />
          )}
        />
      </Field>

      {showChange && (
        <PriceChange currentPrice={currentPrice} nextPrice={parsed} />
      )}

      <DialogFooter className="pt-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          {t("common.cancel")}
        </Button>
        <SubmitButton pending={pending} disabled={!isValid}>
          {t("pricing.publishPrice")}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}
