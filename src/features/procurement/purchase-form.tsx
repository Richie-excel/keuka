import { useEffect } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Scale } from "lucide-react";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { useDialogBusy } from "@/components/ui/dialog-busy";
import { DatePicker } from "@/components/date-picker";
import { DialogFooter } from "@/components/ui/dialog";
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
import { formatMoney, formatWeight, dateToInstant, localDateKey } from "@/lib/utils";
import { PartnerType, PaymentMethod, PermissionKey } from "@/enums";
import type {
  CreatePurchaseRequest,
  PartnerResponse,
  PurchaseResponse,
} from "@/interfaces";
import { useCurrentCocoaPrice } from "@/shared/hooks/use-cocoa-prices";
import { usePrefinances } from "@/shared/hooks/use-prefinances";
import { LOOKUP_PAGE_SIZE } from "@/constants";
import { previewPrefinanceSettlement } from "./prefinance-settlement";
import { PaidNowSection } from "./paid-now-section";
import { useAuth } from "@/shared/hooks/useAuth";
import { useOpenCashSession } from "@/shared/hooks/use-cash-sessions";
import { parseAmount } from "@/lib/amount";

function localToday(): string {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}
export interface PurchaseFormValues {
  partnerId: string;
  purchaseDate: string;
  grossWeight: string;
  netWeight: string;
  /** "Paid now" — recorded with the purchase (new purchases only). */
  payNow: boolean;
  payMethod: PaymentMethod;
  /** Untouched (not dirty), the amount follows what is left to pay. */
  payAmount: string;
  payReference: string;
}

export function PurchaseForm({
  purchase,
  partners,
  partnersLoading,
  partnersError,
  saving,
  error,
  onCancel,
  onSave,
}: {
  purchase: PurchaseResponse | null;
  partners: PartnerResponse[];
  partnersLoading: boolean;
  partnersError?: string;
  saving: boolean;
  error?: string;
  onCancel: () => void;
  onSave: (values: CreatePurchaseRequest) => void;
}) {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const currentPrice = useCurrentCocoaPrice();

  // "Paid now" is for new purchases only, by someone allowed to record payments.
  const canPayNow = !purchase && hasPermission(PermissionKey.PAYMENT_CREATE);
  const till = useOpenCashSession(canPayNow && hasPermission(PermissionKey.CASH_SESSION_READ));

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting, dirtyFields },
  } = useForm<PurchaseFormValues>({
    defaultValues: {
      partnerId: purchase?.farmerId ?? purchase?.buyerId ?? "",
      purchaseDate: (purchase?.purchaseDate ? localDateKey(purchase.purchaseDate) : localToday()),
      grossWeight: purchase ? String(purchase.grossWeight) : "",
      netWeight: purchase ? String(purchase.netWeight) : "",
      payNow: canPayNow,
      payMethod: PaymentMethod.CASH,
      payAmount: "",
      payReference: "",
    },
  });

  useEffect(() => {
    reset({
      partnerId: purchase?.farmerId ?? purchase?.buyerId ?? "",
      purchaseDate: (purchase?.purchaseDate ? localDateKey(purchase.purchaseDate) : localToday()),
      grossWeight: purchase ? String(purchase.grossWeight) : "",
      netWeight: purchase ? String(purchase.netWeight) : "",
      payNow: canPayNow,
      payMethod: PaymentMethod.CASH,
      payAmount: "",
      payReference: "",
    });
  }, [purchase, reset, canPayNow]);

  const partnerId = useWatch({ control, name: "partnerId" });
  const purchaseDate = useWatch({ control, name: "purchaseDate" });
  const grossWeight = useWatch({ control, name: "grossWeight" });
  const netWeight = useWatch({ control, name: "netWeight" });
  const payNow = useWatch({ control, name: "payNow" });
  const payMethod = useWatch({ control, name: "payMethod" });
  const payAmount = useWatch({ control, name: "payAmount" });
  const payReference = useWatch({ control, name: "payReference" });
  const payingCash = canPayNow && payNow && payMethod === PaymentMethod.CASH;

  const grossWeightValue = Number(grossWeight);
  const netWeightValue = Number(netWeight);
  const previewUnitPrice = purchase?.unitPrice ?? currentPrice.data?.pricePerKg;

  const selectedPartner = partners.find((partner) => partner.id === partnerId);
  const editablePartnerFallback =
    purchase &&
    partnerId &&
    !selectedPartner &&
    (purchase.farmerId || purchase.buyerId)
      ? {
          id: partnerId,
          name: partnerId,
          type: purchase.farmerId ? PartnerType.FARMER : PartnerType.BUYER,
        }
      : undefined;
  const availablePartners = partners.filter(
    (partner) =>
      (partner.type === PartnerType.FARMER ||
        partner.type === PartnerType.BUYER) &&
      (partner.active ||
        partner.id === purchase?.farmerId ||
        partner.id === purchase?.buyerId),
  );
  const selectedPartnerType =
    selectedPartner?.type ?? editablePartnerFallback?.type;

  // A new purchase from a buyer first repays what they owe on prefinances,
  // so the preview has to know their open advances.
  const isNewBuyerPurchase = !purchase && selectedPartnerType === PartnerType.BUYER;
  const buyerPrefinances = usePrefinances(
    { page: 1, size: LOOKUP_PAGE_SIZE },
    partnerId,
    isNewBuyerPurchase && Boolean(partnerId),
  );
  const settlement =
    isNewBuyerPurchase &&
    buyerPrefinances.data &&
    Number.isFinite(netWeightValue) &&
    netWeightValue > 0
      ? previewPrefinanceSettlement(buyerPrefinances.data.content, netWeightValue)
      : undefined;
  const hasSettlement = Boolean(settlement && settlement.settledValue > 0);

  // What is left to pay once any prefinance repayment is taken off.
  const amountToPay = settlement
    ? settlement.toPay
    : previewUnitPrice !== undefined && Number.isFinite(netWeightValue) && netWeightValue > 0
      ? Math.round(previewUnitPrice * netWeightValue * 100) / 100
      : 0;
  const showPaidNow = canPayNow && amountToPay > 0;
  const payNowAmount = dirtyFields.payAmount
    ? payAmount
    : amountToPay > 0
      ? String(amountToPay)
      : "";
  const payNowValue = parseAmount(payNowAmount);
  const payNowError = !showPaidNow || !payNow
    ? undefined
    : !(payNowValue > 0)
      ? t("purchases.paidNow.amountRequired")
      : payNowValue > amountToPay + 0.005
        ? t("purchases.paidNow.exceedsToPay")
        : payingCash && till.openSession && payNowValue > till.openSession.availableBalance
          ? t("purchases.paidNow.exceedsTill")
          : undefined;
  const payNowBlocked =
    showPaidNow && payNow && (Boolean(payNowError) || (payingCash && !till.openSession));

  const canSave =
    Boolean(selectedPartnerType) &&
    Boolean(purchaseDate) &&
    Number.isFinite(grossWeightValue) &&
    grossWeightValue > 0 &&
    Number.isFinite(netWeightValue) &&
    netWeightValue > 0 &&
    netWeightValue <= grossWeightValue &&
    (Boolean(purchase) || Boolean(currentPrice.data)) &&
    !payNowBlocked;

  function onSubmit(values: PurchaseFormValues) {
    const selectedPartner = partners.find(
      (partner) => partner.id === values.partnerId,
    );

    const selectedPartnerType =
      selectedPartner?.type ?? editablePartnerFallback?.type;

    if (!selectedPartnerType) return;

    onSave({
      ...(selectedPartnerType === PartnerType.FARMER
        ? { farmerId: values.partnerId }
        : { buyerId: values.partnerId }),
      purchaseDate: dateToInstant(values.purchaseDate),
      grossWeight: Number(values.grossWeight),
      netWeight: Number(values.netWeight),
      ...(showPaidNow && payNow && {
        payment: {
          amount: payNowValue,
          method: payMethod,
          paymentDate: dateToInstant(values.purchaseDate),
          ...(payMethod !== PaymentMethod.CASH &&
            payReference.trim() && { reference: payReference.trim() }),
          ...(payMethod === PaymentMethod.CASH &&
            till.openSession && { cashSessionId: till.openSession.id }),
        },
      }),
    });
  }

  // While saving: loader on the submit button, Cancel disabled, dialog locked.
  const pending = saving || isSubmitting;
  useDialogBusy(pending);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-2">
      <Field label={t("purchases.partner")} htmlFor="purchase-partner" required>
        <Controller
          name="partnerId"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={partnersLoading || Boolean(partnersError)}
            >
              <SelectTrigger
                id="purchase-partner"
                className="w-full"
                aria-invalid={Boolean(errors.partnerId)}
              >
                <SelectValue
                  placeholder={
                    partnersLoading
                      ? t("purchases.loadingPartners")
                      : t("purchases.selectPartnerPlaceholder")
                  }
                />
              </SelectTrigger>

              <SelectContent>
                {editablePartnerFallback && (
                  <SelectItem value={editablePartnerFallback.id}>
                    {editablePartnerFallback.name}
                  </SelectItem>
                )}

                {availablePartners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.name} (
                    {partner.type === PartnerType.FARMER
                      ? t("purchases.farmer")
                      : t("purchases.buyer")}
                    )
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      {partnersError && (
        <p role="alert" className="text-sm text-destructive">
          {partnersError}
        </p>
      )}

      {!partnersLoading && !partnersError && availablePartners.length === 0 && (
        <p role="alert" className="text-sm text-destructive">
          {t("purchases.noPartners")}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-x-3">

        <Field label={t("purchases.grossWeight")} htmlFor="gross-weight" required>
          <InputGroup>
            <InputGroupAddon align="inline-end">
              <Scale className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="gross-weight"
              type="text"
              inputMode="decimal"
              placeholder={t("purchases.grossWeightPlaceholder")}
              {...register("grossWeight", {
                required: true,
                validate: (value) =>
                  (Number.isFinite(Number(value)) && Number(value) > 0) ||
                  "Gross weight must be positive",
              })}
              aria-invalid={Boolean(errors.grossWeight)}
            />
          </InputGroup>
        </Field>

        <Field
          label={t("purchases.netWeight")}
          htmlFor="net-weight"
          required
          hint={t("purchases.netWeightHint")}
        >
          <InputGroup>
            <InputGroupAddon align="inline-end">
              <Scale className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="net-weight"
              type="text"
              inputMode="decimal"
              placeholder={t("purchases.netWeightPlaceholder")}
              {...register("netWeight", {
                required: true,
                validate: (value) =>
                  (Number.isFinite(Number(value)) && Number(value) > 0) ||
                  "Net weight must be positive",
              })}
              aria-invalid={Boolean(errors.netWeight)}
            />
          </InputGroup>
        </Field>
      </div>
      
      <Field label={t("purchases.columnDate")} htmlFor="purchase-date" required>
        <Controller
          name="purchaseDate"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <DatePicker
              id="purchase-date"
              value={field.value}
              onValueChange={field.onChange}
              placeholder={t("purchases.datePlaceholder", {
                defaultValue: "Select date",
              })}
            />
          )}
        />
      </Field>
      <div className="mb-2 rounded-lg bg-cocoa-50 p-4">
        <div className="flex items-center justify-between text-sm">
          {/* A buyer with an open advance is bought at the price agreed on it. */}
          <span className="text-cocoa-500">
            {t(settlement ? "purchases.agreedPrice" : "purchases.todaysPrice")}
          </span>
          <span className="font-medium text-cocoa-900">
            {settlement
              ? `${formatMoney(settlement.unitPrice)}/kg`
              : currentPrice.isPending && !purchase
                ? "…"
                : previewUnitPrice === undefined
                  ? "—"
                  : `${formatMoney(previewUnitPrice)}/kg`}
          </span>
        </div>
        {settlement && hasSettlement && (
          <>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-cocoa-500">{t("purchases.purchaseValue")}</span>
              <span className="font-medium text-cocoa-900">{formatMoney(settlement.total)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-cocoa-500">
                {t("purchases.prefinanceRepaid", {
                  weight: formatWeight(settlement.settledKg),
                })}
              </span>
              <span className="font-medium text-pod-700">
                −{formatMoney(settlement.settledValue)}
              </span>
            </div>
          </>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-cocoa-100 pt-2">
          <span className="font-bold text-cocoa-700">
            {t("purchases.amountToPay")}
          </span>
          <span className="text-lg font-semibold text-cocoa-900">
            {settlement
              ? formatMoney(settlement.toPay)
              : previewUnitPrice === undefined || !Number.isFinite(netWeightValue)
                ? "—"
                : formatMoney(previewUnitPrice * netWeightValue)}
          </span>
        </div>
        {hasSettlement && (
          <p className="mt-2 text-xs text-cocoa-500">{t("purchases.prefinanceRepaidNote")}</p>
        )}
        {currentPrice.isError && !purchase && (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {currentPrice.error.message}
          </p>
        )}
        <p className="mt-2 text-xs text-cocoa-500">
          {t("purchases.priceLockedNote")}
        </p>
      </div>

      {showPaidNow && (
        <PaidNowSection
          control={control}
          register={register}
          amountToPay={amountToPay}
          effectiveAmount={payNowAmount}
          till={till.openSession}
          tillLoading={till.isPending}
          error={payNowError}
        />
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          {t("common.cancel")}
        </Button>
        <SubmitButton pending={pending} disabled={!isValid || !canSave}>
          {purchase
            ? t("common.save")
            : showPaidNow && payNow
              ? t("purchases.paidNow.submit")
              : t("purchases.recordPurchase")}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}
