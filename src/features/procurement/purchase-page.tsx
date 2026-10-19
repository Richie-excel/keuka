import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PlusCircle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataPagination } from "@/components/pagination";
import { DataTable, type Column } from "@/components/data-table";
import { TableRowActions } from "@/components/table-row-actions";
import { PageHeader } from "@/shared/layout/page-header";
import { useAuth } from "@/shared/hooks/useAuth";
import { PageSkeleton } from "@/components/page-skeleton";
import { LOOKUP_PAGE_SIZE, PAGE_SIZE } from "@/constants";
import {
  useCreatePurchase,
  usePurchases,
  useUpdatePurchase,
} from "@/shared/hooks/use-purchases";
import { usePartners } from "@/shared/hooks/use-partners";
import { formatMoney, formatWeight, formatDateTime } from "@/lib/utils";
import { PermissionKey } from "@/enums";
import type {
  CreatePurchaseRequest,
  PartnerResponse,
  PurchaseResponse,
  UserResponse,
} from "@/interfaces";
import { PurchaseFormDialog } from "./purchase-dialog";
import { usePurchaseReceiptPrinter } from "./use-purchase-receipt";
import { usePrintPrompt } from "@/components/documents/use-print-prompt";
import { useUsers } from "@/shared/hooks/use-users";

export function PurchasePage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [selectedPurchase, setSelectedPurchase] =
    useState<PurchaseResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const purchases = usePurchases({ page, size: PAGE_SIZE });
  const users = useUsers();
  const partners = usePartners(undefined, {
    page: 1,
    size: LOOKUP_PAGE_SIZE,
  });
  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase();
  const navigate = useNavigate();
  const printPrompt = usePrintPrompt();
  const printReceipt = usePurchaseReceiptPrinter();
  const openDetails = (purchase: PurchaseResponse) =>
    navigate(`/procurement/purchases/${purchase.id}`);

  const partnerById = new Map(
    (partners.data?.content ?? []).map((partner: PartnerResponse) => [
      partner.id,
      partner,
    ]),
  );
  const userById = new Map((users.data?.content ?? []).map((user: UserResponse) => [
    user.id,
    user,
  ]),
);

  const columns: Column<PurchaseResponse>[] = [
    {
      header: t("purchases.columnPartner"),
      cell: (purchase) => {
        const partnerId = purchase.farmerId ?? purchase.buyerId;
        return partnerId
          ? (partnerById.get(partnerId)?.name ?? partnerId)
          : "—";
      },
    },
    {
      header: t("purchases.columnDate"),
      cell: (purchase) => formatDateTime(purchase.purchaseDate),
      hideOnMobile: true,
    },
    {
      header: t("purchases.columnNetWeight"),
      cell: (purchase) => formatWeight(purchase.netWeight),
      hideOnMobile: true,
    },
    {
      header: t("purchases.columnAmount"),
      cell: (purchase) => formatMoney(purchase.amount),
    },
    {
      header: t("purchases.columnPayment"),
      cell: (purchase) => purchase.payable?.status ?? purchase.status,
    },
    {
      header: t("purchases.columnRecordedBy"),
      cell: (purchase) => {
        const recorder = purchase.recordedBy;
        return recorder ? (userById.get(recorder)?.fullName + " ("+ userById.get(recorder)?.roles[0] + ")") : "-"
      },
      hideOnMobile: true,
    },
  ];

  async function savePurchase(input: CreatePurchaseRequest) {
    if (selectedPurchase) {
      await updatePurchase.mutateAsync({
        id: selectedPurchase.id,
        input,
      });
    } else {
      const purchase = await createPurchase.submitAsync(input);
      // Offer the receipt now the purchase is recorded (the day's total when
      // this delivery joined an earlier one).
      const partner = partnerById.get(purchase.farmerId ?? purchase.buyerId ?? "");
      printPrompt.prompt({
        title: t("documents.prompt.receiptTitle"),
        description: t("documents.prompt.receiptText", { name: partner?.name ?? "—" }),
        print: () => printReceipt(purchase, partner),
      });
    }
    setDialogOpen(false);
    setSelectedPurchase(null);
    setPage(1);
  }

  function openCreateDialog() {
    setSelectedPurchase(null);
    setDialogOpen(true);
  }

  function openEditDialog(purchase: PurchaseResponse) {
    setSelectedPurchase(purchase);
    setDialogOpen(true);
  }

  const partnerError = partners.isError ? partners.error.message : undefined;
  const saving = createPurchase.isPending || updatePurchase.isPending;

  return (
  <div className="max-w-4xl space-y-6">
    <PageSkeleton loading={purchases.isPending}>
      <div className="space-y-6">
        <PageHeader
          title={t("purchases.title")}
          icon={ShoppingCart}
          description={t("purchases.description")}
          action={
            hasPermission(PermissionKey.PURCHASE_CREATE) ? (
              <Button type="button" onClick={openCreateDialog}>
                <PlusCircle aria-hidden="true" />
                {t("purchases.newPurchase")}
              </Button>
            ) : undefined
          }
        />

        {purchases.isError ? (
          <p role="alert" className="rounded-md py-4 text-sm text-destructive">
            {purchases.error.message}
          </p>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={purchases.data?.content ?? []}
              rowKey={(purchase) => purchase.id}
              emptyTitle={t("purchases.emptyTitle")}
              emptyDescription={t("purchases.emptyDescription")}
              actionsLabel={t("common.actions.row")}
              onRowClick={openDetails}
              rowActions={(purchase) => (
                <TableRowActions
                  actionsLabel={t("common.actions.row")}
                  labels={{
                    view: t("common.actions.view"),
                    edit: t("common.actions.edit"),
                    delete: t("common.actions.delete"),
                  }}
                  canView
                  onView={() => openDetails(purchase)}
                  canEdit={hasPermission(PermissionKey.PURCHASE_UPDATE)}
                  onEdit={() => openEditDialog(purchase)}
                />
              )}
            />

            {purchases.data && purchases.data.totalPages > 1 && (
              <DataPagination
                page={page}
                pageCount={purchases.data.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </PageSkeleton>

    {/* Outside PageSkeleton so the dialog is unaffected by skeleton rendering. */}
    {printPrompt.dialog}
    <PurchaseFormDialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) setSelectedPurchase(null);
      }}
      purchase={selectedPurchase}
      partners={partners.data?.content ?? []}
      partnersLoading={partners.isPending}
      partnersError={partnerError}
      saving={saving}
      onSave={savePurchase}
    />
  </div>
);
}
