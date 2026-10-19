import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateCompanyContact } from "@/shared/hooks/use-subscription";
import type { SubscriptionResponse } from "@/api/subscription";
import { CompanyContactForm } from "./company-contact-form";

export function CompanyContactDialog({
  open,
  onOpenChange,
  company,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: SubscriptionResponse;
}) {
  const { t } = useTranslation();
  const updateContact = useUpdateCompanyContact();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("enterprises.contact.editTitle")}</DialogTitle>
          <DialogDescription>{t("enterprises.contact.editDescription")}</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts from the saved values. */}
        {open && (
          <CompanyContactForm
            company={company}
            saving={updateContact.isPending}
            onSave={(input) => updateContact.mutateAsync(input)}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
