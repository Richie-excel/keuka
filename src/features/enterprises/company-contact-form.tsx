import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Building2, Landmark, Mail, MapPin } from "lucide-react";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { useDialogBusy } from "@/components/ui/dialog-busy";
import { DialogFooter } from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { hasChanged } from "@/lib/utils";
import { apiErrorMessage } from "@/lib/api-error-message";
import { formatPhoneInput, toStoredPhone } from "@/lib/validation";
import { useFieldRules } from "@/shared/hooks/use-field-rules";
import { PhoneInput } from "@/components/phone-input";
import type { SubscriptionResponse, UpdateCompanyContactRequest } from "@/api/subscription";

interface ContactFieldValues {
  displayName: string;
  legalName: string;
  address: string;
  phone: string;
  email: string;
}

function toFieldValues(company: SubscriptionResponse): ContactFieldValues {
  return {
    displayName: company.displayName ?? "",
    legalName: company.legalName ?? "",
    address: company.address ?? "",
    phone: formatPhoneInput(company.phone),
    email: company.email ?? "",
  };
}

/**
 * The company's own details: its names (shown in the app and on documents)
 * and the contact details printed on the letterhead of its receipts and
 * payslips. A cleared field is sent as "" so the server clears it; the display
 * name is required.
 */
export function CompanyContactForm({
  company,
  saving,
  onSave,
  onClose,
}: {
  company: SubscriptionResponse;
  saving: boolean;
  onSave: (input: UpdateCompanyContactRequest) => Promise<unknown>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const rules = useFieldRules();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    control,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ContactFieldValues>({
    mode: "onChange",
    defaultValues: toFieldValues(company),
  });

  const values = useWatch({ control });
  const hasChanges = hasChanged(toFieldValues(company), values);

  // While saving: loader on the submit button, Cancel disabled, dialog locked.
  const pending = saving || isSubmitting;
  useDialogBusy(pending);

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root.serverError");
    try {
      await onSave({
        displayName: values.displayName.trim(),
        legalName: values.legalName.trim(),
        address: values.address.trim(),
        phone: toStoredPhone(values.phone) ?? "",
        email: values.email.trim(),
      });
      onClose();
    } catch (cause) {
      setError("root.serverError", { type: "server", message: apiErrorMessage(cause) });
    }
  });

  const serverError = errors.root?.serverError?.message;

  return (
    <form onSubmit={onSubmit} className="grid gap-1">
      <div className="grid gap-x-3 sm:grid-cols-2">
        <Field
          label={t("enterprises.contact.displayName")}
          htmlFor="company-display-name"
          required
          hint={t("enterprises.contact.displayNameHint")}
          error={errors.displayName?.message}
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Building2 className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              id="company-display-name"
              maxLength={160}
              aria-invalid={Boolean(errors.displayName)}
              {...register("displayName", rules.name())}
            />
          </InputGroup>
        </Field>
        <Field
          label={t("enterprises.contact.legalName")}
          htmlFor="company-legal-name"
          hint={t("enterprises.contact.legalNameHint")}
          error={errors.legalName?.message}
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Landmark className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              id="company-legal-name"
              maxLength={200}
              aria-invalid={Boolean(errors.legalName)}
              {...register("legalName", rules.name({ required: false }))}
            />
          </InputGroup>
        </Field>
      </div>
      <Field label={t("enterprises.contact.address")} htmlFor="company-address">
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <MapPin className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            id="company-address"
            maxLength={255}
            placeholder={t("enterprises.contact.addressPlaceholder")}
            {...register("address")}
          />
        </InputGroup>
      </Field>
      <div className="grid gap-x-3 sm:grid-cols-2">
        <Field
          label={t("enterprises.contact.phone")}
          htmlFor="company-phone"
          error={errors.phone?.message}
        >
          <PhoneInput
            id="company-phone"
            aria-invalid={Boolean(errors.phone)}
            {...register("phone", rules.phone())}
          />
        </Field>
        <Field
          label={t("enterprises.contact.email")}
          htmlFor="company-email"
          error={errors.email?.message}
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Mail className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              id="company-email"
              type="email"
              placeholder={t("validation.emailPlaceholder")}
              autoComplete="email"
              maxLength={160}
              aria-invalid={Boolean(errors.email)}
              {...register("email", rules.email({ required: false }))}
            />
          </InputGroup>
        </Field>
      </div>
      {serverError && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {serverError}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
          {t("common.cancel")}
        </Button>
        <SubmitButton pending={pending} disabled={!isValid || !hasChanges}>
          {t("common.save")}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}
