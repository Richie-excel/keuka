import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  CreatePurchaseRequest,
  PartnerResponse,
  PurchaseResponse,
} from "@/interfaces";
import { PurchaseForm } from "./purchase-form";

export interface PurchaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: PurchaseResponse | null;
  partners: PartnerResponse[];
  partnersLoading: boolean;
  partnersError?: string;
  saving: boolean;
  onSave: (values: CreatePurchaseRequest) => Promise<void>;
}

export function PurchaseFormDialog({
  open,
  onOpenChange,
  ...bodyProps
}: PurchaseFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(bodyProps.purchase);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t(isEdit ? "purchases.editPurchaseTitle" : "purchases.newPurchaseTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("purchases.newPurchaseDescription")}
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open (and per purchase), so every opening starts
            with a clean form and no leftover error from the previous attempt. */}
        {open && (
          <PurchaseDialogBody
            key={bodyProps.purchase?.id ?? "new"}
            {...bodyProps}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PurchaseDialogBody({
  purchase,
  partners,
  partnersLoading,
  partnersError,
  saving,
  onSave,
  onClose,
}: Omit<PurchaseFormDialogProps, "open" | "onOpenChange"> & { onClose: () => void }) {
  const { t } = useTranslation();
  const [error, setError] = useState<string>();

  async function save(values: CreatePurchaseRequest) {
    setError(undefined);
    try {
      await onSave(values);
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : t("errors.unexpectedDescription"),
      );
    }
  }

  return (
    <PurchaseForm
      purchase={purchase}
      partners={partners}
      partnersLoading={partnersLoading}
      partnersError={partnersError}
      saving={saving}
      error={error}
      onSave={save}
      onCancel={onClose}
    />
  );
}
