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
import { Detail } from "@/features/enterprises/detail-list";
import EnterpriseForm from "./enterprise-form";
import { useSetEnterpriseActive } from "@/shared/hooks/use-enterprises";

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
          value={enterprise.tenantStatus}
        />
        <Detail
          label={t("dashboard.enterprise.subscriptionStatus")}
          value={enterprise.subscriptionStatus}
        />
        <Detail
          label={t("dashboard.enterprise.plan")}
          value={enterprise.planCode}
        />
        <Detail
          label={t("dashboard.enterprise.access")}
          value={
            enterprise.operationalAccess ? t("common.yes") : t("common.no")
          }
        />
      </dl>
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
                  active: enterprise.tenantStatus !== "ACTIVE",
                },
                { onSuccess: onClose },
              )
            }
          >
            {enterprise.tenantStatus === "ACTIVE"
              ? t("dashboard.enterprise.suspend")
              : t("dashboard.enterprise.activate")}
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

