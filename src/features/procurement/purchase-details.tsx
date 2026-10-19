import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowUpRight, Printer, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/shared/layout/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { DataTable, type Column } from "@/components/data-table";
import { useAuth } from "@/shared/hooks/useAuth";
import { usePartner } from "@/shared/hooks/use-partners";
import { usePurchase, usePurchasePayments } from "@/shared/hooks/use-purchases";
import { PAYABLE_STATUS } from "@/shared/status";
import { formatDate, formatDateTime, formatMoney, formatWeight } from "@/lib/utils";
import { formatReceiptNo } from "@/components/documents/types";
import { PaymentMethod, PaymentStatus, PermissionKey } from "@/enums";
import type { PaymentResponse, PurchaseDeliveryResponse } from "@/interfaces";
import { buyerDetailsPath, prefinanceDetailsPath } from "@/features/partners/partner-types";
import { usePurchaseReceiptPrinter } from "./use-purchase-receipt";

const PREFINANCE_REF = "PREFINANCE:";

/**
 * One purchase: who sold it, what was weighed, how it was priced, and how it
 * has been paid — including any part that repaid the buyer's prefinance.
 * Printing the receipt is the main action here.
 */
export function PurchaseDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const canReadPayments = hasPermission(PermissionKey.PAYMENT_READ);

  const purchaseQuery = usePurchase(id);
  const purchase = purchaseQuery.data;
  const partnerId = purchase?.farmerId ?? purchase?.buyerId ?? undefined;
  const partnerQuery = usePartner(partnerId);
  const partner = partnerQuery.data;
  const paymentsQuery = usePurchasePayments(id, canReadPayments);
  const printReceipt = usePurchaseReceiptPrinter();

  if (purchaseQuery.isError) {
    return (
      <p role="alert" className="py-8 text-center text-sm text-destructive">
        {purchaseQuery.error.message}
      </p>
    );
  }

  const isBuyer = Boolean(purchase?.buyerId);
  const agreedPrice = isBuyer && !purchase?.priceId;
  const payable = purchase?.payable;
  const status = payable ? PAYABLE_STATUS[payable.status] : undefined;
  const payments = (paymentsQuery.data ?? []).filter((p) => p.status !== PaymentStatus.VOIDED);

  const deliveryLines = purchase?.deliveries ?? [];
  const deliveryColumns: Column<PurchaseDeliveryResponse>[] = [
    { header: t("purchases.details.deliveredAt"), cell: (d) => formatDateTime(d.deliveredAt) },
    {
      header: t("documents.receipt.grossWeight"),
      cell: (d) => formatWeight(d.grossWeight),
      hideOnMobile: true,
    },
    {
      header: t("documents.receipt.humidity"),
      cell: (d) => (d.humidity === null || d.humidity === undefined ? "—" : `${d.humidity.toFixed(2)} %`),
      hideOnMobile: true,
    },
    { header: t("documents.receipt.netWeight"), cell: (d) => formatWeight(d.netWeight) },
    {
      header: t("purchases.details.price"),
      cell: (d) => `${formatMoney(d.unitPrice)}/kg`,
      hideOnMobile: true,
    },
    {
      header: t("purchases.details.amount"),
      cell: (d) => <span className="font-medium tabular-nums">{formatMoney(d.amount)}</span>,
    },
  ];

  const paymentColumns: Column<PaymentResponse>[] = [
    { header: t("purchases.details.paidOn"), cell: (p) => formatDate(p.paymentDate) },
    {
      header: t("purchases.details.method"),
      cell: (p) => t(`payments.methods.${p.method}`, p.method),
    },
    {
      header: t("purchases.details.reference"),
      cell: (p) => {
        // An offset's reference names the prefinance it repaid.
        if (p.method === PaymentMethod.PREFINANCE_OFFSET && p.reference?.startsWith(PREFINANCE_REF)) {
          const prefinanceId = p.reference.slice(PREFINANCE_REF.length);
          return purchase?.buyerId ? (
            <Link
              to={prefinanceDetailsPath(purchase.buyerId, prefinanceId)}
              className="inline-flex items-center gap-1 font-medium text-cocoa-700 hover:underline"
            >
              {t("purchases.details.openPrefinance")}
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          ) : (
            "—"
          );
        }
        return p.reference || "—";
      },
      hideOnMobile: true,
    },
    {
      header: t("purchases.details.amount"),
      cell: (p) => <span className="font-medium tabular-nums">{formatMoney(p.amount)}</span>,
    },
  ];

  return (
    <PageSkeleton loading={purchaseQuery.isPending}>
      <div className="max-w-5xl space-y-6">
        <Link
          to="/procurement/purchases"
          className="inline-flex items-center gap-1 text-sm text-cocoa-600 hover:text-cocoa-900"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t("purchases.details.back")}
        </Link>

        <PageHeader
          title={partner?.name ?? t("purchases.details.title")}
          icon={ShoppingCart}
          description={
            purchase
              ? `${formatReceiptNo(purchase.id, purchase.purchaseDate)} · ${formatDateTime(purchase.purchaseDate)}`
              : undefined
          }
          action={
            purchase ? (
              <Button type="button" onClick={() => void printReceipt(purchase, partner)}>
                <Printer aria-hidden="true" />
                {t("documents.actions.printReceipt")}
              </Button>
            ) : undefined
          }
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("purchases.details.seller")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-cocoa-100">
                <Row label={t("purchases.details.name")}>
                  {isBuyer && purchase?.buyerId ? (
                    <Link
                      to={buyerDetailsPath(purchase.buyerId)}
                      className="inline-flex items-center gap-1 text-cocoa-700 hover:underline"
                    >
                      {partner?.name ?? "—"}
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  ) : (
                    (partner?.name ?? "—")
                  )}
                </Row>
                <Row label={t("purchases.details.kind")}>
                  {t(isBuyer ? "purchases.buyer" : "purchases.farmer")}
                </Row>
                <Row label={t("purchases.details.phone")}>{partner?.phone || "—"}</Row>
                <Row label={t("purchases.columnRecordedBy")}>{purchase?.recordedByName || "—"}</Row>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("purchases.details.weighing")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-cocoa-100">
                <Row label={t("documents.receipt.grossWeight")}>{formatWeight(purchase?.grossWeight ?? 0)}</Row>
                <Row label={t("documents.receipt.humidity")}>
                  {purchase?.humidity === null || purchase?.humidity === undefined
                    ? "—"
                    : `${purchase.humidity.toFixed(2)} %`}
                </Row>
                <Row label={t("documents.receipt.refraction")}>
                  {purchase?.refraction === null || purchase?.refraction === undefined
                    ? "—"
                    : formatWeight(purchase.refraction)}
                </Row>
                <Row label={t("documents.receipt.netWeight")} strong>
                  {formatWeight(purchase?.netWeight ?? 0)}
                </Row>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Every weighing that makes up this day's purchase. */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("purchases.details.deliveries", { count: deliveryLines.length })}
            </CardTitle>
            {deliveryLines.length > 1 && (
              <p className="text-xs text-cocoa-500">{t("purchases.details.deliveriesHint")}</p>
            )}
          </CardHeader>
          <CardContent>
            <DataTable
              columns={deliveryColumns}
              rows={deliveryLines}
              rowKey={(d) => d.id}
              emptyTitle={t("purchases.details.noDeliveries")}
              emptyDescription=""
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle>{t("purchases.details.payment")}</CardTitle>
            {status && payable && (
              <StatusBadge label={t(status.labelKey, payable.status)} tone={status.tone} />
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="divide-y divide-cocoa-100 rounded-lg bg-cocoa-50 px-4">
              <Row
                label={t(agreedPrice ? "documents.receipt.agreedPrice" : "documents.receipt.unitPrice")}
              >
                {formatMoney(purchase?.unitPrice ?? 0)}/kg
              </Row>
              <Row label={t("documents.receipt.totalAmount")} strong>
                {formatMoney(purchase?.amount ?? 0)}
              </Row>
              {payable && (
                <>
                  <Row label={t("purchases.details.paid")}>{formatMoney(payable.paidAmount)}</Row>
                  <Row label={t("documents.receipt.stillOwed")} strong>
                    {formatMoney(payable.remaining)}
                  </Row>
                </>
              )}
            </dl>

            {canReadPayments && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-cocoa-900">
                  {t("purchases.details.paymentHistory")}
                </h3>
                {paymentsQuery.isError ? (
                  <p role="alert" className="text-sm text-destructive">
                    {paymentsQuery.error.message}
                  </p>
                ) : (
                  <DataTable
                    columns={paymentColumns}
                    rows={payments}
                    rowKey={(p) => p.id}
                    emptyTitle={t("purchases.details.noPayments")}
                    emptyDescription={t("purchases.details.noPaymentsDescription")}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {purchase?.notes && (
          <Card>
            <CardHeader>
              <CardTitle>{t("purchases.details.notes")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line text-cocoa-900">{purchase.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageSkeleton>
  );
}

function Row({
  label,
  strong = false,
  children,
}: {
  label: string;
  strong?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <dt className="text-cocoa-500">{label}</dt>
      <dd className={`text-right ${strong ? "font-semibold text-cocoa-900" : "font-medium text-cocoa-900"}`}>
        {children}
      </dd>
    </div>
  );
}
