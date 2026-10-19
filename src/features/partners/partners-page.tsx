import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { PlusCircle, RotateCcw } from "lucide-react";
import { DataPagination } from "@/components/pagination";
import { DataTable, type Column } from "@/components/data-table";
import { TableRowActions } from "@/components/table-row-actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageSkeleton } from "@/components/page-skeleton";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/layout/page-header";
import { useAuth } from "@/shared/hooks/useAuth";
import {
  useCreatePartner,
  usePartners,
  useUpdatePartner,
} from "@/shared/hooks/use-partners";
import { PAGE_SIZE } from "@/constants";
import { PartnerKind, PartnerType, PermissionKey } from "@/enums";
import type { PartnerResponse } from "@/interfaces";
import { PartnerFormDialog } from "./partner-dialog";
import { PartnerDetailsDialog } from "./partner-details";
import type { PartnerFormValues } from "./partner-form";
import { buyerDetailsPath, type PartnerSection } from "./partner-types";

/**
 * The partner register for one section (buyers, farmers, commercial…) or for
 * all of them.
 *
 * BACKEND BEHAVIOUR TO KNOW: `GET /partners?type=X` returns ACTIVE partners
 * only, while `GET /partners` (no type) returns every partner, deactivated ones
 * included. So a deactivated partner leaves its section's list and can be
 * found — and reactivated — under "All partners".
 */
export function PartnersPage({ section }: { section: PartnerSection }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerResponse | null>(null);
  const [viewing, setViewing] = useState<PartnerResponse | null>(null);
  const [toggling, setToggling] = useState<PartnerResponse | null>(null);
  const [toggleError, setToggleError] = useState<string>();

  const canCreate = hasPermission(PermissionKey.PARTNER_CREATE);
  const canUpdate = hasPermission(PermissionKey.PARTNER_UPDATE);
  const isAll = !section.type;
  const isBuyers = section.type === PartnerType.BUYER;
  const keyPrefix = `partners.sections.${section.key}`;

  const query = usePartners(section.type, { page, size: PAGE_SIZE });
  const createPartner = useCreatePartner();
  const updatePartner = useUpdatePartner();
  const partners = query.data?.content ?? [];

  /** Buyers keep their own page (prefinancing); everyone else opens a dialog. */
  function openPartner(partner: PartnerResponse) {
    if (partner.type === PartnerType.BUYER) navigate(buyerDetailsPath(partner.id));
    else setViewing(partner);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(partner: PartnerResponse) {
    setViewing(null);
    setEditing(partner);
    setFormOpen(true);
  }

  async function savePartner(values: PartnerFormValues) {
    if (editing) {
      // `values.type` is always the partner's own type: PartnerForm offers no
      // way to change it on an edit.
      await updatePartner.mutateAsync({ id: editing.id, patch: values });
    } else {
      await createPartner.submitAsync(values);
      setPage(1);
    }
  }

  async function confirmToggle() {
    if (!toggling) return;
    setToggleError(undefined);
    try {
      await updatePartner.mutateAsync({
        id: toggling.id,
        patch: { active: !toggling.active },
      });
      setToggling(null);
      // Deactivating can empty the last page of a typed list.
      if (toggling.active && !isAll && partners.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (cause) {
      setToggleError(
        cause instanceof Error ? cause.message : t("errors.unexpectedDescription"),
      );
      throw cause;
    }
  }

  const columns: Column<PartnerResponse>[] = [
    {
      header: t("partners.fields.name"),
      cell: (partner) => (
        <div className="min-w-0">
          <p className="font-medium text-cocoa-900">{partner.name}</p>
          <p className="text-xs text-cocoa-500">
            {t(`partners.kinds.${partner.kind}`, partner.kind)}
          </p>
        </div>
      ),
    },
    ...(isAll
      ? [
          {
            header: t("partners.fields.type"),
            cell: (partner: PartnerResponse) =>
              t(`partners.types.${partner.type}`, partner.type),
          },
        ]
      : []),
    {
      header: t("partners.fields.phone"),
      cell: (partner) => partner.phone || "—",
    },
    {
      // An individual's ID card, or a company's RCCM when it was shared.
      header: t("partners.fields.identifier"),
      cell: (partner) =>
        (partner.kind === PartnerKind.COMPANY
          ? partner.registrationNumber
          : partner.idCardNumber) || "—",
      hideOnMobile: true,
    },
    {
      header: t("partners.fields.contactPerson"),
      cell: (partner) => partner.contactPerson || "—",
      hideOnMobile: true,
    },
    ...(isBuyers
      ? [
          {
            header: t("buyers.isTrusted"),
            cell: (partner: PartnerResponse) =>
              t(partner.trusted ? "common.yes" : "common.no"),
            hideOnMobile: true,
          },
        ]
      : []),
    {
      header: t("partners.fields.status"),
      cell: (partner) => (
        <StatusBadge
          label={t(partner.active ? "partners.status.active" : "partners.status.inactive")}
          tone={partner.active ? "positive" : "neutral"}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageSkeleton loading={query.isPending}>
        <div className="space-y-6">
          <PageHeader
            title={t(`${keyPrefix}.title`)}
            icon={section.icon}
            description={t(`${keyPrefix}.description`)}
            action={
              canCreate ? (
                <Button type="button" onClick={openCreate}>
                  <PlusCircle aria-hidden="true" />
                  {t(`${keyPrefix}.add`)}
                </Button>
              ) : undefined
            }
          />

          {query.isError ? (
            <p role="alert" className="py-4 text-sm text-destructive">
              {query.error.message}
            </p>
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={partners}
                rowKey={(partner) => partner.id}
                emptyTitle={t(`${keyPrefix}.emptyTitle`)}
                emptyDescription={t(`${keyPrefix}.emptyDescription`)}
                onRowClick={openPartner}
                actionsLabel={t("common.actions.row")}
                rowActions={(partner) => (
                  <TableRowActions
                    actionsLabel={t("common.actions.row")}
                    labels={{
                      view: t("common.actions.view"),
                      edit: t("common.actions.edit"),
                      delete: t("partners.deactivate"),
                    }}
                    canView
                    onView={() => openPartner(partner)}
                    canEdit={canUpdate}
                    onEdit={() => openEdit(partner)}
                    canDelete={canUpdate && partner.active}
                    onDelete={() => {
                      setToggleError(undefined);
                      setToggling(partner);
                    }}
                    extraActions={[
                      {
                        id: "reactivate",
                        label: t("partners.reactivate"),
                        icon: RotateCcw,
                        visible: canUpdate && !partner.active,
                        onClick: () => {
                          setToggleError(undefined);
                          setToggling(partner);
                        },
                      },
                    ]}
                  />
                )}
              />
              {query.data && query.data.totalPages > 1 && (
                <DataPagination
                  page={page}
                  pageCount={query.data.totalPages}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </div>
      </PageSkeleton>

      {/* Outside PageSkeleton so the dialogs are unaffected by skeleton rendering. */}
      <PartnerFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        partner={editing}
        type={section.type}
        saving={createPartner.isPending || updatePartner.isPending}
        onSave={savePartner}
      />

      <PartnerDetailsDialog
        partner={viewing}
        canEdit={canUpdate}
        onEdit={openEdit}
        onOpenChange={(open) => !open && setViewing(null)}
      />

      <ConfirmDialog
        open={Boolean(toggling)}
        title={t(toggling?.active ? "partners.deactivateTitle" : "partners.reactivateTitle")}
        description={
          <span>
            <Trans
              i18nKey={
                toggling?.active
                  ? "partners.deactivateDescription"
                  : "partners.reactivateDescription"
              }
              values={{ name: toggling?.name }}
              components={{
                bold: <strong className="font-bold text-primary text-lg" />,
              }}
            />
            {toggleError && (
              <span role="alert" className="mt-2 block text-destructive">
                {toggleError}
              </span>
            )}
          </span>
        }
        confirmLabel={t(toggling?.active ? "partners.deactivate" : "partners.reactivate")}
        cancelLabel={t("common.cancel")}
        tone={toggling?.active ? "destructive" : "default"}
        loading={updatePartner.isPending}
        onCancel={() => {
          setToggling(null);
          setToggleError(undefined);
        }}
        onConfirm={confirmToggle}
      />
    </div>
  );
}
