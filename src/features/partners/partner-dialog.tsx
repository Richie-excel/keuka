import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PartnerType } from "@/enums";
import type { PartnerResponse } from "@/interfaces";
import { PartnerForm, type PartnerFormValues } from "./partner-form";
import { ALL_PARTNERS_SECTION, sectionFor } from "./partner-types";

export interface PartnerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The partner being edited, or `null` to create one. */
  partner: PartnerResponse | null;
  /** Fixed type for a new partner; omitted on the "all partners" view. */
  type?: PartnerType;
  saving: boolean;
  onSave: (values: PartnerFormValues) => Promise<void>;
}

export function PartnerFormDialog({
  open,
  onOpenChange,
  partner,
  type,
  saving,
  onSave,
}: PartnerFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(partner);
  const effectiveType = partner?.type ?? type;
  const section = effectiveType ? sectionFor(effectiveType) : ALL_PARTNERS_SECTION;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] hide-scrollbar overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t(`partners.sections.${section.key}.${isEdit ? "editTitle" : "createTitle"}`)}
          </DialogTitle>
          <DialogDescription>
            {t(`partners.sections.${section.key}.formDescription`)}
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts clean. */}
        {open && (
          <PartnerDialogBody
            key={partner?.id ?? "new"}
            partner={partner}
            type={type}
            saving={saving}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PartnerDialogBody({
  partner,
  type,
  saving,
  onSave,
  onClose,
}: Omit<PartnerFormDialogProps, "open" | "onOpenChange"> & { onClose: () => void }) {
  const { t } = useTranslation();
  const [error, setError] = useState<string>();

  async function save(values: PartnerFormValues) {
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
    <>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <PartnerForm
        partner={partner}
        type={type}
        saving={saving}
        onCancel={onClose}
        onSave={save}
      />
    </>
  );
}
