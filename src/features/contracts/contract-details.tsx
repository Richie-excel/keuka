// features/contracts/contract-details-dialog.tsx
import { useTranslation } from "react-i18next";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatMoney, formatWeight } from "@/lib/utils";
import { CONTRACT_STATUS } from "@/shared/status";
import { contractsStore } from "@/features/contracts/contracts-store";
import { useAuth } from "@/shared/hooks/useAuth";

interface ContractDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId?: string;
  /** Closes details and opens the edit dialog */
  onEdit?: (contractId: string) => void;
}

export function ContractDetails({
  open,
  onOpenChange,
  contractId,
  onEdit,
}: ContractDetailsDialogProps) {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const contract = contractsStore.useById(contractId ?? "");

  if (!contract) {
    if (open && contractId) {
      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("common.notFound")}</DialogTitle>
              <DialogDescription>
                {t("contracts.notFoundDescription")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>
                {t("common.close")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }
    return null;
  }

  const canEdit = hasPermission("contracts.manage");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg font-semibold">
            {contract.partnerName}
          </DialogTitle>
          <DialogDescription>
            {t("contracts.detailsDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="divide-y divide-cocoa-100">
          <div className="flex justify-between py-3 text-sm">
            <span className="text-cocoa-500">{t("contracts.columnStatus")}</span>
            <StatusBadge
              label={t(CONTRACT_STATUS[contract.status].labelKey)}
              tone={CONTRACT_STATUS[contract.status].tone}
            />
          </div>
          <div className="flex justify-between py-3 text-sm">
            <span className="text-cocoa-500">{t("contracts.columnQuantity")}</span>
            <span className="font-medium text-cocoa-900">
              {formatWeight(contract.contractedQuantityKg)}
            </span>
          </div>
          <div className="flex justify-between py-3 text-sm">
            <span className="text-cocoa-500">{t("contracts.columnUnitPrice")}</span>
            <span className="font-medium text-cocoa-900">
              {formatMoney(contract.unitPrice)}/kg
            </span>
          </div>
          <div className="flex justify-between py-3 text-sm">
            <span className="text-cocoa-500">{t("contracts.startDate")}</span>
            <span className="font-medium text-cocoa-900">{contract.startDate}</span>
          </div>
          <div className="flex justify-between py-3 text-sm">
            <span className="text-cocoa-500">{t("contracts.columnEnds")}</span>
            <span className="font-medium text-cocoa-900">{contract.endDate}</span>
          </div>
        </div>

        <DialogFooter className="space-x-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
          {canEdit && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onEdit?.(contract.id);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {t("contracts.editTitle")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}