/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CreatePrefinanceRequest } from "@/interfaces";
import { PrefinanceForm } from "./prefinance-form";

export function PrefinanceDialog({
  open,
  onOpenChange,
  buyerId,
  buyerName,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buyerId: string;
  buyerName: string;
  saving: boolean;
  onSave: (request: CreatePrefinanceRequest) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (open) setError(undefined);
  }, [open]);

  async function save(request: CreatePrefinanceRequest) {
    setError(undefined);
    try {
      await onSave(request);
      onOpenChange(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : t("errors.unexpectedDescription"),
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("buyers.addPrefinance")}</DialogTitle>
          <DialogDescription>
            {t("buyers.prefinanceDescription", { buyer: buyerName })}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <PrefinanceForm
              key={buyerId}
              buyerId={buyerId}
              saving={saving}
              onCancel={() => onOpenChange(false)}
              onSave={save}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
