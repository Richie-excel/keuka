import type { TFunction } from "i18next";

/**
 * How a category reads: a default one (with a code such as FUEL) in the
 * reader's language, a company's own one by the name it was given.
 */
export function expenseCategoryLabel(
  t: TFunction,
  code: string | null | undefined,
  name: string | null | undefined,
): string {
  if (code) return t(`expenses.categories.${code}`, { defaultValue: name ?? code });
  return name ?? "—";
}
