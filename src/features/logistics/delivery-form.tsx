import { useForm, useWatch, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { EmployeeTypeBadge } from "@/components/role-badge";
import { Scale, IdCard, UserCircle, Truck, MapPin, Package, ShieldCheck } from "lucide-react";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { NoteSuggestButton } from "@/components/note-suggest-button";
import { SubmitButton } from "@/components/submit-button";
import { useDialogBusy } from "@/components/ui/dialog-busy";
import { DatePicker } from "@/components/date-picker";
import { DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
import { dateToInstant, formatWeight, localDateKey } from "@/lib/utils";
import { PermissionKey } from "@/enums";
import { useAuth } from "@/shared/hooks/useAuth";
import { useEmployees } from "@/shared/hooks/use-employees";
import { useStockBalance } from "@/shared/hooks/use-inventory";
import type { CreateDeliveryRequest, PartnerResponse } from "@/interfaces";
import { toStoredPhone } from "@/lib/validation";
import { useFieldRules } from "@/shared/hooks/use-field-rules";
import { PhoneInput } from "@/components/phone-input";

interface DeliveryFormValues {
  partnerId: string;
  destination: string;
  vehicleNumber: string;
  vehicleType: string;
  driverName: string;
  driverLicenseNumber: string;
  driverPhone: string;
  departureDate: string;
  declaredNetWeight: string;
  bagCount: string;
  escortEmployeeId: string;
  notes: string;
}

/** What one empty bag weighs, as the server counts it (LogisticsService.BAG_WEIGHT_KG). */
const BAG_WEIGHT_KG = 1;
/** "No escort" in the escort list (a Select item cannot have an empty value). */
const NO_ESCORT = "none";

/** Gross weight of the load: the net cocoa plus its bags. Shown, never typed. */
function grossWeight(net: string, bags: string): number | undefined {
  const kg = Number(net);
  const count = Number(bags);
  if (!net || !Number.isFinite(kg) || kg <= 0) return undefined;
  return kg + (Number.isInteger(count) && count > 0 ? count * BAG_WEIGHT_KG : 0);
}

const isPositive = (value: string) =>
  Number.isFinite(Number(value)) && Number(value) > 0;

const optional = (value: string) => value.trim() || undefined;

/**
 * Records a truck loading. A loading is a trip fact: vehicle and driver are
 * typed in for this trip (there is no fleet or driver register), and the
 * declared weights are final — the server never lets them be amended, so there
 * is no edit mode.
 *
 * Field limits mirror `logistics.dto.CreateDeliveryRequest`; the server also
 * rejects net > gross and any partner that is not COMMERCIAL.
 */
export function DeliveryForm({
  partners,
  partnersLoading,
  partnersError,
  saving,
  error,
  onCancel,
  onSave,
}: {
  /** COMMERCIAL partners — the only ones a delivery may go to. */
  partners: PartnerResponse[];
  partnersLoading: boolean;
  partnersError?: string;
  saving: boolean;
  error?: string;
  onCancel: () => void;
  onSave: (values: CreateDeliveryRequest) => void;
}) {
  const { t } = useTranslation();
  const rules = useFieldRules();

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<DeliveryFormValues>({
    mode: "onChange",
    defaultValues: {
      partnerId: "",
      destination: "",
      vehicleNumber: "",
      vehicleType: "",
      driverName: "",
      driverLicenseNumber: "",
      driverPhone: "",
      departureDate: localDateKey(new Date()),
      declaredNetWeight: "",
      bagCount: "",
      escortEmployeeId: "",
      notes: "",
    },
  });

  const [netWeight, bagCount] = useWatch({ control, name: ["declaredNetWeight", "bagCount"] });
  const gross = grossWeight(netWeight, bagCount);
  const availablePartners = partners.filter((partner) => partner.active);

  // Only what this person may read: the server checks the stock and the escort regardless.
  const { hasPermission } = useAuth();
  const stock = useStockBalance(undefined, hasPermission(PermissionKey.INVENTORY_READ));
  const inStockKg = stock.data?.quantityKg;
  const canPickEscort = hasPermission(PermissionKey.EMPLOYEE_READ);
  const escorts = (useEmployees({ page: 0, size: 200 }, canPickEscort).data?.content ?? []).filter(
    (employee) => employee.active,
  );

  function onSubmit(values: DeliveryFormValues) {
    onSave({
      partnerId: values.partnerId,
      destination: values.destination.trim(),
      vehicleNumber: values.vehicleNumber.trim(),
      vehicleType: optional(values.vehicleType),
      driverName: values.driverName.trim(),
      driverLicenseNumber: values.driverLicenseNumber.trim(),
      driverPhone: toStoredPhone(values.driverPhone),
      departureAt: values.departureDate
        ? dateToInstant(values.departureDate)
        : undefined,
      declaredNetWeight: Number(values.declaredNetWeight),
      bagCount: Number(values.bagCount),
      escortEmployeeId:
        values.escortEmployeeId && values.escortEmployeeId !== NO_ESCORT
          ? values.escortEmployeeId
          : undefined,
      notes: optional(values.notes),
    });
  }

  const required = { required: t("logistics.form.required") };
  const maxLength = (max: number) => ({
    value: max,
    message: t("logistics.form.tooLong", { max }),
  });

  // While saving: loader on the submit button, Cancel disabled, dialog locked.
  const pending = saving || isSubmitting;
  useDialogBusy(pending);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-1">
      <Field
        label={t("logistics.form.partner")}
        htmlFor="delivery-partner"
        required
        error={errors.partnerId?.message}
      >
        <Controller
          name="partnerId"
          control={control}
          rules={required}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={partnersLoading || Boolean(partnersError)}
            >
              <SelectTrigger
                id="delivery-partner"
                className="w-full"
                aria-invalid={Boolean(errors.partnerId)}
              >
                <SelectValue
                  placeholder={
                    partnersLoading
                      ? t("logistics.form.loadingPartners")
                      : t("logistics.form.selectPartner")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availablePartners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      {partnersError && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {partnersError}
        </p>
      )}
      {!partnersLoading && !partnersError && availablePartners.length === 0 && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {t("logistics.form.noPartners")}
        </p>
      )}

      <Field
        label={t("logistics.columnDestination")}
        htmlFor="delivery-destination"
        required
        error={errors.destination?.message}
      >
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <MapPin className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            id="delivery-destination"
            placeholder={t("logistics.form.destinationPlaceholder")}
            aria-invalid={Boolean(errors.destination)}
            {...register("destination", { ...required, maxLength: maxLength(200) })}
          />
        </InputGroup>
      </Field>

      <div className="grid gap-x-3 sm:grid-cols-2">
        <Field
          label={t("logistics.form.vehicleNumber")}
          htmlFor="delivery-vehicle-number"
          required
          error={errors.vehicleNumber?.message}
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Truck className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              id="delivery-vehicle-number"
              placeholder={t("logistics.form.vehicleNumberPlaceholder")}
              aria-invalid={Boolean(errors.vehicleNumber)}
              {...register("vehicleNumber", { ...required, maxLength: maxLength(32) })}
            />
          </InputGroup>
        </Field>
        <Field
          label={t("logistics.form.vehicleType")}
          htmlFor="delivery-vehicle-type"
          error={errors.vehicleType?.message}
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Truck className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              id="delivery-vehicle-type"
              placeholder={t("logistics.form.vehicleTypePlaceholder")}
              {...register("vehicleType", { maxLength: maxLength(40) })}
            />
          </InputGroup>
        </Field>
      </div>

      <Field
        label={t("logistics.form.driverName")}
        htmlFor="delivery-driver-name"
        required
        error={errors.driverName?.message}
      >
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <UserCircle className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            id="delivery-driver-name"
            aria-invalid={Boolean(errors.driverName)}
            {...register("driverName", { ...rules.name(), maxLength: maxLength(160) })}
          />
        </InputGroup>
      </Field>

      <div className="grid gap-x-3 sm:grid-cols-2">
        <Field
          label={t("logistics.form.driverLicense")}
          htmlFor="delivery-driver-license"
          required
          error={errors.driverLicenseNumber?.message}
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <IdCard className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              id="delivery-driver-license"
              aria-invalid={Boolean(errors.driverLicenseNumber)}
              {...register("driverLicenseNumber", {
                ...required,
                maxLength: maxLength(40),
              })}
            />
          </InputGroup>
        </Field>
        <Field
          label={t("logistics.form.driverPhone")}
          htmlFor="delivery-driver-phone"
          error={errors.driverPhone?.message}
        >
          <PhoneInput
            id="delivery-driver-phone"
            aria-invalid={Boolean(errors.driverPhone)}
            {...register("driverPhone", rules.phone())}
          />
        </Field>
      </div>

      <Field
        label={t("logistics.form.escort")}
        htmlFor="delivery-escort"
        hint={canPickEscort ? t("logistics.form.escortHint") : t("logistics.form.escortUnavailable")}
      >
        <Controller
          name="escortEmployeeId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value || NO_ESCORT}
              onValueChange={field.onChange}
              disabled={!canPickEscort}
            >
              <SelectTrigger id="delivery-escort" className="w-full">
                <ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ESCORT}>{t("logistics.form.noEscort")}</SelectItem>
                {escorts.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    <span className="flex items-center gap-2">
                      {employee.fullName}
                      <EmployeeTypeBadge type={employee.employeeType} />
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <div className="grid gap-x-3 sm:grid-cols-3">
        <Field
          label={t("logistics.declaredNetWeight")}
          htmlFor="delivery-net-weight"
          required
          hint={
            inStockKg !== undefined
              ? t("logistics.form.inStock", { weight: formatWeight(inStockKg) })
              : t("logistics.form.netWeightHint")
          }
          error={errors.declaredNetWeight?.message}
        >
          <InputGroup>
            <InputGroupAddon align="inline-end">
              <Scale className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="delivery-net-weight"
              type="text"
              inputMode="decimal"
              placeholder="0.000"
              aria-invalid={Boolean(errors.declaredNetWeight)}
              {...register("declaredNetWeight", {
                ...required,
                validate: (value) => {
                  if (!isPositive(value)) return t("logistics.form.mustBePositive");
                  // The cocoa loaded cannot be more than the cocoa in stock.
                  if (inStockKg !== undefined && Number(value) > inStockKg) {
                    return t("logistics.form.exceedsStock", { weight: formatWeight(inStockKg) });
                  }
                  return true;
                },
              })}
            />
          </InputGroup>
        </Field>
        <Field
          label={t("logistics.form.bags")}
          htmlFor="delivery-bags"
          required
          error={errors.bagCount?.message}
        >
          <InputGroup>
            <InputGroupAddon align="inline-end">
              <Package className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="delivery-bags"
              type="text"
              inputMode="numeric"
              placeholder="0"
              aria-invalid={Boolean(errors.bagCount)}
              {...register("bagCount", {
                ...required,
                validate: (value) =>
                  (/^\d+$/.test(value.trim()) && Number(value) >= 1) ||
                  t("logistics.form.bagsInvalid"),
                onChange: (event) =>
                  setValue("bagCount", event.target.value.replace(/\D/g, ""), { shouldValidate: true }),
              })}
            />
          </InputGroup>
        </Field>
        <Field
          label={t("logistics.form.grossWeight")}
          htmlFor="delivery-gross-weight"
          hint={t("logistics.form.grossWeightHint", { kg: BAG_WEIGHT_KG })}
        >
          <InputGroup>
            <InputGroupAddon align="inline-end">
              <Scale className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="delivery-gross-weight"
              readOnly
              tabIndex={-1}
              aria-readonly="true"
              className="cursor-not-allowed bg-muted text-muted-foreground"
              value={gross === undefined ? "" : formatWeight(gross)}
              placeholder="—"
            />
          </InputGroup>
        </Field>
      </div>

      <Field label={t("logistics.form.departureDate")} htmlFor="delivery-departure">
        <Controller
          name="departureDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              id="delivery-departure"
              value={field.value}
              onValueChange={field.onChange}
              clearable
              placeholder={t("logistics.form.selectDate")}
            />
          )}
        />
      </Field>

      <Field label={t("logistics.form.notes")} htmlFor="delivery-notes">
        <NoteSuggestButton
          context="DELIVERY"
          disabled={pending}
          details={() => {
            const values = getValues();
            return {
              "Commercial partner": partners.find((partner) => partner.id === values.partnerId)?.name,
              Destination: values.destination,
              "Vehicle number": values.vehicleNumber,
              "Vehicle type": values.vehicleType,
              Driver: values.driverName,
              "Departure date": values.departureDate,
              "Net weight": values.declaredNetWeight && `${values.declaredNetWeight} kg`,
              Bags: values.bagCount,
              Escort: escorts.find((employee) => employee.id === values.escortEmployeeId)?.fullName,
            };
          }}
          onSuggest={(text) => setValue("notes", text, { shouldDirty: true, shouldValidate: true })}
        />
        <Textarea id="delivery-notes" rows={2} {...register("notes")} />
      </Field>

      {error && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          {t("common.cancel")}
        </Button>
        <SubmitButton pending={pending} disabled={!isValid}>
          {t("logistics.form.submit")}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}
