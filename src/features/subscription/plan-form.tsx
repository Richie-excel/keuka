import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Banknote, ListOrdered, Coins, Hash, Layers, Users, Warehouse } from "lucide-react";
import type { PlanResponse } from "@/api/plans";
import { BillingPeriod, PlanModule } from "@/enums";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Field, Select } from "@/components/field";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { useDialogBusy } from "@/components/ui/dialog-busy";
import { DialogFooter } from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeAmountInput, parseAmount } from "@/lib/amount";
import { hasChanged, notBlank } from "@/lib/utils";
import { useApiErrorMessage } from "@/shared/hooks/use-api-error-message";
import { useFieldRules } from "@/shared/hooks/use-field-rules";
import { useCreatePlan, useUpdatePlan } from "@/shared/hooks/use-plans";
import { BenefitRowsEditor } from "@/features/subscription/benefit-rows-editor";
import { FeatureRowsEditor } from "@/features/subscription/feature-rows-editor";
import { formatPlanPrice } from "@/features/subscription/plan-price";
import {
  PLAN_CODE_MAX_LENGTH,
  PLAN_DESCRIPTION_MAX_LENGTH,
  PLAN_NAME_MAX_LENGTH,
  buildCreatePlanRequest,
  buildUpdatePlanRequest,
  derivePlanCode,
  emptyPlanFormValues,
  isValidPlanCode,
  isValidPlanLimit,
  isValidPlanPrice,
  planFormValuesFrom,
  type PlanFormValues,
} from "@/features/subscription/plan-form-values";

/**
 * The plan editor — everything a super admin needs to define an offer in one
 * pass: what it is called, what it costs, what it includes and why anyone
 * should want it. That "in one pass" is the point: a plan defined across
 * several screens would routinely be left half-described, and a company being
 * asked to pay would be shown a price with no explanation attached.
 *
 * WHY IT HANDLES BOTH CREATE AND EDIT rather than being two forms: the fields
 * are identical and the only real differences are that `code` is fixed once the
 * plan exists and that the request omits it. Two components would be two places
 * to fix the next validation bug.
 *
 * WHY `code` IS DERIVED FROM THE NAME AND READ-ONLY: it is the key a
 * subscription stores (`SubscriptionResponse.planCode`), so it must exist on
 * create and must never change afterwards. Letting it be typed invites a rename
 * that silently orphans every tenant on the plan — the same reasoning that makes
 * a warehouse code read-only in the warehouse form.
 */

/** Blank means "no preference", which is not the same as 0. */
const isValidDisplayOrder = (value: string) =>
  value.trim() === "" || /^\d+$/.test(value.trim());

export function PlanForm({
  plan,
  onClose,
}: {
  /** Present when editing; absent when creating. */
  plan?: PlanResponse;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const rules = useFieldRules();
  const isCreate = plan === undefined;

  const create = useCreatePlan();
  const update = useUpdatePlan();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<PlanFormValues>({
    mode: "onChange",
    defaultValues: plan ? planFormValuesFrom(plan) : emptyPlanFormValues(),
  });

  // Every field at once. These lists are short and the preview below needs
  // several of them together, so watching them one by one would be the same
  // work spread over more lines.
  const values = useWatch({ control }) as PlanFormValues;

  const serverError = useApiErrorMessage(create.error ?? update.error);
  const busy = create.isPending || update.isPending;

  /**
   * The price as the customer will read it. Shown under the fields because
   * "25 000 XAF per month" is the thing the administrator is actually deciding,
   * and a bare number in a box does not read as a price.
   */
  const pricePreview = (() => {
    if (values.priceAmount.trim() === "") return null;
    const parsed = parseAmount(values.priceAmount);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return formatPlanPrice(parsed, values.currency);
  })();

  /**
   * An edit that changes nothing has nothing to send. Measured against the plan
   * that was loaded — not against a blank form — so the button is dead until a
   * field actually moves, rather than offering a no-op PATCH.
   */
  const nothingToSave =
    plan !== undefined && !hasChanged(planFormValuesFrom(plan), values);

  // While saving: loader on the submit button, Cancel disabled, dialog locked.
  const pending = busy || isSubmitting;
  useDialogBusy(pending);

  const onSubmit = handleSubmit((formValues) => {
    if (isCreate) {
      return create
        .submitAsync(buildCreatePlanRequest(formValues))
        .then(onClose, () => undefined);
    }
    update.mutate(
      { code: plan.code, input: buildUpdatePlanRequest(formValues) },
      { onSuccess: onClose },
    );
    return undefined;
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* ── The offer ─────────────────────────────────────────────── */}
      <div className="grid gap-x-3 sm:grid-cols-2">
        <Field
          label={t("plans.form.name")}
          htmlFor="plan-name"
          required
          hint={t("plans.form.nameHint")}
          error={errors.name?.message}
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Layers className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              id="plan-name"
              required
              maxLength={PLAN_NAME_MAX_LENGTH}
              aria-invalid={Boolean(errors.name)}
              {...register("name", {
                ...rules.name(),
                // Creating: the code follows the name. Editing: it is fixed, so
                // nothing is synced.
                onChange: (event) => {
                  if (isCreate) {
                    setValue("code", derivePlanCode(event.target.value), {
                      shouldValidate: true,
                    });
                  }
                },
              })}
            />
          </InputGroup>
        </Field>

        <Field
          label={t("plans.form.code")}
          htmlFor="plan-code"
          required
          hint={
            isCreate
              ? t("plans.form.codeHintCreate")
              : t("plans.form.codeHintEdit")
          }
        >
          <Controller
            control={control}
            name="code"
            rules={{
              required: true,
              validate: isValidPlanCode,
            }}
            render={({ field }) => (
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Hash className="text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  id="plan-code"
                  value={field.value}
                  readOnly
                  disabled
                  maxLength={PLAN_CODE_MAX_LENGTH}
                  aria-readonly="true"
                  className="cursor-not-allowed bg-muted text-muted-foreground"
                />
              </InputGroup>
            )}
          />
        </Field>
      </div>

      <Field
        label={t("plans.form.description")}
        htmlFor="plan-description"
        hint={t("plans.form.descriptionHint")}
      >
        <Textarea
          id="plan-description"
          rows={2}
          maxLength={PLAN_DESCRIPTION_MAX_LENGTH}
          {...register("description")}
        />
      </Field>

      {/* ── The price ─────────────────────────────────────────────── */}
      <div className="grid gap-x-3 sm:grid-cols-[2fr_1fr_1fr]">
        <Field
          label={t("plans.form.price")}
          htmlFor="plan-price"
          required
          hint={t("plans.form.priceHint")}
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Banknote className="text-muted-foreground" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="plan-price"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              required
              placeholder={t("plans.form.pricePlaceholder")}
              {...register("priceAmount", {
                required: true,
                validate: isValidPlanPrice,
                // Same treatment as every other money field: digits and at most
                // two decimals.
                onChange: (event) =>
                  setValue(
                    "priceAmount",
                    sanitizeAmountInput(event.target.value),
                    { shouldValidate: true },
                  ),
              })}
            />
          </InputGroup>
        </Field>

        <Field
          label={t("plans.form.currency")}
          htmlFor="plan-currency"
          required
          hint={t("plans.form.currencyHint")}
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Coins className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              id="plan-currency"
              required
              maxLength={8}
              className="uppercase"
              {...register("currency", {
                required: true,
                validate: notBlank,
              })}
            />
          </InputGroup>
        </Field>

        <Field
          label={t("plans.form.billingPeriod")}
          htmlFor="plan-billing-period"
          required
        >
          <Select id="plan-billing-period" {...register("billingPeriod")}>
            {Object.values(BillingPeriod).map((period) => (
              <option key={period} value={period}>
                {t(`plans.billingPeriod.${period}`)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {pricePreview && (
        <p className="rounded-lg border border-cocoa-100 bg-paper px-3 py-2 text-sm text-cocoa-700">
          {t("plans.form.pricePreview", {
            price: pricePreview,
            period: t(`plans.billingPeriodShort.${values.billingPeriod}`),
          })}
        </p>
      )}

      {/* ── What it allows: enforced by the server ─────────────────── */}
      <section className="space-y-2 border-t border-cocoa-100 pt-4">
        <div>
          <h3 className="text-sm font-semibold text-cocoa-900">
            {t("plans.form.allowsHeading")}
          </h3>
          <p className="mt-0.5 text-xs text-cocoa-500">
            {t("plans.form.allowsDescription")}
          </p>
        </div>
        <div className="grid gap-x-3 sm:grid-cols-2">
          <Field
            label={t("plans.form.maxWarehouses")}
            htmlFor="plan-max-warehouses"
            hint={t("plans.form.unlimitedHint")}
            error={errors.maxWarehouses ? t("plans.form.limitInvalid") : undefined}
          >
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <Warehouse className="text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                id="plan-max-warehouses"
                inputMode="numeric"
                placeholder={t("plans.form.unlimited")}
                disabled={busy}
                {...register("maxWarehouses", { validate: isValidPlanLimit })}
              />
            </InputGroup>
          </Field>
          <Field
            label={t("plans.form.maxUsers")}
            htmlFor="plan-max-users"
            hint={t("plans.form.unlimitedHint")}
            error={errors.maxUsers ? t("plans.form.limitInvalid") : undefined}
          >
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <Users className="text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                id="plan-max-users"
                inputMode="numeric"
                placeholder={t("plans.form.unlimited")}
                disabled={busy}
                {...register("maxUsers", { validate: isValidPlanLimit })}
              />
            </InputGroup>
          </Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-cocoa-700">
            {t("plans.form.modules")}
          </legend>
          <Controller
            control={control}
            name="modules"
            render={({ field }) => (
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.values(PlanModule).map((module) => (
                  <Label key={module} className="flex items-center gap-2 font-normal hover:cursor-pointer">
                    <Checkbox
                      checked={field.value.includes(module)}
                      disabled={busy}
                      onCheckedChange={(checked) =>
                        field.onChange(
                          checked === true
                            ? [...field.value, module]
                            : field.value.filter((current) => current !== module),
                        )
                      }
                    />
                    {t(`plans.modules.${module}`)}
                  </Label>
                ))}
              </div>
            )}
          />
          <p className="mt-2 text-xs text-cocoa-500">{t("plans.form.coreAlwaysIncluded")}</p>
        </fieldset>
      </section>

      <section className="space-y-2 border-t border-cocoa-100 pt-4">
        <div>
          <h3 className="text-sm font-semibold text-cocoa-900">
            {t("plans.form.featuresHeading")}
          </h3>
          <p className="mt-0.5 text-xs text-cocoa-500">
            {t("plans.form.featuresDescription")}
          </p>
        </div>
        <Controller
          control={control}
          name="features"
          render={({ field }) => (
            <FeatureRowsEditor
              values={field.value}
              onChange={field.onChange}
              disabled={busy}
            />
          )}
        />
      </section>

      {/* ── Why it is worth it ────────────────────────────────────── */}
      <section className="space-y-2 border-t border-cocoa-100 pt-4">
        <div>
          <h3 className="text-sm font-semibold text-cocoa-900">
            {t("plans.form.benefitsHeading")}
          </h3>
          <p className="mt-0.5 text-xs text-cocoa-500">
            {t("plans.form.benefitsDescription")}
          </p>
        </div>
        <Controller
          control={control}
          name="benefits"
          render={({ field }) => (
            <BenefitRowsEditor
              values={field.value}
              onChange={field.onChange}
              disabled={busy}
            />
          )}
        />
      </section>

      {/* ── The French version (the fields above are the English one) ── */}
      <section className="space-y-2 border-t border-cocoa-100 pt-4">
        <div>
          <h3 className="text-sm font-semibold text-cocoa-900">{t("plans.form.frenchHeading")}</h3>
          <p className="mt-0.5 text-xs text-cocoa-500">{t("plans.form.frenchDescription")}</p>
        </div>
        <Field label={t("plans.form.nameFr")} htmlFor="plan-name-fr">
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Layers className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              id="plan-name-fr"
              maxLength={PLAN_NAME_MAX_LENGTH}
              disabled={busy}
              {...register("nameFr")}
            />
          </InputGroup>
        </Field>
        <Field label={t("plans.form.descriptionFr")} htmlFor="plan-description-fr">
          <Textarea
            id="plan-description-fr"
            rows={2}
            maxLength={255}
            disabled={busy}
            {...register("descriptionFr")}
          />
        </Field>
        <p className="text-sm font-medium text-cocoa-700">{t("plans.form.benefitsFr")}</p>
        <Controller
          control={control}
          name="benefitsFr"
          render={({ field }) => (
            <BenefitRowsEditor values={field.value} onChange={field.onChange} disabled={busy} />
          )}
        />
      </section>

      {/* ── Availability ──────────────────────────────────────────── */}
      <section className="space-y-3 border-t border-cocoa-100 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-cocoa-900">
              {t("plans.form.active")}
            </h3>
            <p className="mt-0.5 max-w-xl text-xs text-cocoa-500">
              {t("plans.form.activeHint")}
            </p>
          </div>
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <Switch
                checked={field.value}
                disabled={busy}
                onCheckedChange={field.onChange}
                aria-label={t("plans.form.active")}
              />
            )}
          />
        </div>

        <Field
          label={t("plans.form.displayOrder")}
          htmlFor="plan-display-order"
          hint={t("plans.form.displayOrderHint")}
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <ListOrdered className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              id="plan-display-order"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className="sm:max-w-32"
              {...register("displayOrder", { validate: isValidDisplayOrder })}
            />
          </InputGroup>
        </Field>
      </section>

      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
          {t("common.cancel")}
        </Button>
        <SubmitButton pending={pending} disabled={!isValid || nothingToSave}>
          {isCreate ? t("plans.form.create") : t("common.save")}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}
