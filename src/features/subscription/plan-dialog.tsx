import { useTranslation } from "react-i18next";
import { Pencil } from "lucide-react";
import type { PlanResponse } from "@/api/plans";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlanDetails } from "@/features/subscription/plan-details";
import { PlanForm } from "@/features/subscription/plan-form";
import { localizePlan } from "@/features/subscription/localize-plan";

type PlanMode = "create" | "view" | "edit";

export function PlanDialog({
  open,
  mode,
  plan,
  canEdit,
  onOpenChange,
  onEdit,
}: {
  open: boolean;
  mode: PlanMode;
  plan?: PlanResponse;
  canEdit?: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}) {
  const { t, i18n } = useTranslation();
  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl hide-scrollbar">
        <DialogHeader>
          <DialogTitle>
            {plan && mode !== "create"
              ? t("plans.dialog.viewTitle", { name: localizePlan(plan, i18n.language).name })
              : t("plans.dialog.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("plans.dialog.createDescription")
              : t("plans.dialog.viewDescription")}
          </DialogDescription>
        </DialogHeader>

        {mode === "view" && plan ? (
          <>
            <PlanDetails plan={plan} />
            <DialogFooter>
              {canEdit && (
                <Button type="button" onClick={onEdit}>
                  <Pencil className="size-4" aria-hidden="true" />
                  {t("common.actions.edit")}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={close}>
                {t("common.close")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <PlanForm plan={mode === "edit" ? plan : undefined} onClose={close} />
        )}
      </DialogContent>
    </Dialog>
  );
}
