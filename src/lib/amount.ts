
export function parseAmount(value: string): number {
  return Number(value.trim().replace(",", "."));
}

export function isPositiveAmount(value: string): boolean {
  if (value.trim() === "") return false;
  const amount = parseAmount(value);
  return Number.isFinite(amount) && amount > 0;
}

export function sanitizeAmountInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.,]/g, "");
  const match = cleaned.match(/^(\d*)([.,]?)(\d{0,2})/);
  return match ? match[1] + match[2] + match[3] : "";
}