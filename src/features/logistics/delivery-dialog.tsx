import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CreateDeliveryRequest, PartnerResponse } from "@/interfaces";
import { DeliveryForm } from "./delivery-form";

export interface DeliveryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partners: PartnerResponse[];
  partnersLoading: boolean;
  partnersError?: string;
  saving: boolean;
  onSave: (values: CreateDeliveryRequest) => Promise<void>;
}

export function DeliveryFormDialog({
  open,
  onOpenChange,
  ...bodyProps
}: DeliveryFormDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] hide-scrollbar overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("logistics.form.title")}</DialogTitle>
          <DialogDescription>{t("logistics.form.description")}</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so every opening starts with a clean form
            and no leftover error from the previous attempt. */}
        {open && (
          <DeliveryDialogBody
            {...bodyProps}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeliveryDialogBody({
  partners,
  partnersLoading,
  partnersError,
  saving,
  onSave,
  onClose,
}: Omit<DeliveryFormDialogProps, "open" | "onOpenChange"> & {
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [error, setError] = useState<string>();

  async function save(values: CreateDeliveryRequest) {
    setError(undefined);
    try {
      await onSave(values);
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : t("errors.unexpectedDescription"),
      );
    }
  }

  return (
    <DeliveryForm
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
