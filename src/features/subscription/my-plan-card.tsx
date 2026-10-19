import { useTranslation } from "react-i18next";
import { Info, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/loader";
import { usePlans } from "@/shared/hooks/use-plans";
import { LOOKUP_PAGE_SIZE } from "@/constants";
import { useApiErrorMessage } from "@/shared/hooks/use-api-error-message";
import { PlanComparison } from "@/features/subscription/plan-comparison";
import { PlanDetails } from "@/features/subscription/plan-details";


export function MyPlanCard({ planCode }: { planCode: string }) {
  const { t } = useTranslation();
  const plans = usePlans({ page: 1, size: LOOKUP_PAGE_SIZE });
  const errorMessage = useApiErrorMessage(plans.error);

  const catalogue = plans.data?.content ?? [];
  const current = catalogue.find((plan) => plan.code === planCode);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("plans.mine.heading")}</CardTitle>
        <p className="text-xs text-cocoa-500">{t("plans.mine.description")}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {plans.isPending ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-14 h-14" />
          </div>
        ) : plans.isError ? (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        ) : catalogue.length === 0 ? (
          <p className="flex items-start gap-2 rounded-md bg-amber-100 px-3 py-2.5 text-xs text-amber-700">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {t("plans.mine.noCatalogue")}
          </p>
        ) : current ? (
          <PlanDetails plan={current} />
        ) : (
          <p className="flex items-start gap-2 rounded-md bg-amber-100 px-3 py-2.5 text-xs text-amber-700">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {t("plans.mine.unknownPlan", { code: planCode })}
          </p>
        )}

        {catalogue.length > 1 && (
          <section className="space-y-2 border-t border-cocoa-100 pt-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-cocoa-900">
              <Sparkles className="size-4 text-cocoa-500" aria-hidden="true" />
              {t("plans.compare.heading")}
            </h3>
            <p className="max-w-2xl text-xs text-cocoa-500">
              {t("plans.compare.description")}
            </p>
            <PlanComparison plans={catalogue} highlightCode={planCode} />
          </section>
        )}
      </CardContent>
    </Card>
  );
}
