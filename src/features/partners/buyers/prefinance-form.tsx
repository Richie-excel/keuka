import { Controller, useForm, useWatch } from "react-hook-form";
import { Coins, Banknote } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Field } from "@/components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { NoteSuggestButton } from "@/components/note-suggest-button";
import { SubmitButton } from "@/components/submit-button";
import { useDialogBusy } from "@/components/ui/dialog-busy";
import { DialogFooter } from "@/components/ui/dialog";
import type { CreatePrefinanceRequest } from "@/interfaces";
import { DatePicker } from "@/components/date-picker";
import { dateToInstant, formatMoney } from "@/lib/utils";
import { parseAmount, sanitizeAmountInput, isPositiveAmount } from "@/lib/amount";
import { useCurrentCocoaPrice } from "@/shared/hooks/use-cocoa-prices";
import { useBuyerBalance } from "@/shared/hooks/use-prefinances";

interface PrefinanceFieldValues {
  amount: string;
  pricePerKg: string;
  advanceDate: string;
  notes: string;
}

export function PrefinanceForm({
  buyerId,
  saving,
  onCancel,
  onSave,
}: {
  buyerId: string;
  saving: boolean;
  onCancel: () => void;
  onSave: (request: CreatePrefinanceRequest) => Promise<void>;
}) {
  const { t } = useTranslation();
  const currentPrice = useCurrentCocoaPrice();
  // What the buyer still owes from earlier advances carries over to this one.
  const balance = useBuyerBalance(buyerId);
  const carriedOver = balance.data?.owes ?? 0;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { isValid, isSubmitting },
  } = useForm<PrefinanceFieldValues>({
    mode: "onChange",
    defaultValues: { amount: "", pricePerKg: "", advanceDate: "", notes: "" },
  });

  const amount = useWatch({ control, name: "amount" });
  const newAdvance = parseAmount(amount || "0");

  // While saving: loader on the submit button, Cancel disabled, dialog locked.
  const pending = saving || isSubmitting;
  useDialogBusy(pending);

  const onSubmit = handleSubmit(async (values) => {
    const notes = values.notes.trim();
    await onSave({
      buyerId,
      amount: Number(values.amount),
      pricePerKg: Number(values.pricePerKg),
      ...(values.advanceDate && { advanceDate: dateToInstant(values.advanceDate) }),
      ...(notes && { notes }),
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-2">
      {carriedOver > 0 && (
        <div role="status" className="mb-1 rounded-md bg-amber-100 px-3 py-2 text-xs text-amber-700">
          <p>{t("buyers.balance.carriedOver", { amount: formatMoney(carriedOver) })}</p>
          <p className="mt-1 font-semibold">
            {t("buyers.balance.totalAfter", { amount: formatMoney(carriedOver + newAdvance) })}
          </p>
        </div>
      )}
      <Field
        label={t("buyers.prefinanceAmount")}
        htmlFor="prefinance-amount"
        required
      >
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <Banknote className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            id="prefinance-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            required
            {...register("amount", {
              required: true,
              validate: isPositiveAmount,
              onChange: (event) =>
                setValue("amount", sanitizeAmountInput(event.target.value), { shouldValidate: true }),
            })}
          />
        </InputGroup>
      </Field>
      <Field
        label={t("buyers.agreedPricePerKg")}
        htmlFor="prefinance-price"
        required
        hint={
          currentPrice.data
            ? t("buyers.agreedPriceHint", {
                price: formatMoney(currentPrice.data.pricePerKg),
              })
            : undefined
        }
      >
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <Coins className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            id="prefinance-price"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder={t("buyers.unitPricePlaceholder")}
            required
            {...register("pricePerKg", {
              required: true,
              validate: isPositiveAmount,
              onChange: (event) =>
                setValue("pricePerKg", sanitizeAmountInput(event.target.value), { shouldValidate: true }),
            })}
          />
        </InputGroup>
      </Field>
      <Field
        label={t("buyers.advanceDate")}
        htmlFor="prefinance-advance-date"
      >
        <Controller
          name="advanceDate"
          control={control}
          render={({ field}) => (
            <DatePicker
              id="prefinance-advance-date"
              value={field.value}
              onValueChange={field.onChange}
            />
          )}
        />
      </Field>
      <Field label={t("buyers.prefinanceNotes")} htmlFor="prefinance-notes">
        <NoteSuggestButton
          context="PREFINANCE"
          disabled={pending}
          details={() => {
            const values = getValues();
            return {
              "Amount advanced": values.amount && `${values.amount} FCFA`,
              "Agreed price per kg": values.pricePerKg && `${values.pricePerKg} FCFA`,
              "Advance date": values.advanceDate,
            };
          }}
          onSuggest={(text) => setValue("notes", text, { shouldDirty: true, shouldValidate: true })}
        />
        <Textarea id="prefinance-notes" rows={3} {...register("notes")} />
      </Field>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          {t("common.cancel")}
        </Button>
        <SubmitButton pending={pending} disabled={!isValid}>
          {t("buyers.addPrefinance")}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}