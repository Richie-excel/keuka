import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Printer } from "lucide-react";

/** Illustrative only — the footer says so. */
const WEEK = [42, 58, 49, 71, 64, 88, 76];
const ROWS: { initials: string; name: string; kg: string; amount: string; status: "paid" | "part" | "offset" }[] = [
  { initials: "AN", name: "Amina Ngo", kg: "312 kg", amount: "468 000", status: "paid" },
  { initials: "JB", name: "Jean Bekolo", kg: "1 250 kg", amount: "1 875 000", status: "offset" },
  { initials: "MT", name: "Marie Tchami", kg: "186 kg", amount: "279 000", status: "part" },
];

const STATUS_STYLE = {
  paid: "bg-pod-500/15 text-pod-100",
  part: "bg-amber-300/15 text-amber-200",
  offset: "bg-white/10 text-cocoa-100",
} as const;

/**
 * The hero's product preview: a stylised "today's purchases" panel in the
 * app's own colours. Built from markup rather than a screenshot, so it stays
 * crisp, translates, and never shows a real customer's data.
 */
export function HomeMockup() {
  const { t } = useTranslation();
  const statusLabel = {
    paid: t("home.mock.paidStatus"),
    part: t("home.mock.partStatus"),
    offset: t("home.mock.offsetStatus"),
  };

  return (
    <div aria-hidden="true" className="relative">
      {/* Soft glow behind the panel */}
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-amber-300/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-5"
      >
        {/* Window chrome */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-2.5 py-1 text-[11px] font-medium text-cocoa-100">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pod-100 opacity-70 motion-reduce:animate-none" />
              <span className="relative inline-flex size-1.5 rounded-full bg-pod-100" />
            </span>
            {t("home.mock.live")}
          </span>
        </div>

        <p className="mt-4 text-sm font-medium text-white">{t("home.mock.title")}</p>

        {/* Stat tiles */}
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {[
            { label: t("home.mock.bought"), value: "1 748", unit: "kg" },
            { label: t("home.mock.paid"), value: "2,62", unit: "M FCFA" },
            { label: t("home.mock.till"), value: "482 500", unit: "FCFA" },
          ].map((tile) => (
            <div key={tile.label} className="rounded-xl border border-white/10 bg-black/15 p-3">
              <p className="truncate text-[11px] text-cocoa-300">{tile.label}</p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-white tabular-nums sm:text-xl">
                {tile.value}
                <span className="ml-1 text-[10px] font-medium text-cocoa-300">{tile.unit}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Week chart */}
        <div className="mt-3 rounded-xl border border-white/10 bg-black/15 p-3">
          <p className="text-[11px] text-cocoa-300">{t("home.mock.week")}</p>
          <div className="mt-2 flex h-20 items-end gap-2">
            {WEEK.map((value, index) => (
              <motion.span
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${value}%` }}
                transition={{ duration: 0.8, delay: 0.35 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className={`flex-1 rounded-t-md ${
                  index === WEEK.length - 2 ? "bg-amber-300" : "bg-gradient-to-t from-white/10 to-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Recent deliveries */}
        <div className="mt-3 rounded-xl border border-white/10 bg-black/15">
          <p className="px-3 pt-3 text-[11px] text-cocoa-300">{t("home.mock.recent")}</p>
          <ul className="mt-1 divide-y divide-white/[0.06]">
            {ROWS.map((row) => (
              <li key={row.name} className="flex items-center gap-3 px-3 py-2.5">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-300/20 text-[10px] font-semibold text-amber-200">
                  {row.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-white">{row.name}</span>
                  <span className="block text-[11px] text-cocoa-300 tabular-nums">{row.kg}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[row.status]}`}>
                  {statusLabel[row.status]}
                </span>
                <span className="w-20 text-right text-xs font-semibold text-white tabular-nums">{row.amount}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Floating receipt toast */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -bottom-6 -left-4 hidden items-center gap-3 rounded-xl border border-cocoa-100 bg-white px-4 py-3 shadow-xl sm:flex"
      >
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-pod-100 text-pod-700">
          <CheckCircle2 className="size-4" />
        </span>
        <span>
          <span className="block text-xs font-semibold text-cocoa-900">{t("home.mock.receipt")}</span>
          <span className="flex items-center gap-1 text-[11px] text-cocoa-500">
            <Printer className="size-3" />
            {t("home.mock.receiptNo")}
          </span>
        </span>
      </motion.div>
    </div>
  );
}
