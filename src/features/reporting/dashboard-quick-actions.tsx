import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { TrendingUp, Vault } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PermissionKey } from "@/enums";
import { useAuth } from "@/shared/hooks/useAuth";
import { useOpenCashSession, useOpenTill } from "@/shared/hooks/use-cash-sessions";
import {
  useCurrentCocoaPrice,
  usePublishCocoaPrice,
} from "@/shared/hooks/use-cocoa-prices";
import { TillAmountDialog } from "@/features/finance/till-dialogs";
import { PricingDialog } from "@/features/pricing/pricing-dialog";

type QuickAction = "openTill" | "publishPrice" | null;

/**
 * The two things a day starts with, one click from the dashboard: opening the
 * till and publishing the day's cocoa price. Each button shows only for those
 * allowed to do it, and reuses the same dialogs as the till and pricing pages.
 * When the till is already open, the button leads to it instead.
 */
export function DashboardQuickActions() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [action, setAction] = useState<QuickAction>(null);

  const canOpenTill = hasPermission(PermissionKey.CASH_SESSION_CREATE);
  const canPublishPrice = hasPermission(PermissionKey.PRICE_CREATE);

  const till = useOpenCashSession(canOpenTill);
  const openTill = useOpenTill();
  const currentPrice = useCurrentCocoaPrice(canPublishPrice);
  const publishPrice = usePublishCocoaPrice();

  if (!canOpenTill && !canPublishPrice) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canOpenTill &&
          (till.openSession ? (
            <Button asChild variant="outline">
              <Link to="/finance/till">
                <Vault aria-hidden="true" />
                {t("dashboard.quickActions.goToTill")}
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              disabled={till.isPending}
              onClick={() => setAction("openTill")}
            >
              <Vault aria-hidden="true" />
              {t("till.openTill")}
            </Button>
          ))}
        {canPublishPrice && (
          <Button
            type="button"
            variant={canOpenTill && !till.openSession ? "outline" : "default"}
            onClick={() => setAction("publishPrice")}
          >
            <TrendingUp aria-hidden="true" />
            {t("pricing.publishPriceAction")}
          </Button>
        )}
      </div>

      {canOpenTill && (
        <TillAmountDialog
          open={action === "openTill"}
          onOpenChange={(open) => !open && setAction(null)}
          title={t("till.openTill")}
          description={t("till.openDescription")}
          amountLabel={t("till.openingFloat")}
          amountHint={t("till.openingFloatHint")}
          submitLabel={t("till.openTill")}
          allowZero
          saving={openTill.isPending}
          onSubmit={(amount, notes) =>
            openTill.submitAsync({ openingBalance: amount, notes })
          }
        />
      )}
      {canPublishPrice && (
        <PricingDialog
          open={action === "publishPrice"}
          onOpenChange={(open) => !open && setAction(null)}
          currentPrice={currentPrice.data ?? null}
          publishing={publishPrice.isPending}
          onPublish={(request) => publishPrice.submitAsync(request)}
        />
      )}
    </>
  );
}
