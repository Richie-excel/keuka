import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, MotionConfig } from "framer-motion";
import {
  ArrowRight,
  Banknote,
  ClipboardList,
  FileText,
  Handshake,
  History,
  Lock,
  Languages,
  Printer,
  Receipt,
  Scale,
  ShieldCheck,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { APP_FULL_NAME, APP_NAME } from "@/constants";
import { HeroScreenshot } from "./hero-screenshot";

const EASE = [0.22, 1, 0.36, 1] as const;

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  invert = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  invert?: boolean;
}) {
  return (
    <div className="max-w-2xl">
      <p
        className={`text-xs font-semibold tracking-[0.18em] uppercase ${invert ? "text-amber-300" : "text-amber-700"}`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl ${invert ? "text-white" : "text-cocoa-900"}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 text-base leading-7 ${invert ? "text-cocoa-100" : "text-cocoa-500"}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ── Bento card ─────────────────────────────────────────────────────── */

function FeatureCard({
  icon: Icon,
  title,
  text,
  className = "",
  children,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-cocoa-100 bg-white p-6 shadow-[0_1px_2px_rgba(52,25,15,0.04)] transition-shadow hover:shadow-[0_16px_40px_-20px_rgba(52,25,15,0.25)] ${className}`}
    >
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-cocoa-50 text-cocoa-700 ring-1 ring-cocoa-100 transition-colors group-hover:bg-amber-100 group-hover:text-amber-700">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-cocoa-900">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-cocoa-500">{text}</p>
      {children && <div className="mt-6 flex-1">{children}</div>}
    </div>
  );
}

function WeighingVisual() {
  const { t } = useTranslation();
  const rows = [
    ["08:12", "312", "7,5 %", "296"],
    ["11:40", "186", "8,0 %", "177"],
    ["15:05", "250", "7,2 %", "238"],
  ];
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-xl border border-cocoa-100 bg-paper text-xs"
    >
      <div className="grid grid-cols-4 border-b border-cocoa-100 px-4 py-2 font-medium text-cocoa-500">
        <span>{t("documents.receipt.time")}</span>
        <span className="text-right">{t("buyers.history.gross")}</span>
        <span className="text-right">H₂O</span>
        <span className="text-right">{t("buyers.history.net")}</span>
      </div>
      {rows.map(([time, gross, humidity, net]) => (
        <div
          key={time}
          className="grid grid-cols-4 px-4 py-2 text-cocoa-900 tabular-nums"
        >
          <span className="text-cocoa-500">{time}</span>
          <span className="text-right">{gross} kg</span>
          <span className="text-right">{humidity}</span>
          <span className="text-right font-semibold">{net} kg</span>
        </div>
      ))}
      <div className="grid grid-cols-4 border-t border-cocoa-100 bg-white px-4 py-2 font-semibold text-cocoa-900 tabular-nums">
        <span>Σ</span>
        <span className="text-right">748 kg</span>
        <span />
        <span className="text-right text-pod-700">711 kg</span>
      </div>
    </div>
  );
}

function RepaymentVisual() {
  return (
    <div
      aria-hidden="true"
      className="rounded-xl border border-cocoa-100 bg-paper p-4"
    >
      <div className="flex items-baseline justify-between text-xs text-cocoa-500">
        <span>1 600 FCFA/kg</span>
        <span className="font-semibold text-cocoa-900">62 %</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-cocoa-100">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: "62%" }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: EASE }}
          className="h-full rounded-full bg-linear-to-r from-amber-500 to-amber-300"
        />
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

function Home() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const facts = (["ledger", "roles", "print", "lang"] as const).map((key) => ({
    value: t(`home.facts.${key}.value`),
    label: t(`home.facts.${key}.label`),
  }));

  const steps = [
    { key: "weigh", icon: Scale },
    { key: "pay", icon: Banknote },
    { key: "reconcile", icon: ClipboardList },
  ] as const;

  const documents = [
    { key: "receipt", icon: Receipt },
    { key: "prefinance", icon: Handshake },
    { key: "delivery", icon: Truck },
    { key: "till", icon: Wallet },
    { key: "payslip", icon: FileText },
  ] as const;

  return (
    <MotionConfig reducedMotion="user">
      <div className="bg-paper pb-10">
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-8">
          {/* ── Hero ─────────────────────────────────────────────── */}
          <section
            className="relative isolate overflow-hidden rounded-3xl bg-cocoa-900"
            style={{
              backgroundImage: [
                "radial-gradient(60% 70% at 85% 30%, rgba(252,211,77,0.18), transparent 65%)",
                "radial-gradient(45% 60% at 10% 100%, rgba(201,154,124,0.22), transparent 70%)",
              ].join(", "),
            }}
          >
            {/* Fine grid, fading out towards the bottom */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 opacity-[0.12] mask-[radial-gradient(ellipse_at_top,black,transparent_75%)]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />

            <div className="grid items-center gap-14 px-6 pt-14 pb-16 sm:px-10 md:pt-20 lg:grid-cols-12 lg:gap-10 lg:pb-24">
              <div className="lg:col-span-6">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/6 px-3 py-1 text-xs font-medium text-cocoa-100"
                >
                  <span className="size-1.5 rounded-full bg-amber-300" />
                  {t("home.eyebrow")}
                </motion.p>

                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
                  className="mt-6 text-5xl leading-[1.02] font-semibold tracking-tight text-white sm:text-6xl xl:text-7xl"
                >
                  {t("home.titleLine1")}
                  <br />
                  <span className="bg-linear-to-r from-amber-200 via-amber-300 to-cocoa-300 bg-clip-text text-transparent">
                    {t("home.titleLine2")}
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.12 }}
                  className="mt-6 max-w-xl text-lg leading-8 text-cocoa-100"
                >
                  {t("home.subtitle")}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
                  className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
                >
                  {/* whitespace-nowrap + shrink-0: a label never breaks; the buttons wrap as a whole instead. */}
                  <Link
                    to="/login"
                    className="group inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-amber-300 px-6 py-3.5 text-sm font-semibold text-cocoa-900 shadow-[0_12px_32px_-10px_rgba(252,211,77,0.65)] transition hover:bg-amber-200 focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-cocoa-900 focus-visible:outline-none"
                  >
                    <span>{t("home.ctaPrimary")}</span>
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                  <Link
                    to="/offers"
                    className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/6 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
                  >
                    {t("home.ctaPlans")}
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-4 py-3.5 text-sm font-semibold text-cocoa-100 underline-offset-4 transition hover:text-white hover:underline focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
                  >
                    {t("home.ctaSecondary")}
                  </a>
                </motion.div>

                {/* Trust, right under the call to action */}
                <motion.ul
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.35 }}
                  className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-cocoa-100"
                >
                  {[
                    { icon: ShieldCheck, label: t("home.trust.roles") },
                    { icon: History, label: t("home.trust.audit") },
                    { icon: Languages, label: t("home.trust.languages") },
                  ].map(({ icon: Icon, label }) => (
                    <li key={label} className="inline-flex items-center gap-2">
                      <Icon
                        className="size-4 text-amber-300"
                        aria-hidden="true"
                      />
                      {label}
                    </li>
                  ))}
                </motion.ul>
              </div>

              <div className="lg:col-span-6 lg:pl-6">
                <HeroScreenshot />
              </div>
            </div>
          </section>

          {/* ── Facts strip ──────────────────────────────────────── */}
          <section className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-cocoa-100 bg-cocoa-100 lg:grid-cols-4">
            {facts.map((fact, index) => (
              <Reveal
                key={fact.label}
                delay={index * 0.06}
                className="bg-white px-6 py-6"
              >
                <p className="text-2xl font-semibold tracking-tight text-cocoa-900">
                  {fact.value}
                </p>
                <p className="mt-1 text-sm text-cocoa-500">{fact.label}</p>
              </Reveal>
            ))}
          </section>

          {/* ── Features (bento) ─────────────────────────────────── */}
          <section id="features" className="scroll-mt-6 pt-24 md:pt-32">
            <Reveal>
              <SectionHeading
                eyebrow={t("home.features.eyebrow")}
                title={t("home.features.title")}
                subtitle={t("home.features.subtitle")}
              />
            </Reveal>

            <div className="mt-12 grid gap-4 md:grid-cols-6">
              <Reveal className="md:col-span-4">
                <FeatureCard
                  icon={Scale}
                  title={t("home.features.purchases.title")}
                  text={t("home.features.purchases.text")}
                  className="h-full"
                >
                  <WeighingVisual />
                </FeatureCard>
              </Reveal>
              <Reveal delay={0.06} className="md:col-span-2">
                <FeatureCard
                  icon={Handshake}
                  title={t("home.features.prefinance.title")}
                  text={t("home.features.prefinance.text")}
                  className="h-full"
                >
                  <RepaymentVisual />
                </FeatureCard>
              </Reveal>
              <Reveal className="md:col-span-2">
                <FeatureCard
                  icon={Wallet}
                  title={t("home.features.till.title")}
                  text={t("home.features.till.text")}
                  className="h-full"
                />
              </Reveal>
              <Reveal delay={0.06} className="md:col-span-2">
                <FeatureCard
                  icon={Truck}
                  title={t("home.features.stock.title")}
                  text={t("home.features.stock.text")}
                  className="h-full"
                />
              </Reveal>
              <Reveal delay={0.12} className="md:col-span-2">
                <FeatureCard
                  icon={ClipboardList}
                  title={t("home.features.payroll.title")}
                  text={t("home.features.payroll.text")}
                  className="h-full"
                />
              </Reveal>
              <Reveal className="md:col-span-6">
                <div className="relative overflow-hidden rounded-2xl bg-cocoa-900 p-8 sm:p-10">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-60"
                    style={{
                      backgroundImage:
                        "radial-gradient(50% 120% at 100% 0%, rgba(252,211,77,0.16), transparent 60%)",
                    }}
                  />
                  <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
                    <div>
                      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white/10 text-amber-300">
                        <Lock className="size-5" aria-hidden="true" />
                      </span>
                      <h3 className="mt-5 text-2xl font-semibold tracking-tight text-white">
                        {t("home.features.control.title")}
                      </h3>
                      <p className="mt-3 max-w-md text-sm leading-6 text-cocoa-100">
                        {t("home.features.control.text")}
                      </p>
                    </div>
                    <ul
                      aria-hidden="true"
                      className="space-y-2 font-mono text-xs"
                    >
                      {/* A sample of the audit log, in the reader's language. */}
                      {[
                        ["08:12", "purchaseCreated", "m.tchami"],
                        [
                          "09:40",
                          "paymentRecorded",
                          t("home.features.control.log.cashier"),
                        ],
                        [
                          "16:50",
                          "tillClosed",
                          t("home.features.control.log.cashier"),
                        ],
                        [
                          "17:05",
                          "paymentVoided",
                          t("home.features.control.log.boss"),
                        ],
                      ].map(([time, event, who]) => (
                        <li
                          key={event}
                          className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/4 px-4 py-2.5 text-cocoa-100"
                        >
                          <span className="text-cocoa-300">{time}</span>
                          <span className="flex-1 truncate text-white">
                            {t(`home.features.control.log.${event}`)}
                          </span>
                          <span className="text-amber-200">{who}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── How it works ─────────────────────────────────────── */}
          <section className="pt-24 md:pt-32">
            <Reveal>
              <SectionHeading
                eyebrow={t("home.steps.eyebrow")}
                title={t("home.steps.title")}
              />
            </Reveal>
            <ol className="mt-12 grid gap-4 md:grid-cols-3">
              {steps.map(({ key, icon: Icon }, index) => (
                <Reveal key={key} delay={index * 0.08}>
                  <li className="relative h-full rounded-2xl border border-cocoa-100 bg-white p-6">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="text-5xl font-semibold tracking-tighter text-cocoa-100 tabular-nums">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold tracking-tight text-cocoa-900">
                      {t(`home.steps.${key}.title`)}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-cocoa-500">
                      {t(`home.steps.${key}.text`)}
                    </p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </section>

          {/* ── Documents ────────────────────────────────────────── */}
          <section className="pt-24 md:pt-32">
            <div className="grid gap-10 rounded-3xl border border-cocoa-100 bg-white p-8 sm:p-12 lg:grid-cols-12 lg:items-center">
              <Reveal className="lg:col-span-5">
                <SectionHeading
                  eyebrow={t("home.documents.eyebrow")}
                  title={t("home.documents.title")}
                  subtitle={t("home.documents.subtitle")}
                />
              </Reveal>
              <ul className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
                {documents.map(({ key, icon: Icon }, index) => (
                  <Reveal key={key} delay={index * 0.05}>
                    <li className="flex items-center gap-4 rounded-xl border border-cocoa-100 bg-paper px-5 py-4">
                      <span className="inline-flex size-9 items-center justify-center rounded-lg bg-white text-cocoa-700 ring-1 ring-cocoa-100">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="flex-1 text-sm font-medium text-cocoa-900">
                        {t(`home.documents.${key}`)}
                      </span>
                      <Printer
                        className="size-4 text-cocoa-300"
                        aria-hidden="true"
                      />
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>
          </section>

          {/* ── Final call to action ─────────────────────────────── */}
          <section className="pt-24 md:pt-32">
            <Reveal>
              <div
                className="relative overflow-hidden rounded-3xl bg-cocoa-900 px-6 py-16 text-center sm:px-12"
                style={{
                  backgroundImage:
                    "radial-gradient(60% 100% at 50% 0%, rgba(252,211,77,0.2), transparent 70%)",
                }}
              >
                <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
                  {t("home.final.title")}
                </h2>
                <p className="mx-auto mt-4 max-w-md text-base text-cocoa-100">
                  {t("home.final.text")}
                </p>
                <Link
                  to="/login"
                  className="group mt-9 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-7 py-3.5 text-sm font-semibold text-cocoa-900 shadow-[0_12px_32px_-10px_rgba(252,211,77,0.65)] transition hover:bg-amber-200 focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-cocoa-900 focus-visible:outline-none"
                >
                  {t("home.final.cta")}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
                <p className="mt-4">
                  <Link
                    to="/offers"
                    className="text-sm font-medium text-amber-200 underline-offset-4 hover:underline"
                  >
                    {t("home.final.seePlans")}
                  </Link>
                </p>
              </div>
            </Reveal>
          </section>

          {/* ── Footer ───────────────────────────────────────────── */}
          <footer className="mt-10 flex flex-col gap-4 border-t border-cocoa-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/cocoa.svg"
                alt=""
                className="size-8 rounded-lg bg-cocoa-700 p-1"
              />
              <div>
                <p className="text-sm font-semibold text-cocoa-900">
                  {APP_NAME}
                </p>
                <p className="text-xs text-cocoa-500">{APP_FULL_NAME}</p>
              </div>
            </div>
            <div className="text-xs text-cocoa-500 sm:text-right">
              <p>{t("home.footer.illustrative")}</p>
              <p className="mt-1">
                &copy; {year} {APP_NAME}. {t("home.footer.rights")}
              </p>
            </div>
          </footer>
        </div>
      </div>
    </MotionConfig>
  );
}

export default Home;
