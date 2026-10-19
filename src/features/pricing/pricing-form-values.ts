import { dateToInstant } from "@/lib/utils";
import { parseAmount } from "@/lib/amount";
import type { CreateCocoaPriceRequest } from "@/interfaces";

/**
 * The price form's vocabulary, kept out of the component file so that
 * `pricing-form.tsx` exports components only (React Fast Refresh only works
 * that way) and so the rules below can be read — and tested — without React.
 */

export interface PricingFormValues {
  /** Kept as the typed string so a half-finished "1500." is never coerced to a number. */
  pricePerKg: string;
  /** ISO `yyyy-MM-dd`, or "" for "from today" — the server's own default. */
  effectiveFrom: string;
}

export function emptyPricingFormValues(): PricingFormValues {
  return { pricePerKg: "", effectiveFrom: "" };
}

/**
 * A price the server will accept.
 *
 * Mirrors the server's own rule (a positive `BigDecimal`), so a malformed number
 * is caught at the keyboard rather than as a `VALIDATION_FAILED` round trip. No
 * ceiling is invented here because the backend publishes none.
 */
export function isValidPricePerKg(value: string): boolean {
  if (value.trim() === "") return false;
  const amount = parseAmount(value);
  return Number.isFinite(amount) && amount > 0;
}

/**
 * The wire payload.
 *
 * `currency` is deliberately NOT sent: the tenant has one currency and the
 * server owns it, so a picker here would let the client drift a value the rest
 * of the system already assumes. `effectiveFrom` is omitted rather than sent
 * empty, so the server applies its own "now".
 */
export function buildPublishRequest(
  values: PricingFormValues,
): CreateCocoaPriceRequest {
  return {
    pricePerKg: parseAmount(values.pricePerKg),
    ...(values.effectiveFrom
      ? { effectiveFrom: dateToInstant(values.effectiveFrom, "startOfDay") }
      : {}),
  };
}
