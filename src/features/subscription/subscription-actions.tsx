import { useTranslation } from "react-i18next";
import { CircleCheck, ShieldAlert } from "lucide-react";
import type { SubscriptionResponse } from "@/api/subscription";
import { EnterpriseStatus, SubscriptionStatus } from "@/enums";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useConfirm } from "@/shared/hooks/use-confirm";
import {
  useActivateSubscription,
  useSuspendSubscription,
} from "@/shared/hooks/use-subscription";

/** The plan states that grant operational access. Only these get a Suspend. */
const OPERATIONAL_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.TRIAL,
  SubscriptionStatus.ACTIVE,
];

/**
 * Activate / suspend the current subscription.
 *
 * Rendered only for holders of the `SYSTEM_ADMIN` role — the same authority the
 * backend's `@PreAuthorize("hasRole('SYSTEM_ADMIN')")` enforces — so the UI
 * never offers a button the server would reject.
 *
 * A CLOSED tenant has no toggle: the backend's activate would reopen it, and
 * closing is a deliberate end-of-life action that this screen should not undo
 * with a single click.
 */
export function SubscriptionActions({
  subscription,
  canManage,
}: {
  subscription: SubscriptionResponse;
  canManage: boolean;
}) {
  const { t } = useTranslation();
  const { ask, dialogProps } = useConfirm();
  const activate = useActivateSubscription();
  const suspend = useSuspendSubscription();

  if (!canManage) return null;

  const busy = activate.isPending || suspend.isPending;
  const error = activate.error ?? suspend.error;
  const isOperational = OPERATIONAL_STATUSES.includes(
    subscription.subscriptionStatus,
  );

  if (subscription.tenantStatus === EnterpriseStatus.CLOSED) {
    return (
      <p className="text-sm text-cocoa-500">
        {t("subscription.closedNotice")}
      </p>
    );
  }

  function confirmSuspend() {
    ask({
      title: t("subscription.suspendTitle"),
      description: t("subscription.suspendDescription", {
        company: subscription.displayName,
      }),
      confirmLabel: t("subscription.suspend"),
      tone: "destructive",
      icon: ShieldAlert,
      onConfirm: async () => {
        await suspend.mutateAsync();
      },
    });
  }

  function confirmActivate() {
    ask({
      title: t("subscription.activateTitle"),
      description: t("subscription.activateDescription", {
        company: subscription.displayName,
      }),
      confirmLabel: t("subscription.activate"),
      icon: CircleCheck,
      onConfirm: async () => {
        await activate.mutateAsync();
      },
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        {isOperational ? (
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={confirmSuspend}
          >
            <ShieldAlert />
            {t("subscription.suspend")}
          </Button>
        ) : (
          <Button type="button" disabled={busy} onClick={confirmActivate}>
            <CircleCheck />
            {t("subscription.activate")}
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
