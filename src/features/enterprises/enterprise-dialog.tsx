import { useTranslation } from "react-i18next";
import type {
  EnterpriseResponse,
} from "@/api/enterprises";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Detail } from "@/features/enterprises/detail-list";
import {
  SubscriptionStatusBadge,
  TenantStatusBadge,
} from "@/features/subscription/subscription-status-badge";
import type { SubscriptionStatus } from "@/enums";
import EnterpriseForm from "./enterprise-form";
import {
  useChangeEnterprisePlan,
  useSetEnterpriseActive,
} from "@/shared/hooks/use-enterprises";
import { usePlans } from "@/shared/hooks/use-plans";
import { useConfirm } from "@/shared/hooks/use-confirm";
import { localizePlan } from "@/features/subscription/localize-plan";
import { formatDate, formatMoney } from "@/lib/utils";

/** Enough for the whole catalogue: the operator picks from every active plan. */
const PLAN_PICKER_SIZE = 100;

type EnterpriseMode = "create" | "view" | "edit";



interface EnterpriseDialogProps {
  open: boolean;
  mode: EnterpriseMode;
  enterprise?: EnterpriseResponse;
  canEdit?: boolean;
  canManageStatus?: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

export function EnterpriseDialog({
  open,
  mode,
  enterprise,
  canEdit,
  canManageStatus,
  onOpenChange,
  onEdit,
}: EnterpriseDialogProps) {
  const { t } = useTranslation();
  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t(`dashboard.enterprise.${mode}Title`)}</DialogTitle>
          <DialogDescription>
            {t(`dashboard.enterprise.${mode}Description`)}
          </DialogDescription>
        </DialogHeader>
        {mode === "view" && enterprise ? (
          <EnterpriseView
            enterprise={enterprise}
            canEdit={canEdit}
            canManageStatus={canManageStatus}
            onEdit={onEdit}
            onClose={close}
          />
        ) : (
          <EnterpriseForm
            isCreate={mode === "create"}
            enterprise={enterprise}
            onClose={close}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── View ────────────────────────────────────────────────────────── */

function EnterpriseView({
  enterprise,
  canEdit,
  canManageStatus,
  onEdit,
  onClose,
}: {
  enterprise: EnterpriseResponse;
  canEdit?: boolean;
  canManageStatus?: boolean;
  onEdit?: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const setActive = useSetEnterpriseActive();
  // A company whose trial or paid period ran out is still ACTIVE as a tenant, but
  // has no access: it needs a new period (activate), not a suspension.
  const running = enterprise.tenantStatus === "ACTIVE" && enterprise.operationalAccess;
  const statusLabel = running
    ? t("dashboard.enterprise.suspend")
    : enterprise.tenantStatus === "ACTIVE"
      ? t("dashboard.enterprise.renew")
      : t("dashboard.enterprise.activate");

  return (
    <>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Detail
          label={t("dashboard.enterprise.uniqueId")}
          value={enterprise.uniqueId ?? "-"}
        />
        <Detail
          label={t("dashboard.enterprise.companyCode")}
          value={enterprise.companyCode}
        />
        <Detail
          label={t("dashboard.enterprise.displayName")}
          value={enterprise.displayName}
        />
        <Detail
          label={t("dashboard.enterprise.tenantStatus")}
          value={<TenantStatusBadge status={enterprise.tenantStatus} />}
        />
        <Detail
          label={t("dashboard.enterprise.subscriptionStatus")}
          value={
            <SubscriptionStatusBadge
              status={enterprise.subscriptionStatus as SubscriptionStatus}
            />
          }
        />
        <Detail
          label={t("dashboard.enterprise.plan")}
          value={enterprise.planCode}
        />
        <Detail
          label={t("dashboard.enterprise.periodEnd")}
          value={enterprise.currentPeriodEnd ? formatDate(enterprise.currentPeriodEnd) : "—"}
        />
        <Detail
          label={t("dashboard.enterprise.access")}
          value={
            enterprise.operationalAccess ? t("common.yes") : t("common.no")
          }
        />
      </dl>
      {canManageStatus && enterprise.tenantStatus !== "CLOSED" && (
        <PlanChanger enterprise={enterprise} onChanged={onClose} />
      )}
      {setActive.error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {setActive.error.message}
        </p>
      )}
      <DialogFooter>
        {canManageStatus && enterprise.tenantStatus !== "CLOSED" && (
          <Button
            type="button"
            variant="outline"
            disabled={setActive.isPending}
            onClick={() =>
              setActive.mutate(
                {
                  companyCode: enterprise.companyCode,
                  active: !running,
                },
                { onSuccess: onClose },
              )
            }
          >
            {statusLabel}
          </Button>
        )}
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

/* ── Plan ────────────────────────────────────────────────────────── */

/**
 * Puts the company on another plan, once it has paid for it: the new period
 * starts today and ends where the plan's billing period says.
 */
function PlanChanger({
  enterprise,
  onChanged,
}: {
  enterprise: EnterpriseResponse;
  onChanged: () => void;
}) {
  const { t, i18n } = useTranslation();
  const plans = usePlans({ page: 1, size: PLAN_PICKER_SIZE });
  const changePlan = useChangeEnterprisePlan();
  const { ask, dialogProps } = useConfirm();
  const [planCode, setPlanCode] = useState("");

  const options = (plans.data?.content ?? [])
    .filter((plan) => plan.active)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((plan) => localizePlan(plan, i18n.language));
  const chosen = options.find((plan) => plan.code === planCode);

  function confirmChange() {
    if (!chosen) return;
    ask({
      title: t("dashboard.enterprise.changePlanTitle"),
      description: t("dashboard.enterprise.changePlanDescription", {
        company: enterprise.displayName,
        plan: chosen.name,
      }),
      confirmLabel: t("dashboard.enterprise.changePlan"),
      icon: ArrowRightLeft,
      onConfirm: async () => {
        await changePlan.mutateAsync({ companyCode: enterprise.companyCode, planCode: chosen.code });
        onChanged();
      },
    });
  }

  return (
    <div className="mt-4 rounded-lg border border-cocoa-100 p-3">
      <label htmlFor="enterprise-plan" className="text-sm font-medium text-cocoa-900">
        {t("dashboard.enterprise.changePlan")}
      </label>
      <p className="mb-2 text-xs text-cocoa-500">{t("dashboard.enterprise.changePlanHint")}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={planCode} onValueChange={setPlanCode} disabled={plans.isPending}>
          <SelectTrigger id="enterprise-plan" className="w-full sm:flex-1">
            <SelectValue placeholder={t("dashboard.enterprise.choosePlan")} />
          </SelectTrigger>
          <SelectContent>
            {options.map((plan) => (
              <SelectItem key={plan.code} value={plan.code} disabled={plan.code === enterprise.planCode}>
                {plan.name} · {formatMoney(plan.priceAmount)} {plan.currency}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          disabled={!chosen || changePlan.isPending}
          onClick={confirmChange}
        >
          <ArrowRightLeft />
          {t("dashboard.enterprise.changePlan")}
        </Button>
      </div>
      {changePlan.error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {changePlan.error.message}
        </p>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
