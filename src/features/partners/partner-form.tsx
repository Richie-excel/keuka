import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Building2,
  ChevronDown,
  CreditCard,
  FileText,
  MapPin,
  User2,
  UserCircle,
} from "lucide-react";
import { Field } from "@/components/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { NoteSuggestButton } from "@/components/note-suggest-button";
import { SubmitButton } from "@/components/submit-button";
import { useDialogBusy } from "@/components/ui/dialog-busy";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { hasChanged } from "@/lib/utils";
import { formatPhoneInput, sanitizeIdCardInput, toStoredPhone } from "@/lib/validation";
import { useFieldRules } from "@/shared/hooks/use-field-rules";
import { PhoneInput } from "@/components/phone-input";
import { PartnerKind, PartnerType } from "@/enums";
import type { CreatePartnerRequest, PartnerResponse } from "@/interfaces";
import { PARTNER_SECTIONS, defaultKindFor } from "./partner-types";

/** What the form hands back; a create and an edit both fit this shape. */
export type PartnerFormValues = CreatePartnerRequest;

interface PartnerFieldValues {
  name: string;
  type: PartnerType | "";
  kind: PartnerKind;
  phone: string;
  idCardNumber: string;
  registrationNumber: string;
  taxNumber: string;
  contactPerson: string;
  address: string;
  notes: string;
  trusted: boolean;
}

function toFieldValues(
  partner: PartnerResponse | null,
  type: PartnerType | undefined,
): PartnerFieldValues {
  return {
    name: partner?.name ?? "",
    type: partner?.type ?? type ?? "",
    kind: partner?.kind ?? defaultKindFor(partner?.type ?? type),
    phone: formatPhoneInput(partner?.phone),
    contactPerson: partner?.contactPerson ?? "",
    idCardNumber: partner?.idCardNumber ?? "",
    registrationNumber: partner?.registrationNumber ?? "",
    taxNumber: partner?.taxNumber ?? "",
    address: partner?.address ?? "",
    notes: partner?.notes ?? "",
    trusted: partner?.trusted ?? false,
  };
}

/**
 * Creates or edits a partner of any type. Limits mirror
 * `partner.dto.CreatePartnerRequest`.
 *
 * - `type` fixes the type for a new partner (each section's register). Without
 *   it — the "all partners" view — a type picker is shown, on create only: an
 *   existing partner's type is never changed here, because purchases,
 *   prefinances and deliveries were recorded against it.
 * - `kind` says whether the partner is an individual or a company. A company
 *   is described by its legal name, location and contact person; its RCCM and
 *   NIU are rarely shared, so they are optional and tucked away.
 * - `trusted` only means something for a BUYER (it gates prefinancing), so the
 *   checkbox is shown for buyers alone.
 */
export function PartnerForm({
  partner,
  type,
  saving,
  onCancel,
  onSave,
}: {
  partner: PartnerResponse | null;
  type?: PartnerType;
  saving: boolean;
  onCancel: () => void;
  onSave: (values: PartnerFormValues) => Promise<void>;
}) {
  const { t } = useTranslation();
  const isEdit = Boolean(partner);
  const rules = useFieldRules();
  const [showIdentifiers, setShowIdentifiers] = useState(
    Boolean(partner?.registrationNumber || partner?.taxNumber),
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isValid, isSubmitting, dirtyFields },
  } = useForm<PartnerFieldValues>({
    mode: "onChange",
    defaultValues: toFieldValues(partner, type),
  });

  const values = useWatch({ control });
  const hasChanges =
    !partner || hasChanged(toFieldValues(partner, type), values);
  const selectedType = useWatch({ control, name: "type" });
  const kind = useWatch({ control, name: "kind" });
  const isBuyer = selectedType === PartnerType.BUYER;
  const isCompany = kind === PartnerKind.COMPANY;

  // While saving: loader on the submit button, Cancel disabled, dialog locked.
  const pending = saving || isSubmitting;
  useDialogBusy(pending);

  const onSubmit = handleSubmit(async (fields) => {
    if (!fields.type) return;
    // On an edit, a cleared field is sent as "" so it is actually cleared — the
    // PATCH endpoint ignores absent (null) fields. On a create it is omitted.
    const text = (value: string) => value.trim() || (isEdit ? "" : undefined);
    const company = fields.kind === PartnerKind.COMPANY;
    await onSave({
      name: fields.name.trim(),
      type: fields.type,
      kind: fields.kind,
      phone: toStoredPhone(fields.phone) ?? text(""),
      address: text(fields.address),
      contactPerson: text(fields.contactPerson),
      // Only the identifiers that fit the kind are sent; switching kind never
      // wipes the other ones, so switching back loses nothing.
      idCardNumber: company ? undefined : text(fields.idCardNumber),
      registrationNumber: company ? text(fields.registrationNumber) : undefined,
      taxNumber: company ? text(fields.taxNumber) : undefined,
      notes: text(fields.notes),
      trusted: fields.type === PartnerType.BUYER ? fields.trusted : undefined,
    });
  });

  const contactPersonField = (
    <Field
      label={t("partners.fields.contactPerson")}
      htmlFor="partner-contact-person"
      hint={isCompany ? t("partners.fields.contactPersonHint") : undefined}
      error={errors.contactPerson?.message}
    >
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <User2 />
        </InputGroupAddon>
        <InputGroupInput
          id="partner-contact-person"
          maxLength={160}
          aria-invalid={Boolean(errors.contactPerson)}
          {...register("contactPerson", rules.name({ required: false }))}
        />
      </InputGroup>
    </Field>
  );

  return (
    <form onSubmit={onSubmit} className="grid gap-2">
      {!type && !isEdit && (
        <Field
          label={t("partners.fields.type")}
          htmlFor="partner-type"
          required
        >
          <Controller
            name="type"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(next) => {
                  field.onChange(next);
                  // Follow the type's usual kind until the user picks one.
                  if (!dirtyFields.kind) {
                    setValue("kind", defaultKindFor(next as PartnerType), {
                      shouldValidate: true,
                    });
                  }
                }}
              >
                <SelectTrigger id="partner-type" className="w-full">
                  <SelectValue placeholder={t("partners.fields.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_SECTIONS.map((section) => (
                    <SelectItem
                      key={section.slug}
                      value={section.type as PartnerType}
                    >
                      {t(`partners.types.${section.type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      )}

      <Field label={t("partners.fields.kind")} htmlFor="partner-kind">
        <Controller
          name="kind"
          control={control}
          render={({ field }) => (
            <RadioGroup
              id="partner-kind"
              value={field.value}
              onValueChange={field.onChange}
              className="grid grid-cols-2 gap-2"
            >
              {[PartnerKind.INDIVIDUAL, PartnerKind.COMPANY].map((option) => (
                <Label
                  key={option}
                  htmlFor={`partner-kind-${option}`}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-cocoa-100 px-3 py-2 font-normal has-data-[state=checked]:border-cocoa-500 has-data-[state=checked]:bg-cocoa-50"
                >
                  <RadioGroupItem
                    id={`partner-kind-${option}`}
                    value={option}
                  />
                  {option === PartnerKind.COMPANY ? (
                    <Building2
                      className="size-4 text-cocoa-500"
                      aria-hidden="true"
                    />
                  ) : (
                    <UserCircle
                      className="size-4 text-cocoa-500"
                      aria-hidden="true"
                    />
                  )}
                  {t(`partners.kinds.${option}`)}
                </Label>
              ))}
            </RadioGroup>
          )}
        />
      </Field>

      <div className="grid gap-x-3 sm:grid-cols-2">
        <Field
          label={t(
            isCompany
              ? "partners.fields.legalName"
              : "partners.fields.fullName",
          )}
          htmlFor="partner-name"
          required
          error={errors.name?.message}
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              {isCompany ? <Building2 /> : <UserCircle />}
            </InputGroupAddon>
            <InputGroupInput
              id="partner-name"
              maxLength={160}
              required
              aria-invalid={Boolean(errors.name)}
              {...register("name", rules.name())}
            />
          </InputGroup>
        </Field>
        {isCompany ? (
          contactPersonField
        ) : (
          <Field
            label={t("partners.fields.idNumber")}
            htmlFor="partner-id-card"
            error={errors.idCardNumber?.message}
          >
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <CreditCard />
              </InputGroupAddon>
              <InputGroupInput
                id="partner-id-card"
                placeholder={t("buyers.idNumberPlaceholder")}
                maxLength={120}
                autoCapitalize="characters"
                aria-invalid={Boolean(errors.idCardNumber)}
                {...register("idCardNumber", {
                  ...rules.idCard({ required: false, accept: partner?.idCardNumber }),
                  onChange: (event) =>
                    setValue("idCardNumber", sanitizeIdCardInput(event.target.value), {
                      shouldValidate: true,
                    }),
                })}
              />
            </InputGroup>
          </Field>
        )}
      </div>

      <div className="grid gap-x-3 sm:grid-cols-2">
        <Field
          label={t("partners.fields.phone")}
          htmlFor="partner-phone"
          error={errors.phone?.message}
        >
          <PhoneInput
            id="partner-phone"
            aria-invalid={Boolean(errors.phone)}
            {...register("phone", rules.phone())}
          />
        </Field>
        {isCompany ? (
          <Field
            label={t("partners.fields.location")}
            htmlFor="partner-address"
          >
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <MapPin />
              </InputGroupAddon>
              <InputGroupInput
                id="partner-address"
                maxLength={255}
                placeholder={t("partners.fields.locationPlaceholder")}
                {...register("address")}
              />
            </InputGroup>
          </Field>
        ) : (
          contactPersonField
        )}
      </div>

      {!isCompany && (
        <Field label={t("partners.fields.address")} htmlFor="partner-address">
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <MapPin />
            </InputGroupAddon>
            <InputGroupInput
              id="partner-address"
              maxLength={255}
              {...register("address")}
            />
          </InputGroup>
        </Field>
      )}

      {isCompany && (
        <div className="mb-4">
          <button
            type="button"
            className="flex items-center gap-1 text-sm font-medium text-cocoa-700 hover:text-cocoa-900"
            aria-expanded={showIdentifiers}
            onClick={() => setShowIdentifiers((open) => !open)}
          >
            <ChevronDown
              className={`size-4 transition-transform ${showIdentifiers ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
            {t("partners.fields.officialIdentifiers")}
          </button>
          {showIdentifiers && (
            <div className="mt-3 grid gap-x-3 sm:grid-cols-2">
              <Field
                label={t("partners.fields.registrationNumber")}
                htmlFor="partner-rccm"
              >
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <FileText />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="partner-rccm"
                    maxLength={64}
                    placeholder="RC/DLA/2020/B/1234"
                    {...register("registrationNumber")}
                  />
                </InputGroup>
              </Field>
              <Field
                label={t("partners.fields.taxNumber")}
                htmlFor="partner-niu"
              >
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <FileText />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="partner-niu"
                    maxLength={32}
                    placeholder="M012000000000X"
                    {...register("taxNumber")}
                  />
                </InputGroup>
              </Field>
            </div>
          )}
        </div>
      )}

      <Field label={t("partners.fields.notes")} htmlFor="partner-notes">
        <NoteSuggestButton
          context="PARTNER"
          disabled={pending}
          details={() => {
            const values = getValues();
            return {
              Type: values.type,
              Kind: values.kind === PartnerKind.COMPANY ? "company" : "individual",
              Name: values.name,
              "Contact person": values.contactPerson,
              Location: values.address,
              Trusted: values.type === PartnerType.BUYER ? (values.trusted ? "yes" : "no") : undefined,
            };
          }}
          onSuggest={(text) => setValue("notes", text, { shouldDirty: true, shouldValidate: true })}
        />
        <Textarea
          id="partner-notes"
          rows={2}
          maxLength={255}
          {...register("notes")}
        />
      </Field>

      {isBuyer && (
        <>
          <div className="flex items-center gap-2">
            <Controller
              name="trusted"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="partner-trusted"
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
              )}
            />
            <Label htmlFor="partner-trusted">{t("buyers.isTrusted")}</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("buyers.trustedHint")}
          </p>
        </>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          {t("common.cancel")}
        </Button>
        <SubmitButton
          pending={pending}
          className="px-5"
          disabled={!isValid || !hasChanges || !selectedType}
        >
          {isEdit ? t("common.save") : t("common.actions.create")}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}
