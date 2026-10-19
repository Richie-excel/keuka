import { useTranslation } from "react-i18next";
import { Check, Minus, Sparkles } from "lucide-react";
import type { PlanResponse } from "@/api/plans";
import { formatPlanPrice } from "@/features/subscription/plan-price";
import { localizePlan } from "@/features/subscription/localize-plan";

/**
 * One plan, read only — the same body wherever a plan is shown on its own: the
 * catalogue dialog and the company's own "what I am on" card.
 *
 * WHY THE PRICE LEADS: the reader's first question is always "how much", and a
 * detail sheet that buries it under a code and a status answers everything
 * except what was asked.
 *
 * WHY FEATURES AND BENEFITS ARE RENDERED DIFFERENTLY: features are a comparison
 * table flattened into a list — label, value, and whether it is in the plan at
 * all — so each row carries a tick or a dash. Benefits are claims, so they are
 * a plain bulleted list with nothing to tick.
 */
export function PlanDetails({ plan: stored }: { plan: PlanResponse }) {
  const { t, i18n } = useTranslation();
  const plan = localizePlan(stored, i18n.language);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-2xl font-semibold text-cocoa-900">
          {formatPlanPrice(plan.priceAmount, plan.currency)}
        </p>
        <p className="mt-0.5 text-xs text-cocoa-500">
          {t(`plans.billingPeriodShort.${plan.billingPeriod}`)}
        </p>
        {plan.description && (
          <p className="mt-2 text-sm text-cocoa-700">{plan.description}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-cocoa-500">
        <span>
          {t("plans.fields.code")}:{" "}
          <span className="font-medium text-cocoa-700">{plan.code}</span>
        </span>
        <span>
          {t("plans.fields.displayOrder")}:{" "}
          <span className="font-medium text-cocoa-700">{plan.displayOrder}</span>
        </span>
        <span
          className={
            plan.active ? "font-medium text-cocoa-700" : "font-medium text-rust-700"
          }
        >
          {plan.active ? t("plans.status.active") : t("plans.status.inactive")}
        </span>
      </div>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-cocoa-900">
          {t("plans.detail.featuresHeading")}
        </h4>
        {plan.features.length === 0 ? (
          <p className="text-sm text-cocoa-500">{t("plans.detail.noFeatures")}</p>
        ) : (
          <ul className="divide-y divide-cocoa-100 rounded-lg border border-cocoa-100">
            {plan.features.map((feature, index) => (
              <li
                key={index}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  {feature.included ? (
                    <Check
                      className="size-4 shrink-0 text-cocoa-700"
                      aria-hidden="true"
                    />
                  ) : (
                    <Minus
                      className="size-4 shrink-0 text-cocoa-400"
                      aria-hidden="true"
                    />
                  )}
                  <span className={feature.included ? "" : "text-cocoa-500"}>
                    {feature.label}
                  </span>
                  {/* Screen readers get the tick as words, not as a shape. */}
                  <span className="sr-only">
                    {feature.included
                      ? t("plans.detail.included")
                      : t("plans.detail.notIncluded")}
                  </span>
                </span>
                <span
                  className={
                    feature.included
                      ? "font-medium text-cocoa-900"
                      : "text-cocoa-500"
                  }
                >
                  {feature.value}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-cocoa-900">
          {t("plans.detail.benefitsHeading")}
        </h4>
        {plan.benefits.length === 0 ? (
          <p className="text-sm text-cocoa-500">{t("plans.detail.noBenefits")}</p>
        ) : (
          <ul className="space-y-1.5 text-sm text-cocoa-700">
            {plan.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <Sparkles
                  className="mt-0.5 size-4 shrink-0 text-cocoa-500"
                  aria-hidden="true"
                />
                {benefit}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
