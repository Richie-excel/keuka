import { useTranslation } from "react-i18next";
import { Check, Minus } from "lucide-react";
import type { PlanFeature, PlanResponse } from "@/api/plans";
import { formatPlanPrice } from "@/features/subscription/plan-price";
import { localizePlan } from "@/features/subscription/localize-plan";

export function PlanComparison({
  plans,
  highlightCode,
}: {
  plans: PlanResponse[];
  highlightCode?: string;
}) {
  const { t, i18n } = useTranslation();

  if (plans.length === 0) return null;

  // In the reader's language: rows are matched by label, so they must be localized first.
  const ordered = plans.map((plan) => localizePlan(plan, i18n.language)).sort(
    (a, b) =>
      a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
  );

  const featureLabels: string[] = [];
  for (const plan of ordered) {
    for (const feature of plan.features) {
      if (feature.label && !featureLabels.includes(feature.label)) {
        featureLabels.push(feature.label);
      }
    }
  }

  const featureFor = (plan: PlanResponse, label: string) =>
    plan.features.find((feature) => feature.label === label);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr>
            <th
              scope="col"
              className="border-b border-cocoa-100 px-3 py-3 text-left text-xs font-medium text-cocoa-500"
            >
              {t("plans.compare.featureColumn")}
            </th>
            {ordered.map((plan) => {
              const isMine = plan.code === highlightCode;
              return (
                <th
                  key={plan.code}
                  scope="col"
                  className={`min-w-40 border-b border-cocoa-100 px-3 py-3 text-left align-top ${
                    isMine ? "bg-cocoa-50" : ""
                  }`}
                >
                  <span className="block font-semibold text-cocoa-900">
                    {plan.name}
                  </span>
                  <span className="mt-0.5 block text-sm font-medium text-cocoa-700">
                    {formatPlanPrice(plan.priceAmount, plan.currency)}
                  </span>
                  <span className="block text-xs text-cocoa-500">
                    {t(`plans.billingPeriodShort.${plan.billingPeriod}`)}
                  </span>
                  {isMine && (
                    <span className="mt-1 inline-block rounded-full bg-cocoa-900 px-2 py-0.5 text-[0.65rem] font-medium text-white">
                      {t("plans.compare.yourPlan")}
                    </span>
                  )}
                  {!plan.active && (
                    <span className="mt-1 block text-[0.65rem] text-rust-700">
                      {t("plans.status.inactive")}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {featureLabels.length === 0 ? (
            <tr>
              <td
                colSpan={ordered.length + 1}
                className="px-3 py-6 text-center text-cocoa-500"
              >
                {t("plans.compare.noFeatures")}
              </td>
            </tr>
          ) : (
            featureLabels.map((label) => (
              <tr key={label}>
                <th
                  scope="row"
                  className="border-b border-cocoa-100 px-3 py-2.5 text-left font-normal text-cocoa-700"
                >
                  {label}
                </th>
                {ordered.map((plan) => (
                  <td
                    key={plan.code}
                    className={`border-b border-cocoa-100 px-3 py-2.5 align-top ${
                      plan.code === highlightCode ? "bg-cocoa-50" : ""
                    }`}
                  >
                    <FeatureCell feature={featureFor(plan, label)} />
                  </td>
                ))}
              </tr>
            ))
          )}

          <tr>
            <th
              scope="row"
              className="px-3 py-3 text-left align-top font-normal text-cocoa-700"
            >
              {t("plans.compare.benefits")}
            </th>
            {ordered.map((plan) => (
              <td
                key={plan.code}
                className={`px-3 py-3 align-top ${
                  plan.code === highlightCode ? "bg-cocoa-50" : ""
                }`}
              >
                {plan.benefits.length === 0 ? (
                  <span className="text-cocoa-400">—</span>
                ) : (
                  <ul className="space-y-1 text-cocoa-700">
                    {plan.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-1.5">
                        <Check
                          className="mt-0.5 size-3.5 shrink-0 text-cocoa-500"
                          aria-hidden="true"
                        />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function FeatureCell({ feature }: { feature: PlanFeature | undefined }) {
  const { t } = useTranslation();

  if (!feature) {
    return (
      <span className="text-cocoa-400" aria-label={t("plans.compare.notIncluded")}>
        —
      </span>
    );
  }

  return (
    <span className="flex items-start gap-2">
      {feature.included ? (
        <Check className="mt-0.5 size-4 shrink-0 text-cocoa-700" aria-hidden="true" />
      ) : (
        <Minus className="mt-0.5 size-4 shrink-0 text-cocoa-400" aria-hidden="true" />
      )}
      <span className={feature.included ? "text-cocoa-900" : "text-cocoa-500"}>
        {feature.value}
      </span>
      <span className="sr-only">
        {feature.included
          ? t("plans.detail.included")
          : t("plans.detail.notIncluded")}
      </span>
    </span>
  );
}
