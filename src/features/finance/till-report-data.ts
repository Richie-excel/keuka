import type { TFunction } from "i18next";
import { formatDateTime } from "@/lib/utils";
import {
  formatDocumentNo,
  type TillReportData,
  type TillReportLine,
} from "@/components/documents/types";
import { CashMovementType, CashSessionStatus } from "@/enums";
import type { CashSessionResponse, CashTransactionResponse } from "@/interfaces";

const PROVISION = "PROVISION";

/** A till session as its printed report. Every figure is the server's. */
export function toTillReportData(session: CashSessionResponse, t: TFunction): TillReportData {
  const isOpen = session.status === CashSessionStatus.OPEN;
  const movements = [...(session.transactions ?? [])].sort((a, b) =>
    a.occurredAt.localeCompare(b.occurredAt),
  );
  const typeLabel = (tx: CashTransactionResponse) =>
    t(`till.referenceTypes.${tx.referenceType ?? "OTHER"}`, tx.referenceType ?? "—");
  const line = (tx: CashTransactionResponse): TillReportLine => ({
    when: formatDateTime(tx.occurredAt),
    label: typeLabel(tx),
    description: tx.description,
    amount: tx.movementType === CashMovementType.IN ? tx.amount : -tx.amount,
  });

  const provisions = movements.filter((tx) => tx.referenceType === PROVISION);
  const payouts = movements.filter((tx) => tx.movementType === CashMovementType.OUT);

  const byType = new Map<string, { label: string; count: number; amount: number }>();
  for (const tx of payouts) {
    const label = typeLabel(tx);
    const row = byType.get(label) ?? { label, count: 0, amount: 0 };
    row.count += 1;
    row.amount += tx.amount;
    byType.set(label, row);
  }

  return {
    reportNo: formatDocumentNo("CS", session.id, session.openedAt),
    cashierName: session.openedByName ?? "—",
    openedAt: formatDateTime(session.openedAt),
    closedAt: session.closedAt ? formatDateTime(session.closedAt) : undefined,
    closedByName: session.closedByName ?? undefined,
    isOpen,
    openingBalance: session.openingBalance,
    provisions: provisions.map(line),
    payoutsByType: [...byType.values()],
    totalProvisions: provisions.reduce((sum, tx) => sum + tx.amount, 0),
    totalPayouts: payouts.reduce((sum, tx) => sum + tx.amount, 0),
    expected: isOpen ? session.availableBalance : (session.expectedClosing ?? session.availableBalance),
    declared: session.declaredClosing ?? undefined,
    variance: session.variance ?? undefined,
    movements: movements.map(line),
    notes: session.notes,
    reference: session.id,
  };
}
