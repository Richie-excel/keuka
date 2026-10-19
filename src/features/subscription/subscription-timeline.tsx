import { useTranslation } from "react-i18next";
import type { SubscriptionResponse } from "@/api/subscription";
import { EnterpriseStatus } from "@/enums";
import { cn, formatDate } from "@/lib/utils";

type StageTone = "positive" | "neutral" | "negative";

interface Stage {
  label: string;
  value: string;
  tone: StageTone;
}

const DOT_TONE: Record<StageTone, string> = {
  positive: "bg-pod-500",
  neutral: "bg-cocoa-300",
  negative: "bg-rust-500",
};

/**
 * The subscription's lifecycle as three readable stages.
 *
 * A timeline rather than three more rows in the detail list, because the three
 * dates answer one question — "where is this plan in its life?" — and their
 * order is the point. The colour of the last dot says whether the plan is
 * running or stopped, the same fact the access card states in words.
 */
export function SubscriptionTimeline({
  subscription,
}: {
  subscription: SubscriptionResponse;
}) {
  const { t } = useTranslation();

  const periodValue = subscription.currentPeriodEnd
    ? `${formatDate(subscription.currentPeriodStart)} — ${formatDate(
        subscription.currentPeriodEnd,
      )}`
    : formatDate(subscription.currentPeriodStart);

  const suspended = subscription.tenantStatus === EnterpriseStatus.SUSPENDED;

  const stages: Stage[] = [
    {
      label: t("subscription.timelineStarted"),
      value: formatDate(subscription.startedAt),
      tone: "neutral",
    },
    {
      label: t("subscription.timelinePeriod"),
      value: periodValue,
      tone: "positive",
    },
    {
      label: suspended
        ? t("subscription.timelineSuspended")
        : t("subscription.timelineActive"),
      value: subscription.suspendedAt
        ? formatDate(subscription.suspendedAt)
        : t("subscription.notSuspended"),
      tone: suspended ? "negative" : "positive",
    },
  ];

  return (
    <div>
      <h2 className="text-sm font-semibold text-cocoa-900">
        {t("subscription.timelineHeading")}
      </h2>
      <ol className="mt-4 space-y-5">
        {stages.map((stage, index) => {
          const isLast = index === stages.length - 1;
          return (
            <li key={stage.label} className="relative pl-6">
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="absolute left-[0.3125rem] top-4 h-full w-px bg-cocoa-100"
                />
              )}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-0 top-1 size-2.5 rounded-full",
                  DOT_TONE[stage.tone],
                )}
              />
              <p className="text-xs uppercase tracking-wide text-cocoa-500">
                {stage.label}
              </p>
              <p className="mt-0.5 text-sm font-medium text-cocoa-900">
                {stage.value}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
