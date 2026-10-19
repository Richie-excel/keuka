import type { PlanFeature, PlanResponse } from "@/api/plans";

/**
 * A plan's texts in the reader's language. The plain fields are the English
 * (default) text; the *Fr ones are the French. Whatever is not translated
 * falls back to English, so a plan written in one language still reads.
 */
export function localizePlan(plan: PlanResponse, language: string | undefined): PlanResponse {
  if (!language?.startsWith("fr")) return plan;
  const benefitsFr = plan.benefitsFr?.filter((benefit) => benefit.trim() !== "") ?? [];
  return {
    ...plan,
    name: plan.nameFr?.trim() || plan.name,
    description: plan.descriptionFr?.trim() || plan.description,
    benefits: benefitsFr.length > 0 ? benefitsFr : plan.benefits,
    features: plan.features.map(localizeFeature),
  };
}

function localizeFeature(feature: PlanFeature): PlanFeature {
  return {
    ...feature,
    label: feature.labelFr?.trim() || feature.label,
    value: feature.valueFr?.trim() || feature.value,
  };
}
