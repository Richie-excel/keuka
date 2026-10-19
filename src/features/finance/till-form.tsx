import type { ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Banknote } from "lucide-react";
import { Field } from "@/components/field";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { NoteSuggestButton } from "@/components/note-suggest-button";
import { SubmitButton } from "@/components/submit-button";
import { useDialogBusy } from "@/components/ui/dialog-busy";
import { DialogFooter } from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { parseAmount, sanitizeAmountInput } from "@/lib/amount";
import { apiErrorMessage } from "@/lib/api-error-message";

export interface TillFormProps {
  amountLabel: string;
  amountHint?: string;
  submitLabel: string;
  /** Opening float and closing count may be 0; a provision may not. */
  allowZero?: boolean;
  /** Extra lines under the amount, computed from what was typed (e.g. variance). */
  renderSummary?: (amount: number | undefined) => ReactNode;
  saving: boolean;
  onSubmit: (amount: number, notes: string | undefined) => Promise<unknown>;
  onClose: () => void;
}

interface TillFieldValues {
  amount: string;
  notes: string;
}

/** A typed amount the till accepts: a finite number, ≥ 0 or > 0. */
function isValidTillAmount(value: string, allowZero: boolean) {
  if (value.trim() === "") return false;
  const amount = parseAmount(value);
  return Number.isFinite(amount) && (allowZero ? amount >= 0 : amount > 0);
}

/**
 * One amount + optional note, used for the three till actions: opening the
 * float, adding a provision and declaring the closing count.
 */
export function TillForm({
  amountLabel,
  amountHint,
  submitLabel,
  allowZero = false,
  renderSummary,
  saving,
  onSubmit,
  onClose,
}: TillFormProps) {
  const { t } = useTranslation();

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    clearErrors,
    formState: { errors, isValid, isSubmitting },
  } = useForm<TillFieldValues>({
    mode: "onChange", // keeps `isValid` current on every change
    defaultValues: { amount: "", notes: "" },
  });

  const amount = useWatch({ control, name: "amount" });
  const typedAmount = isValidTillAmount(amount, allowZero) ? parseAmount(amount) : undefined;

  // While saving: loader on the submit button, Cancel disabled, dialog locked.
  const pending = saving || isSubmitting;
  useDialogBusy(pending);

  const onFormSubmit = handleSubmit(async (values) => {
    clearErrors("root.serverError");
    try {
      await onSubmit(parseAmount(values.amount), values.notes.trim() || undefined);
      onClose();
    } catch (cause) {
      // `apiErrorMessage`, not `cause.message`: the server explains a refusal in
      // English and this screen is bilingual.
      setError("root.serverError", { type: "server", message: apiErrorMessage(cause) });
    }
  });

  const serverError = errors.root?.serverError?.message;

  return (
    <form onSubmit={onFormSubmit} className="grid gap-1">
      <Field label={amountLabel} htmlFor="till-amount" required hint={amountHint}>
        <InputGroup>
          <InputGroupAddon>
            <Banknote className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            id="till-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            autoFocus
            required
            aria-invalid={Boolean(errors.amount)}
            {...register("amount", {
              required: true,
              validate: (value) => isValidTillAmount(value, allowZero),
              onChange: (event) =>
                setValue("amount", sanitizeAmountInput(event.target.value), {
                  shouldValidate: true,
                }),
            })}
          />
        </InputGroup>
      </Field>
      {renderSummary?.(typedAmount)}
      <Field label={t("till.notes")} htmlFor="till-notes">
        <NoteSuggestButton
          context="TILL"
          disabled={pending}
          details={() => ({ Operation: submitLabel, Amount: amount ? `${amount} FCFA` : undefined })}
          onSuggest={(text) => setValue("notes", text, { shouldDirty: true, shouldValidate: true })}
        />
        <Textarea id="till-notes" rows={2} maxLength={255} {...register("notes")} />
      </Field>
      {serverError && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {serverError}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
          {t("common.cancel")}
        </Button>
        <SubmitButton pending={pending} disabled={!isValid}>
          {submitLabel}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}
