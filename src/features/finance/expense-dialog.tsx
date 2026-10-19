import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Banknote, FileText, Plus, UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDialogBusy } from "@/components/ui/dialog-busy";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";
import Loader from "@/components/loader";
import { PaymentMethod, PermissionKey } from "@/enums";
import { parseAmount, sanitizeAmountInput } from "@/lib/amount";
import { formatMoney, notBlank } from "@/lib/utils";
import { useAuth } from "@/shared/hooks/useAuth";
import { useOpenCashSession } from "@/shared/hooks/use-cash-sessions";
import {
  useCreateExpense,
  useCreateExpenseCategory,
  useExpenseCategories,
} from "@/shared/hooks/use-expenses";
import { expenseCategoryLabel } from "./expense-category-label";

interface ExpenseFormValues {
  categoryId: string;
  amount: string;
  description: string;
  beneficiary: string;
}

/**
 * Records a running cost (vehicle parts, fuel, office supplies…) paid in cash
 * from the open till. The till must be open and hold enough: the form says how
 * much is available, and the server refuses more (INSUFFICIENT_CASH).
 */
export function ExpenseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("expenses.form.title")}</DialogTitle>
          <DialogDescription>{t("expenses.form.description")}</DialogDescription>
        </DialogHeader>
        {open && <ExpenseForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ExpenseForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const till = useOpenCashSession();
  const categories = useExpenseCategories({ page: 0, size: 100 });
  const createExpense = useCreateExpense();
  const createCategory = useCreateExpenseCategory();
  const [newCategory, setNewCategory] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ExpenseFormValues>({
    mode: "onChange",
    defaultValues: {
      categoryId: "",
      amount: "",
      description: "",
      beneficiary: "",
    },
  });
  const amount = useWatch({ control, name: "amount" });

  const available = till.openSession?.availableBalance;
  const pending = isSubmitting || createExpense.isPending;
  useDialogBusy(pending);

  const onSubmit = handleSubmit(async (values) => {
    if (!till.openSession) return;
    await createExpense.submitAsync({
      categoryId: values.categoryId,
      amount: parseAmount(values.amount),
      description: values.description.trim(),
      beneficiary: values.beneficiary.trim() || undefined,
      paymentMethod: PaymentMethod.CASH,
      cashSessionId: till.openSession.id,
    });
    onDone();
  });

  async function addCategory() {
    if (!newCategory?.trim()) return;
    const created = await createCategory.submitAsync({ name: newCategory.trim() });
    setValue("categoryId", created.id, { shouldValidate: true, shouldDirty: true });
    setNewCategory(null);
  }

  if (till.isPending || categories.isPending) {
    return (
      <div className="flex justify-center py-8">
        <Loader />
      </div>
    );
  }

  // Expenses are paid from the till: none open, nothing to pay from.
  if (!till.openSession) {
    return (
      <div className="space-y-4">
        <p role="alert" className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t("expenses.form.tillRequired")}
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </div>
    );
  }

  const tooMuch = available !== undefined && parseAmount(amount || "0") > available;

  return (
    <form onSubmit={onSubmit} className="grid gap-1">
      <p className="mb-3 rounded-md bg-pod-100 px-3 py-2 text-xs text-pod-700">
        {t("expenses.form.tillAvailable", { amount: formatMoney(available ?? 0) })}
      </p>

      <Field label={t("expenses.form.category")} htmlFor="expense-category" required>
        <Controller
          name="categoryId"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={pending}>
              <SelectTrigger id="expense-category" className="w-full">
                <SelectValue placeholder={t("expenses.form.categoryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {(categories.data?.content ?? []).map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {expenseCategoryLabel(t, category.code, category.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {hasPermission(PermissionKey.EXPENSE_CREATE) &&
          (newCategory === null ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 h-7 gap-1 px-2 text-xs text-cocoa-600"
              onClick={() => setNewCategory("")}
              disabled={pending}
            >
              <Plus aria-hidden="true" />
              {t("expenses.form.newCategory")}
            </Button>
          ) : (
            <div className="mt-2 flex gap-2">
              <InputGroup>
                <InputGroupInput
                  autoFocus
                  value={newCategory}
                  maxLength={80}
                  placeholder={t("expenses.form.newCategoryPlaceholder")}
                  onChange={(event) => setNewCategory(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void addCategory();
                    }
                  }}
                />
              </InputGroup>
              <Button
                type="button"
                variant="outline"
                disabled={!newCategory.trim() || createCategory.isPending}
                onClick={() => void addCategory()}
              >
                {createCategory.isPending ? <Loader className="size-4" /> : t("expenses.form.add")}
              </Button>
            </div>
          ))}
      </Field>

      {/* No date field: the cash leaves the till now, and the server dates the expense now. */}
      <div className="grid sm:grid-cols-2 gap-x-3">


        <Field
          label={t("expenses.form.amount")}
          htmlFor="expense-amount"
          required
          error={tooMuch ? t("expenses.form.exceedsTill", { amount: formatMoney(available ?? 0) }) : undefined}
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Banknote className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              id="expense-amount"
              inputMode="decimal"
              autoComplete="off"
              aria-invalid={tooMuch}
              {...register("amount", {
                required: true,
                validate: (value) => {
                  const parsed = parseAmount(value);
                  return parsed > 0 && (available === undefined || parsed <= available);
                },
                onChange: (event) =>
                  setValue("amount", sanitizeAmountInput(event.target.value), { shouldValidate: true }),
              })}
            />
          </InputGroup>
        </Field>

        <Field
          label={t("expenses.form.what")}
          htmlFor="expense-description"
          required
          hint={t("expenses.form.whatHint")}
          error={errors.description ? t("expenses.form.whatRequired") : undefined}
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <FileText className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              id="expense-description"
              maxLength={255}
              {...register("description", { required: true, validate: notBlank })}
            />
          </InputGroup>
        </Field>
      </div>

      <Field label={t("expenses.form.paidTo")} htmlFor="expense-beneficiary" hint={t("expenses.form.paidToHint")}>
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <UserRound className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput id="expense-beneficiary" maxLength={160} {...register("beneficiary")} />
        </InputGroup>
      </Field>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          {t("common.cancel")}
        </Button>
        <SubmitButton pending={pending} disabled={!isValid || tooMuch}>
          {t("expenses.form.submit")}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}
