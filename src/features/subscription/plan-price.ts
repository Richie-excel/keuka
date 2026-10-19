import { appLocale } from "@/lib/utils";

/**
 * How a plan's price is written, everywhere it is written on the subscription
 * surfaces: the editor's preview, the catalogue register, the plan detail and
 * the comparison table.
 *
 * WHY NOT `formatMoney`: that helper hard-codes XAF because every other money
 * field in this app is a cocoa price in the local currency. A plan carries its
 * own `currency` on the wire, so formatting it as XAF would mislabel a plan
 * priced in anything else — the one number a customer is being asked to trust.
 */
export function formatPlanPrice(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat(appLocale(), {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} ${currency.trim() || "XAF"}`;
}
