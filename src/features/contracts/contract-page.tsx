import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ContractForm } from "./contract-form";

interface ContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId?: string;
  onSaved?: (id: string) => void;
}

export function ContractFormDialog({
  open,
  onOpenChange,
  contractId,
  onSaved,
}: ContractFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(contractId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center font-semibold text-lg">
            {isEdit ? t("contracts.editTitle") : t("contracts.newContract")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("contracts.formDescription")}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ContractForm
            key={contractId ?? "new"}
            contractId={contractId}
            onCancel={() => onOpenChange(false)}
            onSaved={(id) => {
              onOpenChange(false);
              onSaved?.(id);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
