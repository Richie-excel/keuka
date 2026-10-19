import { useState } from "react";
import { Building2, Fingerprint, Mail, UserCircle, AtSign, MapPin, Warehouse, Hash } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useForm, useWatch } from "react-hook-form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { useDialogBusy } from "@/components/ui/dialog-busy";
import { DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/field";
import {
  deriveCompanyCode,
  deriveWarehouseCode,
  hasChanged,
  notBlank,
} from "@/lib/utils";
import type {
  EnterpriseResponse,
  CreateEnterpriseInput,
} from "@/api/enterprises";
import {
  useCreateEnterprise,
  useUpdateEnterprise,
} from "@/shared/hooks/use-enterprises";
import { useFieldRules } from "@/shared/hooks/use-field-rules";

const DEFAULT_WAREHOUSE_NAME = "Main warehouse";
const EMPTY_ENTERPRISE: CreateEnterpriseInput = {
  uniqueId: "",
  companyCode: "",
  name: "",
  legalName: "",
  warehouseCode: deriveWarehouseCode("", "", DEFAULT_WAREHOUSE_NAME),
  warehouseName: DEFAULT_WAREHOUSE_NAME,
  warehouseLocation: "",
  adminUsername: "",
  adminFullName: "",
  adminEmail: "",
};

function EnterpriseForm({
  isCreate,
  enterprise,
  onClose,
}: {
  isCreate: boolean;
  enterprise?: EnterpriseResponse;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const rules = useFieldRules();
  const create = useCreateEnterprise();
  const update = useUpdateEnterprise();
  // Fixed per opening so the generated company code stays stable while typing.
  const [createdAt] = useState(() => Date.now());

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CreateEnterpriseInput>({
    mode: "onChange",
    defaultValues: {
      ...EMPTY_ENTERPRISE,
      uniqueId: enterprise?.uniqueId ?? "",
      companyCode: enterprise?.companyCode ?? "",
      name: enterprise?.displayName ?? "",
      legalName: enterprise?.legalName ?? "",
    },
  });

  const [uniqueId, name, legalName] = useWatch({
    control,
    name: ["uniqueId", "name", "legalName"],
  });

  const hasChanges =
    isCreate ||
    !enterprise ||
    hasChanged(
      {
        uniqueId: enterprise.uniqueId,
        name: enterprise.displayName,
        legalName: enterprise.legalName,
      },
      { uniqueId, name, legalName },
    );

  const busy = create.isPending || update.isPending;
  const error = create.error ?? update.error;

  function toCreateInput(values: CreateEnterpriseInput): CreateEnterpriseInput {
    const trimmed = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value,
      ]),
    );
    return trimmed as CreateEnterpriseInput;
  }

  // While saving: loader on the submit button, Cancel disabled, dialog locked.
  const pending = busy || isSubmitting;
  useDialogBusy(pending);

  const onSubmit = handleSubmit((values) => {
    if (isCreate) {
      return create
        .submitAsync(toCreateInput(values))
        .then(onClose, () => undefined);
    }
    if (enterprise) {
      update.mutate(
        {
          companyCode: enterprise.companyCode,
          input: {
            // Optional on edit: blank or unchanged keeps the current unique id.
            uniqueId:
              values.uniqueId.trim() && values.uniqueId.trim() !== enterprise.uniqueId
                ? values.uniqueId.trim()
                : undefined,
            displayName: values.name,
            legalName: values.legalName || undefined,
          },
        },
        { onSuccess: onClose },
      );
    }
  });
  function syncDerivedCodes(
    changed: Partial<
      Pick<CreateEnterpriseInput, "legalName" | "name" | "warehouseName">
    >,
  ) {
    const current = { ...getValues(), ...changed };
    const legal = current.legalName ?? "";
    const display = current.name ?? "";
    const warehouse = current.warehouseName ?? "";

    setValue("companyCode", deriveCompanyCode(legal, display, createdAt), {
      shouldValidate: true,
    });
    setValue("warehouseCode", deriveWarehouseCode(legal, display, warehouse), {
      shouldValidate: true,
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-h-[65vh] space-y-1 overflow-y-auto px-1 hide-scrollbar"
    >
      {isCreate ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t("dashboard.enterprise.legalName")}
              htmlFor="enterprise-legal"
              error={errors.legalName?.message}
            >
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Building2 className="text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  id="enterprise-legal"
                  maxLength={200}
                  aria-invalid={Boolean(errors.legalName)}
                  {...register("legalName", {
                    ...rules.name({ required: false }),
                    onChange: (event) =>
                      syncDerivedCodes({ legalName: event.target.value }),
                  })}
                />
              </InputGroup>
            </Field>
            <Field
              label={t("dashboard.enterprise.displayName")}
              htmlFor="enterprise-name"
              required
              error={errors.name?.message}
            >
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Building2 className="text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  id="enterprise-name"
                  required
                  maxLength={160}
                  aria-invalid={Boolean(errors.name)}
                  {...register("name", {
                    ...rules.name(),
                    onChange: (event) =>
                      syncDerivedCodes({ name: event.target.value }),
                  })}
                />
              </InputGroup>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t("dashboard.enterprise.uniqueId")}
              htmlFor="enterprise-unique-id"
              required
            >
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Fingerprint className="text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  id="enterprise-unique-id"
                  required
                  {...register("uniqueId", {
                    required: true,
                    validate: notBlank,
                  })}
                />
              </InputGroup>
            </Field>
            <Field
              label={t("dashboard.enterprise.companyCode")}
              htmlFor="enterprise-code"
              required
              hint={t("dashboard.enterprise.companyCodeHint", {
                defaultValue: "Generated from the company name.",
              })}
            >
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Hash className="text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  id="enterprise-code"
                  required
                  maxLength={32}
                  {...register("companyCode", {
                    required: true,
                    validate: notBlank,
                  })}
                  className="cursor-not-allowed bg-muted text-muted-foreground"
                />
              </InputGroup>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t("dashboard.warehouse.code")}
              htmlFor="enterprise-warehouse-code"
            >
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Hash className="text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  id="enterprise-warehouse-code"
                  maxLength={32}
                  {...register("warehouseCode")}
                  className="cursor-not-allowed bg-muted text-muted-foreground"
                />
              </InputGroup>
            </Field>
            <Field
              label={t("dashboard.warehouse.name")}
              htmlFor="enterprise-warehouse-name"
              error={errors.warehouseName?.message}
            >
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Warehouse className="text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  id="enterprise-warehouse-name"
                  maxLength={160}
                  aria-invalid={Boolean(errors.warehouseName)}
                  {...register("warehouseName", {
                    ...rules.name({ required: false }),
                    onChange: (event) =>
                      syncDerivedCodes({ warehouseName: event.target.value }),
                  })}
                />
              </InputGroup>
            </Field>
          </div>
          <Field
            label={t("dashboard.warehouse.location")}
            htmlFor="enterprise-warehouse-location"
          >
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <MapPin className="text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                id="enterprise-warehouse-location"
                maxLength={255}
                {...register("warehouseLocation")}
              />
            </InputGroup>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t("dashboard.enterprise.adminUsername")}
              htmlFor="enterprise-admin-user"
              required
            >
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <AtSign className="text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  id="enterprise-admin-user"
                  // This is a NEW person's account, not the signed-in user's: stop the
                  // browser from filling in the current user's saved username.
                  autoComplete="off"
                  required
                  maxLength={80}
                  {...register("adminUsername", {
                    required: true,
                    validate: notBlank,
                  })}
                />
              </InputGroup>
            </Field>
            {/* No password: the boss is emailed an invitation to choose their own. */}
            <p className="mt-6 flex items-start gap-2 self-start rounded-md bg-cocoa-50 px-3 py-2 text-xs text-cocoa-700">
              <Mail className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {t("dashboard.enterprise.invitationNotice")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t("dashboard.enterprise.adminFullName")}
              htmlFor="enterprise-admin-name"
              required
              error={errors.adminFullName?.message}
            >
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <UserCircle className="text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  id="enterprise-admin-name"
                  required
                  maxLength={160}
                  aria-invalid={Boolean(errors.adminFullName)}
                  {...register("adminFullName", rules.name())}
                />
              </InputGroup>
            </Field>
            <Field
              label={t("dashboard.enterprise.adminEmail")}
              htmlFor="enterprise-admin-email"
              required
              error={errors.adminEmail?.message}
            >
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Mail className="text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  id="enterprise-admin-email"
                  type="email"
                  placeholder={t("validation.emailPlaceholder")}
                  required
                  aria-invalid={Boolean(errors.adminEmail)}
                  {...register("adminEmail", rules.email())}
                />
              </InputGroup>
            </Field>
          </div>
        </>
      ) : (
        <>
          <Field
            label={t("dashboard.enterprise.uniqueId")}
            htmlFor="enterprise-edit-unique-id"
            hint={t("dashboard.enterprise.uniqueIdEditHint")}
          >
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <Fingerprint className="text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                id="enterprise-edit-unique-id"
                maxLength={32}
                {...register("uniqueId")}
              />
            </InputGroup>
          </Field>
          <Field
            label={t("dashboard.enterprise.displayName")}
            htmlFor="enterprise-edit-name"
            required
            error={errors.name?.message}
          >
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <Building2 className="text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                id="enterprise-edit-name"
                required
                maxLength={160}
                aria-invalid={Boolean(errors.name)}
                {...register("name", rules.name())}
              />
            </InputGroup>
          </Field>
          <Field
            label={t("dashboard.enterprise.legalName")}
            htmlFor="enterprise-edit-legal"
            error={errors.legalName?.message}
          >
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <Building2 className="text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                id="enterprise-edit-legal"
                maxLength={200}
                aria-invalid={Boolean(errors.legalName)}
                {...register("legalName", rules.name({ required: false }))}
              />
            </InputGroup>
          </Field>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}
      <DialogFooter>
        <SubmitButton
          pending={pending}
          disabled={!isValid || !hasChanges}
          className="px-8 gap-x-3"
        >
          {isCreate ? t("common.actions.create") : t("common.save")}
        </SubmitButton>
        <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
          {t("common.cancel")}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default EnterpriseForm;
