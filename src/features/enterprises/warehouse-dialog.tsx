import { useState } from "react";
import { MapPin, Hash, Warehouse } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type {
  WarehouseSummary,
  WarehouseInput,
  WarehouseUpdateInput,
} from "@/api/warehouses";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { useDialogBusy } from "@/components/ui/dialog-busy";
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
  useCreateWarehouse,
  useUpdateWarehouse,
} from "@/shared/hooks/use-warehouses";
import { Detail } from "@/features/enterprises/detail-list";
import { deriveWarehouseCode, hasChanged, notBlank } from "@/lib/utils";
import { useFieldRules } from "@/shared/hooks/use-field-rules";

type WarehouseMode = "create" | "view" | "edit";

/**
 * The slice of an enterprise the warehouse form needs.
 *
 * WHY it is passed in: a warehouse code is derived from the enterprise that
 * owns it (its legal and display names) plus the warehouse's own name, so the
 * create form cannot build one without these two names. The array page only
 * renders the create action once an enterprise is selected, so the two always
 * arrive together.
 */
export interface WarehouseEnterprise {
  displayName: string;
  legalName?: string | null;
  /** The enterprise's id; sent on create so the platform operator's warehouse lands in it. */
  tenantId?: string;
}

interface WarehouseDialogProps {
  open: boolean;
  mode: WarehouseMode;
  warehouse?: WarehouseSummary;
  enterprise?: WarehouseEnterprise;
  canEdit?: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

export function WarehouseDialog({
  open,
  mode,
  warehouse,
  enterprise,
  canEdit,
  onOpenChange,
  onEdit,
}: WarehouseDialogProps) {
  const { t } = useTranslation();
  const close = () => onOpenChange(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(`dashboard.warehouse.${mode}Title`)}</DialogTitle>
          <DialogDescription>
            {t(`dashboard.warehouse.${mode}Description`)}
          </DialogDescription>
        </DialogHeader>
        {mode === "view" && warehouse ? (
          <WarehouseView
            warehouse={warehouse}
            canEdit={canEdit}
            onEdit={onEdit}
            onClose={close}
          />
        ) : (
          <WarehouseForm
            isCreate={mode === "create"}
            warehouse={warehouse}
            enterprise={enterprise}
            onClose={close}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── View ────────────────────────────────────────────────────────── */

function WarehouseView({
  warehouse,
  canEdit,
  onEdit,
  onClose,
}: {
  warehouse: WarehouseSummary;
  canEdit?: boolean;
  onEdit?: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Detail label={t("dashboard.warehouse.code")} value={warehouse.code} />
        <Detail label={t("dashboard.warehouse.name")} value={warehouse.name} />
        <Detail
          label={t("dashboard.warehouse.location")}
          value={warehouse.location ?? "—"}
        />
        <Detail
          label={t("dashboard.warehouse.status")}
          value={
            warehouse.active
              ? t("dashboard.warehouse.active")
              : t("dashboard.warehouse.inactive")
          }
        />
      </dl>
      <DialogFooter>
        {canEdit && (
          <Button type="button" onClick={onEdit}>
            {t("common.actions.edit")}
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onClose}>
          {t("common.cancel")}
        </Button>
      </DialogFooter>
    </>
  );
}

/* ── Create / edit form ──────────────────────────────────────────── */

function WarehouseForm({
  isCreate,
  warehouse,
  enterprise,
  onClose,
}: {
  isCreate: boolean;
  warehouse?: WarehouseSummary;
  enterprise?: WarehouseEnterprise;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const rules = useFieldRules();
  const create = useCreateWarehouse();
  const update = useUpdateWarehouse();
  // Fixed per opening so the generated code stays stable while the user types
  // the warehouse name instead of changing on every keystroke.
  const [createdAt] = useState(() => Date.now());

  const legalName = enterprise?.legalName ?? "";
  const displayName = enterprise?.displayName ?? "";

  /** Enterprise legal name + display name + warehouse name (+ a time part). */
  const deriveCode = (warehouseName: string) =>
    deriveWarehouseCode(legalName, displayName, warehouseName, createdAt);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<WarehouseInput>({
    mode: "onChange",
    defaultValues: {
      // Generated on create; an existing warehouse keeps the code the server
      // already stored, and the update call never sends it anyway.
      code: warehouse?.code ?? deriveCode(warehouse?.name ?? ""),
      name: warehouse?.name ?? "",
      location: warehouse?.location ?? "",
    },
  });

  const [name, location] = useWatch({ control, name: ["name", "location"] });

  const syncCode = (nextName: string) => {
    setValue("code", deriveCode(nextName), { shouldValidate: true });
  };

  const hasChanges =
    isCreate ||
    !warehouse ||
    hasChanged(
      { name: warehouse.name, location: warehouse.location },
      { name, location },
    );

  const busy = create.isPending || update.isPending;
  const error = create.error ?? update.error;

  // While saving: loader on the submit button, Cancel disabled, dialog locked.
  const pending = busy;
  useDialogBusy(pending);

  const onSubmit = handleSubmit((values) => {
    const trimmedName = values.name.trim();
    const trimmedLocation = (values.location ?? "").trim();

    if (isCreate) {
      return create
        .submitAsync({
          code: values.code.trim(),
          name: trimmedName,
          location: trimmedLocation,
          enterpriseId: enterprise?.tenantId,
        })
        .then(onClose, () => undefined);
    }
    if (warehouse) {
      const input: WarehouseUpdateInput = {
        name: trimmedName,
        location: trimmedLocation,
      };
      update.mutate({ id: warehouse.id, input }, { onSuccess: onClose });
    }
    return undefined;
  });

  return (
    <form onSubmit={onSubmit}>
      {isCreate && (
        <div className="grid sm:grid-cols-2 gap-x-3">
          <Field
              label={t("dashboard.warehouse.name")}
              htmlFor="warehouse-name"
              required
              error={errors.name?.message}
            >
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Warehouse className="text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  id="warehouse-name"
                  required
                  maxLength={160}
                  aria-invalid={Boolean(errors.name)}
                  {...register("name", {
                    ...rules.name(),
                    onChange: (event) => syncCode(event.target.value),
                  })}
                />
              </InputGroup>
          </Field>
          <Field
            label={t("dashboard.warehouse.code")}
            htmlFor="warehouse-code"
            required
            hint={t("dashboard.warehouse.codeHint", {
              defaultValue:
                "Generated automatically",
            })}
          >
            <Controller
              control={control}
              name="code"
              rules={{ required: true, validate: notBlank }}
              render={({ field }) => (
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Hash className="text-muted-foreground" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="warehouse-code"
                    value={field.value ?? ""}
                    readOnly
                    disabled
                    maxLength={32}
                    aria-readonly="true"
                    className="cursor-not-allowed bg-muted text-muted-foreground"
                  />
                </InputGroup>
              )}
            />
          </Field>
        </div>
      )}
      <Field
        label={t("dashboard.warehouse.location")}
        htmlFor="warehouse-location"
      >
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <MapPin className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            id="warehouse-location"
            maxLength={255}
            {...register("location")}
          />
        </InputGroup>
      </Field>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}
      <DialogFooter>
        <SubmitButton pending={pending} disabled={!isValid || !hasChanges}>
          {isCreate ? t("common.actions.create") : t("common.save")}
        </SubmitButton>
        <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
          {t("common.cancel")}
        </Button>
      </DialogFooter>
    </form>
  );
}
