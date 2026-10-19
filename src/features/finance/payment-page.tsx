import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PlusCircle, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataPagination } from "@/components/pagination";
import { DataTable, type Column } from "@/components/data-table";
import { TableRowActions } from "@/components/table-row-actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/shared/layout/page-header";
import { useAuth } from "@/shared/hooks/useAuth";
import {
  useDeletePayment,
  usePayment,
  usePayments,
  usePayPurchase,
  usePurchases,
} from "@/shared/hooks/use-purchases";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { formatReceiptNo } from "@/components/documents/types";
import { Link } from "react-router-dom";
import { PaymentMethod, PermissionKey } from "@/enums";
import type {
  CreatePaymentRequest,
  PaymentResponse,
  PurchaseResponse,
} from "@/interfaces";
import { usePartners } from "@/shared/hooks/use-partners";
import Loader from "@/components/loader";
import { PageSkeleton } from "@/components/page-skeleton";
import { LOOKUP_PAGE_SIZE, PAGE_SIZE } from "@/constants";
import { PaymentDialog } from "./payment-dialog";
import { purchasesApi } from "@/api/purchases";
import { usePrintPrompt } from "@/components/documents/use-print-prompt";
import { usePurchaseReceiptPrinter } from "@/features/procurement/use-purchase-receipt";

export function PaymentPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canReadPurchases = hasPermission(PermissionKey.PURCHASE_READ);
  const canCreatePayments =
    hasPermission(PermissionKey.PAYMENT_CREATE) && canReadPurchases;
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>();
  const [paymentToDelete, setPaymentToDelete] =
    useState<PaymentResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string>();

  const payments = usePayments({ page, size: PAGE_SIZE });
  const purchases = usePurchases(
    { page: 1, size: LOOKUP_PAGE_SIZE },
    canReadPurchases,
  );
  // Purchases store only the seller's id; the payment form shows their name.
  const partners = usePartners(undefined, { page: 1, size: LOOKUP_PAGE_SIZE });
  const partnerNames = new Map(
    (partners.data?.content ?? []).map((partner) => [partner.id, partner.name]),
  );
  const partnerName = (purchase: PurchaseResponse) => {
    const id = purchase.farmerId ?? purchase.buyerId ?? "";
    return partnerNames.get(id) ?? (id || "—");
  };
  const payPurchase = usePayPurchase();
  const printPrompt = usePrintPrompt();
  const printReceipt = usePurchaseReceiptPrinter();
  const deletePayment = useDeletePayment();
  const detail = usePayment(selectedPaymentId);

  const columns: Column<PaymentResponse>[] = [
    {
      header: t("payments.columnDate"),
      cell: (payment) => formatDateTime(payment.paymentDate),
    },
    {
      header: t("payments.columnPaidTo"),
      cell: (payment) => (
        <span className="font-medium text-cocoa-900">
          {payment.partnerName || "—"}
        </span>
      ),
    },
    {
      header: t("payments.columnPurchase"),
      cell: (payment) =>
        payment.purchaseId ? (
          <Link
            to={`/procurement/purchases/${payment.purchaseId}`}
            className="font-medium text-cocoa-700 hover:underline"
          >
            {formatReceiptNo(
              payment.purchaseId,
              payment.purchaseDate ?? payment.paymentDate,
            )}
          </Link>
        ) : (
          "—"
        ),
      hideOnMobile: true,
    },
    {
      header: t("payments.columnMethod"),
      cell: (payment) =>
        t(`payments.methods.${payment.method}`, payment.method),
    },
    {
      header: t("payments.columnAmount"),
      cell: (payment) => formatMoney(payment.amount),
    },
    {
      header: t("payments.columnStatus"),
      cell: (payment) => t(`payments.status.${payment.status}`, payment.status),
    },
  ];

  async function createPayment(
    purchaseId: string,
    input: CreatePaymentRequest,
  ) {
    await payPurchase.submitAsync({ id: purchaseId, input });
    // Offer the purchase's receipt, now showing this payment.
    printPrompt.prompt({
      title: t("documents.prompt.paymentTitle"),
      description: t("documents.prompt.paymentText"),
      print: async () => {
        const purchase = await purchasesApi.byId(purchaseId);
        const partner = (partners.data?.content ?? []).find(
          (p) => p.id === (purchase.farmerId ?? purchase.buyerId),
        );
        await printReceipt(purchase, partner);
      },
    });
  }

  async function confirmDelete() {
    if (!paymentToDelete) return;
    setDeleteError(undefined);
    try {
      await deletePayment.mutateAsync(paymentToDelete.id);
      setPaymentToDelete(null);
      if (payments.data?.content.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : t("errors.unexpectedDescription");
      setDeleteError(message);
      throw cause;
    }
  }

  const unpaidPurchases =
    purchases.data?.content.filter(
      (purchase) => (purchase.payable?.remaining ?? 0) > 0,
    ) ?? [];

  return (
    <div className="space-y-6">
      <PageSkeleton loading={payments.isPending}>
        <div className="space-y-6">
          <PageHeader
            title={t("payments.title")}
            icon={WalletCards}
            description={t("payments.description")}
            action={
              canCreatePayments ? (
                <Button
                  onClick={() => setCreateOpen(true)}
                  disabled={purchases.isPending || purchases.isError}
                >
                  <PlusCircle />
                  {t("payments.newPayment")}
                </Button>
              ) : undefined
            }
          />

          {payments.isError ? (
            <p role="alert" className="py-4 text-sm text-destructive">
              {payments.error.message}
            </p>
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={payments.data?.content ?? []}
                rowKey={(payment) => payment.id}
                emptyTitle={t("payments.emptyTitle")}
                emptyDescription={t("payments.emptyDescription")}
                actionsLabel={t("common.actions.row")}
                rowActions={(payment) => (
                  <TableRowActions
                    labels={{
                      view: t("common.actions.view"),
                      edit: t("common.actions.edit"),
                      delete: t("payments.voidAction"),
                    }}
                    canView
                    onView={() => setSelectedPaymentId(payment.id)}
                    canDelete={
                      hasPermission(PermissionKey.PAYMENT_DELETE) &&
                      payment.status !== "VOIDED" &&
                      // An offset is the buyer's prefinance being repaid; deleting it
                      // alone would leave the advance and the payable disagreeing.
                      payment.method !== PaymentMethod.PREFINANCE_OFFSET
                    }
                    onDelete={() => {
                      setDeleteError(undefined);
                      setPaymentToDelete(payment);
                    }}
                  />
                )}
              />
              {payments.data && payments.data.totalPages > 1 && (
                <DataPagination
                  page={page}
                  pageCount={payments.data.totalPages}
                  onPageChange={setPage}
                />
              )}
            </>
          )}

          {canCreatePayments && purchases.isError && (
            <p role="alert" className="text-sm text-destructive">
              {purchases.error.message}
            </p>
          )}
        </div>
      </PageSkeleton>

      {printPrompt.dialog}
      <PaymentDialog
        open={createOpen}
        purchases={unpaidPurchases}
        partnerName={partnerName}
        pending={payPurchase.isPending}
        onOpenChange={setCreateOpen}
        onSave={createPayment}
      />

      <Dialog
        open={Boolean(selectedPaymentId)}
        onOpenChange={(open) => !open && setSelectedPaymentId(undefined)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("payments.detailTitle")}</DialogTitle>
            <DialogDescription>
              {t("payments.detailDescription")}
            </DialogDescription>
          </DialogHeader>
          {detail.isPending ? (
            <div className="flex justify-center py-8">
              <Loader className="w-20 h-20" />
            </div>
          ) : detail.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {detail.error.message}
            </p>
          ) : detail.data ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <PaymentDetail
                label={t("payments.columnPaidTo")}
                value={detail.data.partnerName || "—"}
              />
              <PaymentDetail
                label={t("payments.columnPurchase")}
                value={
                  detail.data.purchaseId ? (
                    <Link
                      to={`/procurement/purchases/${detail.data.purchaseId}`}
                      className="font-medium text-cocoa-700 hover:underline"
                    >
                      {formatReceiptNo(
                        detail.data.purchaseId,
                        detail.data.purchaseDate ?? detail.data.paymentDate,
                      )}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
              <PaymentDetail
                label={t("payments.columnDate")}
                value={formatDateTime(detail.data.paymentDate)}
              />
              <PaymentDetail
                label={t("payments.columnMethod")}
                value={t(
                  `payments.methods.${detail.data.method}`,
                  detail.data.method,
                )}
              />
              <PaymentDetail
                label={t("payments.columnAmount")}
                value={formatMoney(detail.data.amount)}
              />
              <PaymentDetail
                label={t("payments.columnStatus")}
                value={t(
                  `payments.status.${detail.data.status}`,
                  detail.data.status,
                )}
              />
              {detail.data.reference && (
                <PaymentDetail
                  label={t("payments.reference")}
                  value={detail.data.reference}
                />
              )}
            </dl>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(paymentToDelete)}
        title={t("payments.deleteTitle")}
        description={
          <span>
            {t("payments.deleteDescription", {
              amount: formatMoney(paymentToDelete?.amount ?? 0),
            })}
            {deleteError && (
              <span role="alert" className="mt-2 block text-destructive">
                {deleteError}
              </span>
            )}
          </span>
        }
        confirmLabel={t("payments.voidAction")}
        cancelLabel={t("common.cancel")}
        tone="destructive"
        loading={deletePayment.isPending}
        onCancel={() => {
          setPaymentToDelete(null);
          setDeleteError(undefined);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function PaymentDetail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-cocoa-500">{label}</dt>
      <dd className="mt-1 break-all font-medium text-cocoa-900">{value}</dd>
    </div>
  );
}
