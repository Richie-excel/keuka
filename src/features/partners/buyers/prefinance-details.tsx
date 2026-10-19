import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Info, Printer, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/shared/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { PageSkeleton } from "@/components/page-skeleton";
import { usePrefinance } from "@/shared/hooks/use-prefinances";
import { usePartner } from "@/shared/hooks/use-partners";
import { formatMoney, formatWeight } from "@/lib/utils";
import { PermissionKey } from "@/enums";
import { useAuth } from "@/shared/hooks/useAuth";
import { PrefinanceReceipt } from "@/components/documents/prefinance-receipt";
import { useDocumentPrinter } from "@/components/documents/print-context";
import { useCompanyIdentity } from "@/shared/hooks/use-company-identity";
import { toPrefinanceReceiptData } from "./prefinance-receipt-data";

export function PrefinanceDetailsPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { buyerId, prefinanceId } = useParams<{
    buyerId: string;
    prefinanceId: string;
  }>();
  const buyerQuery = usePartner(buyerId);
  const prefinanceQuery = usePrefinance(prefinanceId);
  const printer = useDocumentPrinter();
  const { company } = useCompanyIdentity();

  if (buyerQuery.isError || prefinanceQuery.isError) {
    return (
      <p role="alert" className="py-8 text-center text-sm text-destructive">
        {(buyerQuery.error ?? prefinanceQuery.error)?.message}
      </p>
    );
  }

  const prefinance = prefinanceQuery.data;
  const isSettled = prefinance?.status === "SETTLED";

  return (
    <PageSkeleton loading={buyerQuery.isPending || prefinanceQuery.isPending}>
      <div className="max-w-4xl">
        <PageHeader
          title={buyerQuery.data?.name ?? t("buyers.title")}
          description={t("buyers.prefinanceDetailsDescription")}
          action={
            prefinance ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  printer.printDocument(
                    <PrefinanceReceipt
                      company={company}
                      data={toPrefinanceReceiptData(
                        prefinance,
                        buyerQuery.data,
                        t,
                      )}
                    />,
                  )
                }
              >
                <Printer aria-hidden="true" />
                {t("documents.actions.printPrefinance")}
              </Button>
            ) : undefined
          }
        />
        <Card>
          <CardHeader>
            <CardTitle>{t("buyers.settlementTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-cocoa-100">
            <div className="flex justify-between py-3 text-sm">
              <span className="text-cocoa-500">
                {t("buyers.columnAdvanced")}
              </span>
              <span className="font-medium text-cocoa-900">
                {formatMoney(prefinance?.amount ?? 0)}
              </span>
            </div>
            <div className="flex justify-between py-3 text-sm">
              <span className="text-cocoa-500">{t("buyers.unitPrice")}</span>
              <span className="font-medium text-cocoa-900">
                {formatMoney(prefinance?.historicalUnitPrice ?? 0)}/kg
              </span>
            </div>
            <div className="flex justify-between py-3 text-sm">
              <span className="text-cocoa-500">
                {t("buyers.deliveredQuantity")}
              </span>
              <span className="font-medium text-cocoa-900">
                {formatWeight(prefinance?.deliveredQuantity ?? 0)}
              </span>
            </div>
            <div className="flex justify-between py-3 text-sm">
              <span className="text-cocoa-500">
                {t("buyers.totalOutstanding")}
              </span>
              <span className="font-medium text-cocoa-900">
                {formatMoney(prefinance?.outstandingAdvance ?? 0)}
              </span>
            </div>
            <div className="flex justify-between py-3 text-sm">
              <span className="text-cocoa-500">{t("buyers.columnStatus")}</span>
              <StatusBadge
                label={prefinance?.status ?? "—"}
                tone={isSettled ? "positive" : "pending"}
              />
            </div>
          </CardContent>
        </Card>
        {/* Cocoa the buyer brings is a purchase like any other: recording it on
          the purchase form repays this advance at its agreed price. */}
        {prefinance && !isSettled && (
          <div className="mt-4 space-y-3 rounded-lg bg-cocoa-50 p-4 text-sm text-cocoa-700">
            <p className="flex items-start gap-2">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {t("buyers.settleThroughPurchase")}
            </p>
            {hasPermission(PermissionKey.PURCHASE_CREATE) && (
              <Button asChild className="w-full">
                <Link to="/procurement/purchases">
                  <ShoppingCart aria-hidden="true" />
                  {t("buyers.recordPurchase")}
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </PageSkeleton>
  );
}
