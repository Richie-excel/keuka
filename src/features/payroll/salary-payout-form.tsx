import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Banknote, FileText, PenLine } from "lucide-react";
import { Field } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";
import { useDialogBusy } from "@/components/ui/dialog-busy";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { formatMoney } from "@/lib/utils";
import { NoteSuggestButton } from "@/components/note-suggest-button";
import { useFieldRules } from "@/shared/hooks/use-field-rules";
import { parseAmount, sanitizeAmountInput } from "@/lib/amount";

interface PayoutFieldValues {
  amount: string;
  signatureName: string;
  notes: string;
}

/**
 * Pays an employee cash from the cashier's open till. The amount can be no
 * more than both what the employee may receive and what the till holds.
 *
 * In the employee's first month no salary is due yet, so the payout is an
 * advance: `salaryDue` is then the advance room left (agreed salary minus
 * what was already advanced).
 */
export function SalaryPayoutForm({
  salaryDue,
  tillBalance,
  advance = false,
  saving,
  onSubmit,
}: {
  salaryDue: number;
  tillBalance: number;
  advance?: boolean;
  saving: boolean;
  onSubmit: (input: { amount: number; signatureName: string; notes?: string }) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const rules = useFieldRules();
  const max = Math.min(salaryDue, tillBalance);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<PayoutFieldValues>({
    mode: "onChange",
    defaultValues: { amount: "", signatureName: "", notes: "" },
  });

  // While saving: loader on the submit button, Cancel disabled, dialog locked.
  const pending = saving || isSubmitting;
  useDialogBusy(pending);

  const onFormSubmit = handleSubmit(async (values) => {
    await onSubmit({
      amount: parseAmount(values.amount),
      signatureName: values.signatureName.trim(),
      notes: values.notes.trim() || undefined,
    });
    reset();
  });

  return (
    <form onSubmit={onFormSubmit} className="space-y-1">
      <Field
        label={t(advance ? "payroll.advance.amount" : "payroll.amountCollected")}
        htmlFor="salary-payout-amount"
        required
        hint={t(advance ? "payroll.advance.limit" : "payroll.collectionLimit", {
          due: formatMoney(salaryDue),
          till: formatMoney(tillBalance),
        })}
      >
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <Banknote className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            id="salary-payout-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            required
            {...register("amount", {
              required: true,
              validate: (value) => {
                const amount = parseAmount(value);
                return Number.isFinite(amount) && amount > 0 && amount <= max;
              },
              onChange: (event) =>
                setValue("amount", sanitizeAmountInput(event.target.value), {
                  shouldValidate: true,
                }),
            })}
          />
        </InputGroup>
      </Field>
      <Field
        label={t("payroll.signatureName")}
        htmlFor="salary-signature"
        required
        error={errors.signatureName?.message}
      >
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <PenLine className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            id="salary-signature"
            maxLength={160}
            required
            aria-invalid={Boolean(errors.signatureName)}
            {...register("signatureName", rules.name())}
          />
        </InputGroup>
      </Field>
      <Field label={t("payroll.notes")} htmlFor="salary-payout-notes">
        <NoteSuggestButton
          context="SALARY_PAYOUT"
          disabled={pending}
          details={() => {
            const values = getValues();
            return {
              Kind: advance ? "advance on salary (first month)" : "salary payment",
              Amount: values.amount && `${values.amount} FCFA`,
              "Signed by": values.signatureName,
            };
          }}
          onSuggest={(text) => setValue("notes", text, { shouldDirty: true, shouldValidate: true })}
        />
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <FileText className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput id="salary-payout-notes" maxLength={255} {...register("notes")} />
        </InputGroup>
      </Field>
      <SubmitButton
        className="w-full"
        pending={pending}
        disabled={!isValid || !(salaryDue > 0)}
      >
        {!pending && <Banknote className="size-4" />}
        {t(advance ? "payroll.advance.submit" : "payroll.collectSubmit")}
      </SubmitButton>
    </form>
  );
}
