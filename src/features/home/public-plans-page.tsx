import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Gift,
  ShieldCheck,
  Smartphone,
  Sprout,
  Star,
} from "lucide-react";
import type { PlanResponse } from "@/api/plans";
import Loader from "@/components/loader";
import { APP_NAME } from "@/constants";
import { cn, formatMoney } from "@/lib/utils";
import { usePublicPlans } from "@/shared/hooks/use-plans";
import { PlanComparison } from "@/features/subscription/plan-comparison";
import { localizePlan } from "@/features/subscription/localize-plan";

/** The plan most companies should land on: marked so on the page. */
const RECOMMENDED_TIER = "PRO";

interface PlanTheme {
  icon: typeof Sprout;
  /** The card's coloured top: background, title and price colours. */
  header: string;
  description: string;
  period: string;
  iconBox: string;
  border: string;
  check: string;
  button: string;
  badge: string;
}

/**
 * One colour per tier, so the plans tell apart at a glance: green for the
 * starter, gold for the recommended one, dark cocoa for the top tier.
 */
const PLAN_THEMES: Record<string, PlanTheme> = {
  ESSENTIEL: {
    icon: Sprout,
    header: "bg-pod-100 text-pod-700",
    description: "text-pod-700/80",
    period: "text-pod-700/70",
    iconBox: "bg-pod-700 text-white",
    border: "border-pod-500/40",
    check: "text-pod-700",
    button: "bg-pod-700 text-white hover:bg-pod-500",
    badge: "bg-pod-700 text-white",
  },
  PRO: {
    icon: Star,
    header: "bg-amber-300 text-cocoa-900",
    description: "text-cocoa-700",
    period: "text-cocoa-700",
    iconBox: "bg-cocoa-900 text-amber-300",
    border: "border-amber-500",
    check: "text-amber-700",
    button: "bg-amber-300 text-cocoa-900 hover:bg-amber-200",
    badge: "bg-cocoa-900 text-amber-300",
  },
  ENTREPRISE: {
    icon: Building2,
    header: "bg-cocoa-900 text-white",
    description: "text-cocoa-100",
    period: "text-cocoa-300",
    iconBox: "bg-amber-300 text-cocoa-900",
    border: "border-cocoa-700",
    check: "text-cocoa-700",
    button: "bg-cocoa-900 text-white hover:bg-cocoa-700",
    badge: "bg-amber-300 text-cocoa-900",
  },
};

/** Tiers the catalogue may add later fall back on these, in display order. */
const FALLBACK_THEMES = [PLAN_THEMES.ESSENTIEL, PLAN_THEMES.PRO, PLAN_THEMES.ENTREPRISE];

function planTheme(plan: PlanResponse, index: number): PlanTheme {
  return (plan.tier && PLAN_THEMES[plan.tier]) || FALLBACK_THEMES[index % FALLBACK_THEMES.length];
}

/**
 * The public price list, linked from the home page: no sign-in. Plans come
 * from the server's catalogue, so a price changed by the platform
 * administrator shows here at once. Each card says what the plan adds over the
 * one before; the table below compares every detail.
 */
export function PublicPlansPage() {
  const { t, i18n } = useTranslation();
  const query = usePublicPlans();
  const stored = query.data ?? [];
  const plans = stored.map((plan) => localizePlan(plan, i18n.language));
  const trial = plans.find((plan) => plan.trialDays != null);
  const paid = plans
    .filter((plan) => plan.trialDays == null)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.priceAmount - b.priceAmount);

  return (
    <div className="min-h-svh bg-paper text-cocoa-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <img src="/cocoa.svg" alt="" className="size-8 rounded-lg bg-cocoa-700 p-1" />
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-cocoa-700 hover:bg-cocoa-100 sm:inline-flex"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("home.plans.back")}
          </Link>
          <Link
            to="/login"
            className="rounded-lg bg-cocoa-900 px-4 py-2 text-sm font-semibold text-white hover:bg-cocoa-700"
          >
            {t("home.plans.signIn")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <section className="mx-auto max-w-2xl py-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {t("home.plans.title")}
          </h1>
          <p className="mt-4 text-base text-cocoa-600">{t("home.plans.subtitle")}</p>
        </section>

        {query.isPending ? (
          <div className="flex justify-center py-16">
            <Loader className="size-10" />
          </div>
        ) : query.isError || paid.length === 0 ? (
          <p role="alert" className="py-16 text-center text-sm text-cocoa-600">
            {t("home.plans.unavailable")}
          </p>
        ) : (
          <>
            {trial && (
              <div className="mx-auto mb-8 flex max-w-3xl flex-col items-center gap-3 rounded-2xl border border-amber-300 bg-amber-100/60 px-5 py-4 text-center sm:flex-row sm:text-left">
                <Gift className="size-8 shrink-0 text-amber-700" aria-hidden="true" />
                <div className="flex-1">
                  <p className="font-semibold">{t("home.plans.trialTitle", { days: trial.trialDays })}</p>
                  <p className="text-sm text-cocoa-700">{t("home.plans.trialText")}</p>
                </div>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-3">
              {paid.map((plan, index) => (
                <PlanCard
                  key={plan.code}
                  plan={plan}
                  theme={planTheme(plan, index)}
                  recommended={plan.tier === RECOMMENDED_TIER}
                />
              ))}
            </div>

            <section className="mt-14">
              <h2 className="mb-4 text-xl font-semibold">{t("home.plans.compareTitle")}</h2>
              <div className="rounded-2xl border border-cocoa-100 bg-white p-2 sm:p-4">
                <PlanComparison plans={stored.filter((plan) => plan.trialDays == null)} />
              </div>
            </section>

            <section className="mt-12 grid gap-4 sm:grid-cols-2">
              <Reassurance icon={ShieldCheck} title={t("home.plans.safeTitle")} text={t("home.plans.safeText")} />
              <Reassurance icon={Smartphone} title={t("home.plans.payTitle")} text={t("home.plans.payText")} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function PlanCard({
  plan,
  theme,
  recommended,
}: {
  plan: PlanResponse;
  theme: PlanTheme;
  recommended: boolean;
}) {
  const { t } = useTranslation();
  const monthly = Math.round(plan.priceAmount / 12 / 100) * 100;
  const Icon = theme.icon;

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-2xl border-2 bg-white",
        theme.border,
        recommended && "shadow-[0_20px_50px_-20px_rgba(60,30,10,0.45)] md:-translate-y-2",
      )}
    >
      {recommended && (
        <span
          className={cn(
            "absolute -top-3 left-6 z-10 rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
            theme.badge,
          )}
        >
          {t("home.plans.recommended")}
        </span>
      )}

      <div className={cn("rounded-t-[0.875rem] px-6 pt-7 pb-5", theme.header)}>
        <div className="flex items-center gap-3">
          <span className={cn("flex size-9 items-center justify-center rounded-lg", theme.iconBox)}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold">{plan.name}</h2>
        </div>
        {plan.description && <p className={cn("mt-2 text-sm", theme.description)}>{plan.description}</p>}

        <p className="mt-5">
          <span className="text-3xl font-semibold tabular-nums">{formatMoney(plan.priceAmount)}</span>
          <span className={cn("ml-1 text-sm", theme.period)}>
            {t(`plans.billingPeriodShort.${plan.billingPeriod}`)}
          </span>
        </p>
        {plan.billingPeriod === "YEARLY" && plan.priceAmount > 0 && (
          <p className={cn("text-sm", theme.period)}>
            {t("home.plans.perMonth", { amount: formatMoney(monthly) })}
          </p>
        )}
      </div>

      <ul className="flex-1 space-y-2.5 px-6 pt-6 text-sm">
        {plan.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2">
            <Check className={cn("mt-0.5 size-4 shrink-0", theme.check)} aria-hidden="true" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <Link
        to="/login"
        className={cn(
          "group m-6 mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition",
          theme.button,
        )}
      >
        {t("home.plans.choose")}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </article>
  );
}

function Reassurance({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-cocoa-100 bg-white p-5">
      <Icon className="size-6 shrink-0 text-cocoa-700" aria-hidden="true" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-cocoa-600">{text}</p>
      </div>
    </div>
  );
}
