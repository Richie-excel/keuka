import { Controller, useForm, useWatch } from "react-hook-form";
import { Banknote, Mail, CreditCard, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EmployeeTypeBadge } from "@/components/role-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/field";
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
import { NoteSuggestButton } from "@/components/note-suggest-button";
import { SubmitButton } from "@/components/submit-button";
import { useDialogBusy } from "@/components/ui/dialog-busy";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmployeeType } from "@/enums";
import { changedFields } from "@/lib/utils";
import { isPositiveAmount, parseAmount, sanitizeAmountInput } from "@/lib/amount";
import { formatPhoneInput, sanitizeIdCardInput, toStoredPhone } from "@/lib/validation";
import { useFieldRules } from "@/shared/hooks/use-field-rules";
import { PhoneInput } from "@/components/phone-input";

import type {
  CreateEmployeeRequest,
  EmployeeResponse,
  UpdateEmployeeRequest,
} from "@/interfaces";
import { DatePicker } from "@/components/date-picker";

const EMPLOYEE_TYPES = Object.values(EmployeeType);

/** What the inputs hold: always strings (and booleans), never undefined. */
interface EmployeeFormValues {
  fullName: string;
  email: string;
  idCardNumber: string;
  phone: string;
  employeeType: EmployeeType;
  hireDate: string;
  monthlySalary: string;
  notes: string;
  active: boolean;
}

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: EmployeeResponse | null;
  onCreate: (request: CreateEmployeeRequest) => Promise<void>;
  onUpdate: (id: string, patch: UpdateEmployeeRequest) => Promise<void>;
}


function toFormValues(employee: EmployeeResponse | null): EmployeeFormValues {
  return {
    fullName: employee?.fullName ?? "",
    email: employee?.email ?? "",
    idCardNumber: employee?.idCardNumber ?? "",
    phone: formatPhoneInput(employee?.phone),
    employeeType: employee?.employeeType ?? EmployeeType.OTHER,
    hireDate: employee?.hireDate ?? "",
    monthlySalary: employee?.monthlySalary ? String(employee.monthlySalary) : "",
    notes: employee?.notes ?? "",
    active: employee?.active ?? true,
  };
}

function buildCreateRequest(values: EmployeeFormValues): CreateEmployeeRequest {
  return {
    fullName: values.fullName.trim(),
    idCardNumber: values.idCardNumber.trim(),
    employeeType: values.employeeType,
    email: values.email.trim() || undefined,
    phone: toStoredPhone(values.phone),
    hireDate: values.hireDate || undefined,
    monthlySalary: values.monthlySalary ? parseAmount(values.monthlySalary) : undefined,
    notes: values.notes.trim() || undefined,
  };
}


function buildPatch(
  original: EmployeeFormValues,
  values: EmployeeFormValues,
): UpdateEmployeeRequest {
  const changed = new Set(changedFields(original, values));
  const patch: UpdateEmployeeRequest = {};
  if (changed.has("fullName")) patch.fullName = values.fullName.trim();
  if (changed.has("email")) patch.email = values.email.trim();
  if (changed.has("idCardNumber")) patch.idCardNumber = values.idCardNumber.trim();
  if (changed.has("phone")) patch.phone = toStoredPhone(values.phone) ?? "";
  if (changed.has("employeeType")) patch.employeeType = values.employeeType;
  if (changed.has("hireDate")) patch.hireDate = values.hireDate;
  if (changed.has("monthlySalary") && values.monthlySalary) {
    patch.monthlySalary = parseAmount(values.monthlySalary);
  }
  if (changed.has("notes")) patch.notes = values.notes.trim();
  if (changed.has("active")) patch.active = values.active;
  return patch;
}

export function EmployeeDialog({
  open,
  onOpenChange,
  employee,
  onCreate,
  onUpdate,
}: EmployeeDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(employee);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-center sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t(isEdit ? "personnel.editTitle" : "personnel.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("personnel.createDescription")}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <EmployeeForm
            key={employee?.id ?? "new"}
            employee={employee ?? null}
            onCancel={() => onOpenChange(false)}
            onCreate={onCreate}
            onUpdate={onUpdate}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EmployeeForm({
  employee,
  onCancel,
  onCreate,
  onUpdate,
  onSaved,
}: {
  employee: EmployeeResponse | null;
  onCancel: () => void;
  onCreate: EmployeeDialogProps["onCreate"];
  onUpdate: EmployeeDialogProps["onUpdate"];
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const isEdit = employee !== null;
  const rules = useFieldRules();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isValid, isSubmitting },
  } = useForm<EmployeeFormValues>({
    mode: "onChange",
    defaultValues: toFormValues(employee),
  });

  const current = useWatch({ control });

  const hasChanges =
    !employee || changedFields(toFormValues(employee), current).length > 0;

  // While saving: loader on the submit button, Cancel disabled, dialog locked.
  const pending = isSubmitting;
  useDialogBusy(pending);

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root.serverError");
    try {
      if (employee) {
        await onUpdate(employee.id, buildPatch(toFormValues(employee), values));
      } else {
        await onCreate(buildCreateRequest(values));
      }
      onSaved();
    } catch (cause) {
      setError("root.serverError", {
        type: "server",
        message:
          cause instanceof Error
            ? cause.message
            : t("errors.unexpectedDescription"),
      });
    }
  });

  const serverError = errors.root?.serverError?.message;

  return (
    <form
      onSubmit={onSubmit}
      className="max-h-[65vh] space-y-1 overflow-y-auto px-1 text-left hide-scrollbar"
    >
      <Field
        label={t("personnel.fullName")}
        htmlFor="employee-name"
        required
        error={errors.fullName?.message}
      >
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <UserCircle className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            id="employee-name"
            autoComplete="off"
            required
            aria-invalid={Boolean(errors.fullName)}
            {...register("fullName", rules.name())}
          />
        </InputGroup>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={t("personnel.employeeType")}
          htmlFor="employee-type"
          required
        >
          <Controller
            name="employeeType"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="employee-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_TYPES.map((employeeType) => (
                    <SelectItem key={employeeType} value={employeeType}>
                      <EmployeeTypeBadge type={employeeType} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field
          label={t("personnel.idCardNumber", { defaultValue: "ID card number" })}
          htmlFor="employee-id-card"
          required={!isEdit}
          error={errors.idCardNumber?.message}
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <CreditCard className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              id="employee-id-card"
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="123456789 / AB12345678"
              required={!isEdit}
              aria-invalid={Boolean(errors.idCardNumber)}
              {...register("idCardNumber", {
                // Required to create. An older record may have none (or an older
                // format), and that must not stop someone fixing a phone number on it.
                ...rules.idCard({ required: !isEdit, accept: employee?.idCardNumber }),
                onChange: (event) =>
                  setValue("idCardNumber", sanitizeIdCardInput(event.target.value), {
                    shouldValidate: true,
                  }),
              })}
            />
          </InputGroup>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={t("personnel.phone")}
          htmlFor="employee-phone"
          error={errors.phone?.message}
        >
          <PhoneInput
            id="employee-phone"
            aria-invalid={Boolean(errors.phone)}
            {...register("phone", rules.phone())}
          />
        </Field>
        <Field
          label={t("personnel.email", { defaultValue: "Email" })}
          htmlFor="employee-email"
          error={errors.email?.message}
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Mail className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              id="employee-email"
              type="email"
              placeholder={t("validation.emailPlaceholder")}
              autoComplete="off"
              aria-invalid={Boolean(errors.email)}
              {...register("email", rules.email({ required: false }))}
            />
          </InputGroup>
        </Field>
      </div>

      <div className="grid gap-x-3 sm:grid-cols-2">
        <Field
          label={t("personnel.hireDate", { defaultValue: "Hire date" })}
          htmlFor="employee-hire-date"
          required
          hint={t("personnel.hireDateHint")}
        >
          <Controller
            name="hireDate"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <DatePicker
                id="employee-hire-date"
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
        </Field>
        <Field
          label={t("personnel.monthlySalary")}
          htmlFor="employee-monthly-salary"
          required
          hint={t("personnel.monthlySalaryHint")}
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Banknote className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              id="employee-monthly-salary"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              required
              {...register("monthlySalary", {
                required: true,
                validate: isPositiveAmount,
                onChange: (event) =>
                  setValue("monthlySalary", sanitizeAmountInput(event.target.value), {
                    shouldValidate: true,
                  }),
              })}
            />
          </InputGroup>
        </Field>
      </div>

      <Field
        label={t("personnel.notes", { defaultValue: "Notes" })}
        htmlFor="employee-notes"
      >
        <NoteSuggestButton
          context="EMPLOYEE"
          disabled={pending}
          details={() => {
            const values = getValues();
            return {
              Name: values.fullName,
              Role: t(`personnel.types.${values.employeeType}`),
              "Hire date": values.hireDate,
              "Agreed monthly salary": values.monthlySalary && `${values.monthlySalary} FCFA`,
            };
          }}
          onSuggest={(text) => setValue("notes", text, { shouldDirty: true, shouldValidate: true })}
        />
        <Textarea id="employee-notes" rows={2} {...register("notes")} />
      </Field>

      {isEdit && (
        <div className="flex items-center gap-2 pt-1">
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="employee-active"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            )}
          />
          <Label htmlFor="employee-active">
            {t("personnel.active", { defaultValue: "Active" })}
          </Label>
        </div>
      )}

      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}

      <DialogFooter className="space-x-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          {t("common.cancel")}
        </Button>
        <SubmitButton pending={pending} disabled={!isValid || !hasChanges}>
          {t("personnel.saveEmployee")}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}