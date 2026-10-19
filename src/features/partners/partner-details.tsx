import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowUpRight, Pencil } from "lucide-react";
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
import { formatDateTime } from "@/lib/utils";
import { PartnerKind, PartnerType } from "@/enums";
import type { PartnerResponse } from "@/interfaces";
import { buyerDetailsPath } from "./partner-types";

/**
 * A partner's record, read-only. Buyers additionally link to their own page,
 * where prefinancing is managed.
 */
export function PartnerDetailsDialog({
  partner,
  canEdit,
  onEdit,
  onOpenChange,
}: {
  partner: PartnerResponse | null;
  canEdit: boolean;
  onEdit: (partner: PartnerResponse) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const isBuyer = partner?.type === PartnerType.BUYER;
  const isCompany = partner?.kind === PartnerKind.COMPANY;

  return (
    <Dialog open={Boolean(partner)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] hide-scrollbar overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{partner?.name}</DialogTitle>
          <DialogDescription>
            {partner &&
              `${t(`partners.types.${partner.type}`, partner.type)} · ${t(`partners.kinds.${partner.kind}`, partner.kind)}`}
          </DialogDescription>
        </DialogHeader>

        {partner && (
          <>
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                label={t(partner.active ? "partners.status.active" : "partners.status.inactive")}
                tone={partner.active ? "positive" : "neutral"}
              />
              {isBuyer && (
                <StatusBadge
                  label={t(partner.trusted ? "partners.trusted" : "partners.notTrusted")}
                  tone={partner.trusted ? "positive" : "pending"}
                />
              )}
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Detail label={t("partners.fields.contactPerson")} value={partner.contactPerson} />
              <Detail label={t("partners.fields.phone")} value={partner.phone} />
              <Detail
                label={t(isCompany ? "partners.fields.location" : "partners.fields.address")}
                value={partner.address}
              />
              {isCompany ? (
                <>
                  <Detail label={t("partners.fields.registrationNumber")} value={partner.registrationNumber} />
                  <Detail label={t("partners.fields.taxNumber")} value={partner.taxNumber} />
                </>
              ) : (
                <Detail label={t("partners.fields.idNumber")} value={partner.idCardNumber} />
              )}
              <Detail label={t("partners.fields.createdAt")} value={formatDateTime(partner.createdAt)} />
              <Detail label={t("partners.fields.updatedAt")} value={formatDateTime(partner.updatedAt)} />
            </dl>

            {partner.notes && (
              <div className="text-sm">
                <p className="text-cocoa-500">{t("partners.fields.notes")}</p>
                <p className="mt-0.5 whitespace-pre-line text-cocoa-900">{partner.notes}</p>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          {partner && isBuyer && (
            <Button asChild variant="outline">
              <Link to={buyerDetailsPath(partner.id)}>
                {t("partners.openPrefinancing")}
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          )}
          {partner && canEdit && (
            <Button type="button" onClick={() => onEdit(partner)}>
              <Pencil aria-hidden="true" />
              {t("common.actions.edit")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-cocoa-500">{label}</dt>
      <dd className="mt-0.5 font-medium break-words text-cocoa-900">{value || "—"}</dd>
    </div>
  );
}
