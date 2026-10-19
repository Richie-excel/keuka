import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, PlusCircle, Printer, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/data-table";
import { DataPagination } from "@/components/pagination";
import { PageSkeleton } from "@/components/page-skeleton";
import { TableRowActions } from "@/components/table-row-actions";
import { PageHeader } from "@/shared/layout/page-header";
import { useAuth } from "@/shared/hooks/useAuth";
import {
  useDeliveries,
  useLoadTruck,
  useMarkDelivered,
} from "@/shared/hooks/use-deliveries";
import { usePartners } from "@/shared/hooks/use-partners";
import { formatWeight, formatDate } from "@/lib/utils";
import { LOOKUP_PAGE_SIZE, PAGE_SIZE } from "@/constants";
import { DeliveryStatus, PartnerType, PermissionKey } from "@/enums";
import type {
  CreateDeliveryRequest,
  DeliveryResponse,
  PartnerResponse,
} from "@/interfaces";
import { DeliveryFormDialog } from "./delivery-dialog";
import { DeliveryDetailsDialog } from "./delivery-details";
import { toDeliveryNoteData } from "./delivery-note-data";
import { DeliveryNote } from "@/components/documents/delivery-note";
import { useDocumentPrinter } from "@/components/documents/print-context";
import { usePrintPrompt } from "@/components/documents/use-print-prompt";
import { useCompanyIdentity } from "@/shared/hooks/use-company-identity";

export function LogisticsPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<DeliveryResponse | null>(null);

  const canCreate = hasPermission(PermissionKey.LOGISTICS_CREATE);
  const canUpdate = hasPermission(PermissionKey.LOGISTICS_UPDATE);

  const query = useDeliveries({ page, size: PAGE_SIZE });
  // Deliveries may only go to COMMERCIAL partners (the server rejects others).
  const partners = usePartners(PartnerType.COMMERCIAL, {
    page: 1,
    size: LOOKUP_PAGE_SIZE,
  });
  const loadTruck = useLoadTruck();
  const markDelivered = useMarkDelivered();

  const partnerById = new Map(
    (partners.data?.content ?? []).map((partner: PartnerResponse) => [
      partner.id,
      partner,
    ]),
  );
  const printer = useDocumentPrinter();
  const printPrompt = usePrintPrompt();
  const { company } = useCompanyIdentity();

  function printDeliveryNote(delivery: DeliveryResponse) {
    printer.printDocument(
      <DeliveryNote
        company={company}
        data={toDeliveryNoteData(delivery, partnerById.get(delivery.partnerId), t)}
      />,
    );
  }

  const partnerName = (partnerId: string) =>
    partnerById.get(partnerId)?.name ?? partnerId;

  const isOpen = (delivery: DeliveryResponse) =>
    delivery.status !== DeliveryStatus.DELIVERED &&
    delivery.status !== DeliveryStatus.CANCELLED;

  const columns: Column<DeliveryResponse>[] = [
    {
      header: t("logistics.columnVehicle"),
      cell: (delivery) => delivery.vehicleNumber,
    },
    {
      header: t("logistics.columnDriver"),
      cell: (delivery) => delivery.driverName,
    },
    {
      header: t("logistics.columnDestination"),
      cell: (delivery) => delivery.destination,
      hideOnMobile: true,
    },
    {
      header: t("logistics.columnDeparted"),
      cell: (delivery) =>
        formatDate(delivery.departureAt),
      hideOnMobile: true,
    },
    {
      header: t("logistics.columnStatus"),
      cell: (delivery) => delivery.status,
    },
    {
      header: t("logistics.declaredNetWeight"),
      cell: (delivery) => formatWeight(delivery.declaredNetWeight ?? 0),
      hideOnMobile: true,
    },
  ];

  async function saveDelivery(input: CreateDeliveryRequest) {
    const delivery = await loadTruck.submitAsync(input);
    setPage(1);
    printPrompt.prompt({
      title: t("documents.prompt.deliveryTitle"),
      description: t("documents.prompt.deliveryText", {
        vehicle: delivery.vehicleNumber,
        name: partnerById.get(delivery.partnerId)?.name ?? "—",
      }),
      print: () => printDeliveryNote(delivery),
    });
  }

  function openDetails(delivery: DeliveryResponse) {
    markDelivered.reset();
    setSelected(delivery);
  }

  function closeTrip(delivery: DeliveryResponse) {
    // Refresh the details dialog if it is open; never open it from the row menu.
    markDelivered.mutate(delivery.id, {
      onSuccess: (updated) =>
        setSelected((current) => (current ? updated : current)),
    });
  }

  return (
    <div>
      <PageSkeleton loading={query.isPending}>
        <div>
          <PageHeader
            title={t("logistics.title")}
            description={t("logistics.description")}
            icon={Truck}
            action={
              canCreate ? (
                <Button type="button" onClick={() => setCreateOpen(true)}>
                  <PlusCircle aria-hidden="true" />
                  {t("logistics.newDelivery")}
                </Button>
              ) : undefined
            }
          />
          {query.isError ? (
            <p role="alert" className="py-8 text-center text-sm text-destructive">
              {query.error.message}
            </p>
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={query.data?.content ?? []}
                rowKey={(delivery) => delivery.id}
                emptyTitle={t("logistics.emptyTitle")}
                emptyDescription={t("logistics.emptyDescription")}
                onRowClick={openDetails}
                actionsLabel={t("common.actions.row")}
                rowActions={(delivery) => (
                  <TableRowActions
                    actionsLabel={t("common.actions.row")}
                    labels={{
                      view: t("common.actions.view"),
                      edit: t("common.actions.edit"),
                      delete: t("common.actions.delete"),
                    }}
                    canView
                    onView={() => openDetails(delivery)}
                    extraActions={[
                      {
                        id: "print-delivery-note",
                        label: t("documents.actions.printDeliveryNote"),
                        icon: Printer,
                        visible: true,
                        onClick: () => printDeliveryNote(delivery),
                      },
                      {
                        id: "mark-delivered",
                        label: t("logistics.details.markDelivered"),
                        icon: CheckCircle2,
                        visible: canUpdate && isOpen(delivery),
                        onClick: () => closeTrip(delivery),
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
      {printPrompt.dialog}
      <DeliveryFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        partners={partners.data?.content ?? []}
        partnersLoading={partners.isPending}
        partnersError={partners.isError ? partners.error.message : undefined}
        saving={loadTruck.isPending}
        onSave={saveDelivery}
      />

      <DeliveryDetailsDialog
        delivery={selected}
        partnerName={partnerName}
        canMarkDelivered={canUpdate}
        marking={markDelivered.isPending}
        error={markDelivered.error?.message}
        onMarkDelivered={closeTrip}
        onPrint={printDeliveryNote}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}
