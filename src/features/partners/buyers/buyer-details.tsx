import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PlusCircle, Printer } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/shared/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
import { PageSkeleton } from "@/components/page-skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/shared/hooks/useAuth";
import { PermissionKey } from "@/enums";
import { usePartner } from "@/shared/hooks/use-partners";
import {
  useBuyerBalance,
  useCreatePrefinance,
  usePrefinances,
} from "@/shared/hooks/use-prefinances";
import { StatCard } from "@/components/stat-card";
import { HandCoins, Wallet } from "lucide-react";
import { formatDateTime, formatMoney, formatWeight } from "@/lib/utils";
import { LOOKUP_PAGE_SIZE, PAGE_SIZE } from "@/constants";
import type {
  CreatePrefinanceRequest,
  PrefinanceResponse,
  PurchaseDeliveryResponse,
} from "@/interfaces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataPagination } from "@/components/pagination";
import { usePartnerDeliveries } from "@/shared/hooks/use-purchases";
import { PrefinanceDialog } from "./prefinance-dialog";
import { TableRowActions } from "@/components/table-row-actions";
import { PrefinanceReceipt } from "@/components/documents/prefinance-receipt";
import { useDocumentPrinter } from "@/components/documents/print-context";
import { usePrintPrompt } from "@/components/documents/use-print-prompt";
import { useCompanyIdentity } from "@/shared/hooks/use-company-identity";
import { toPrefinanceReceiptData } from "./prefinance-receipt-data";
import { prefinanceDetailsPath } from "../partner-types";
import { useState } from "react";

export function BuyerDetailsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [createOpen, setCreateOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const canReadPurchases = hasPermission(PermissionKey.PURCHASE_READ);
  // Every cocoa delivery this buyer made, across all days.
  const history = usePartnerDeliveries(id, { page: historyPage, size: PAGE_SIZE }, canReadPurchases);
  const buyerQuery = usePartner(id);
  const printer = useDocumentPrinter();
  const printPrompt = usePrintPrompt();
  const { company } = useCompanyIdentity();
  const prefinancesQuery = usePrefinances({ page: 1, size: LOOKUP_PAGE_SIZE }, id);
  const createPrefinance = useCreatePrefinance();
  // Cumulative over every advance and cash session, not only the rows listed.
  const balance = useBuyerBalance(id);

  const historyColumns: Column<PurchaseDeliveryResponse>[] = [
    { header: t("buyers.history.when"), cell: (d) => formatDateTime(d.deliveredAt) },
    {
      header: t("buyers.history.gross"),
      cell: (d) => formatWeight(d.grossWeight),
      hideOnMobile: true,
    },
    { header: t("buyers.history.net"), cell: (d) => formatWeight(d.netWeight) },
    {
      header: t("buyers.history.price"),
      cell: (d) => `${formatMoney(d.unitPrice)}/kg`,
      hideOnMobile: true,
    },
    {
      header: t("buyers.history.amount"),
      cell: (d) => <span className="font-medium tabular-nums">{formatMoney(d.amount)}</span>,
    },
    {
      header: t("buyers.history.repaid"),
      cell: (d) => (d.prefinanceSettled > 0 ? formatMoney(d.prefinanceSettled) : "—"),
      hideOnMobile: true,
    },
  ];

  const columns: Column<PrefinanceResponse>[] = [
    { header: t("buyers.columnAdvanced"), cell: (row) => formatMoney(row.disbursedAmount) },
    { header: t("buyers.advanceDate"), cell: (row) => row.advanceDate, hideOnMobile: true },
    { header: t("buyers.deliveredQuantity"), cell: (row) => formatWeight(row.deliveredQuantity) },
    {
      header: t("buyers.columnStatus"),
      cell: (row) => <StatusBadge label={row.status} tone={row.status === "SETTLED" ? "positive" : "pending"} />,
    },
  ];

  if (buyerQuery.isError || prefinancesQuery.isError) {
    return <p role="alert" className="py-8 text-center text-sm text-destructive">{(buyerQuery.error ?? prefinancesQuery.error)?.message}</p>;
  }

  const buyer = buyerQuery.data;
  const canCreatePrefinance =
    hasPermission(PermissionKey.PREFINANCE_CREATE) && (buyer?.trusted ?? false);

  async function savePrefinance(request: CreatePrefinanceRequest) {
    const prefinance = await createPrefinance.submitAsync(request);
    // The buyer signs this receipt as proof of the advance.
    printPrompt.prompt({
      title: t("documents.prompt.prefinanceTitle"),
      description: t("documents.prompt.prefinanceText", { name: buyer?.name ?? "—" }),
      print: () =>
        printer.printDocument(
          <PrefinanceReceipt company={company} data={toPrefinanceReceiptData(prefinance, buyer, t)} />,
        ),
    });
  }

  return (
    <>
      {printPrompt.dialog}
    <PageSkeleton loading={buyerQuery.isPending || prefinancesQuery.isPending}>
    <div>
      <PageHeader
        title={buyer?.name ?? t("buyers.title")}
        description={buyer?.phone}
        action={
          canCreatePrefinance ? (
            <Button onClick={() => setCreateOpen(true)}>
              <PlusCircle />
              {t("buyers.addPrefinance")}
            </Button>
          ) : undefined
        }
      />
      {balance.data && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <StatCard
            label={t("buyers.balance.owes")}
            value={formatMoney(balance.data.owes)}
            icon={Wallet}
            tone={balance.data.owes > 0 ? "pending" : "positive"}
            helper={
              balance.data.owes > 0
                ? t("buyers.balance.owesHint", { count: balance.data.openAdvances })
                : t("buyers.balance.nothingOwed")
            }
          />
          <StatCard
            label={t("buyers.balance.owedToBuyer")}
            value={formatMoney(balance.data.owedToBuyer)}
            icon={HandCoins}
            tone={balance.data.owedToBuyer > 0 ? "negative" : "positive"}
            helper={
              balance.data.owedToBuyer > 0
                ? t("buyers.balance.owedToBuyerHint")
                : t("buyers.balance.nothingOwed")
            }
          />
        </div>
      )}
      <DataTable
        columns={columns}
        rows={prefinancesQuery.data?.content ?? []}
        rowKey={(row) => row.id}
        emptyTitle={t("buyers.noPrefinanceTitle")}
        emptyDescription={t("buyers.noPrefinanceDescription")}
        onRowClick={(row) => id && navigate(prefinanceDetailsPath(id, row.id))}
        actionsLabel={t("common.actions.row")}
        rowActions={(row) => (
          <TableRowActions
            actionsLabel={t("common.actions.row")}
            labels={{
              view: t("common.actions.view"),
              edit: t("common.actions.edit"),
              delete: t("common.actions.delete"),
            }}
            canView
            onView={() => id && navigate(prefinanceDetailsPath(id, row.id))}
            extraActions={[
              {
                id: "print-prefinance",
                label: t("documents.actions.printPrefinance"),
                icon: Printer,
                visible: true,
                onClick: () =>
                  printer.printDocument(
                    <PrefinanceReceipt company={company} data={toPrefinanceReceiptData(row, buyer, t)} />,
                  ),
              },
            ]}
          />
        )}
      />

      {canReadPurchases && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("buyers.history.title")}</CardTitle>
            <p className="text-xs text-cocoa-500">{t("buyers.history.description")}</p>
          </CardHeader>
          <CardContent>
            {history.isError ? (
              <p role="alert" className="text-sm text-destructive">
                {history.error.message}
              </p>
            ) : (
              <>
                <DataTable
                  columns={historyColumns}
                  rows={history.data?.content ?? []}
                  rowKey={(d) => d.id}
                  emptyTitle={t("buyers.history.emptyTitle")}
                  emptyDescription={t("buyers.history.emptyDescription")}
                  onRowClick={(d) => navigate(`/procurement/purchases/${d.purchaseId}`)}
                />
                {history.data && history.data.totalPages > 1 && (
                  <DataPagination
                    page={historyPage}
                    pageCount={history.data.totalPages}
                    onPageChange={setHistoryPage}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
    </PageSkeleton>
      {buyer && canCreatePrefinance && (
        <PrefinanceDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          buyerId={buyer.id}
          buyerName={buyer.name}
          saving={createPrefinance.isPending}
          onSave={savePrefinance}
        />
      )}
    </>
  );
}