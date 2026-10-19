import { PrefinanceStatus } from "@/enums";
import type { PrefinanceResponse } from "@/interfaces";

export interface SettlementPreview {
  /** The agreed price the purchase is bought at (the last advance repaid). */
  unitPrice: number;
  /** Kg of the purchase that repay prefinances. */
  settledKg: number;
  /** Value of those kg, at each advance's agreed price. */
  settledValue: number;
  /** Whole purchase value. */
  total: number;
  /** What is left to pay the buyer in cash once the offset is applied. */
  toPay: number;
}

const round = (value: number, places: number) =>
  Math.round(value * 10 ** places) / 10 ** places;

/**
 * PREVIEW ONLY — mirrors `PurchaseService.create` / `settleFromPurchase` on the
 * server, which decide the real amounts.
 *
 * A buyer with an open advance is bought entirely at the agreed price, even
 * beyond what they owe. The purchase repays advances oldest first, each at its
 * own price; the surplus takes the price of the last advance repaid. A buyer
 * who owes nothing is still bought at their latest advance's price. Returns
 * `undefined` only for a buyer never prefinanced (priced at the current price).
 */
export function previewPrefinanceSettlement(
  prefinances: PrefinanceResponse[],
  netKg: number,
): SettlementPreview | undefined {
  const owing = prefinances
    .filter(
      (p) =>
        (p.status === PrefinanceStatus.OPEN ||
          p.status === PrefinanceStatus.PARTIALLY_SETTLED) &&
        p.outstandingAdvance > 0,
    )
    .sort((a, b) => a.advanceDate.localeCompare(b.advanceDate));

  let remainingKg = netKg;
  let settledKg = 0;
  let settledValue = 0;
  const prices: number[] = [];

  for (const prefinance of owing) {
    if (remainingKg <= 0) break;
    const price = prefinance.historicalUnitPrice;
    let kg = remainingKg;
    let value = round(kg * price, 2);
    if (value >= prefinance.outstandingAdvance) {
      value = prefinance.outstandingAdvance;
      kg = Math.min(remainingKg, round(value / price, 3));
    }
    prices.push(price);
    settledKg += kg;
    settledValue += value;
    remainingKg -= kg;
  }

  if (prices.length === 0) {
    // Nothing owed: still bought at the price of their latest advance.
    const latest = [...prefinances].sort((a, b) => b.advanceDate.localeCompare(a.advanceDate))[0];
    if (!latest) return undefined;
    const total = round(netKg * latest.historicalUnitPrice, 2);
    return { unitPrice: latest.historicalUnitPrice, settledKg: 0, settledValue: 0, total, toPay: total };
  }

  const unitPrice = prices[prices.length - 1];
  const onePrice = prices.every((price) => price === unitPrice);
  const total = onePrice
    ? round(netKg * unitPrice, 2)
    : round(settledValue + Math.max(remainingKg, 0) * unitPrice, 2);
  return { unitPrice, settledKg, settledValue, total, toPay: round(total - settledValue, 2) };
}
