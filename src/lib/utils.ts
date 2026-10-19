import type { PageItem } from '@/components/pagination'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import i18n from 'i18next'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const moneyFormat = new Intl.NumberFormat("fr-CM", {
  style: "currency",
  currency: "XAF",
  maximumFractionDigits: 0,
});
const weightFormat = new Intl.NumberFormat("fr-CM");
 
/** A formatted amount split into the number and its unit, so the two can be styled apart. */
export interface AmountParts {
  value: string;
  unit: string;
}
 
export function formatMoneyParts(amount: number): AmountParts {
  let value = "";
  let unit = "";
  for (const part of moneyFormat.formatToParts(amount)) {
    // In fr-CM the currency comes after the number, with a space between them.
    // Everything that is not the currency (digits, group separators, minus sign) is the value.
    if (part.type === "currency") unit = part.value;
    else value += part.value;
  }
  return { value: value.trim(), unit };
}
 
export function formatWeightParts(kg: number | null | undefined): AmountParts {
  // The old version asserted `kg!` and printed "NaN kg" for a missing weight.
  if (kg == null) return { value: "—", unit: "" };
  return { value: weightFormat.format(kg), unit: "kg" };
}
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatWeight(kg: number | null | undefined): string {
  return `${new Intl.NumberFormat('fr-CM').format(kg!)} kg`
}

function normalizeAndTake(value: string, maxLength: number): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, maxLength);
}

export function deriveCompanyCode(
  legalName: string,
  displayName: string,
  createdAt = Date.now(),
): string {
  const legalPart = normalizeAndTake(legalName, 3);
  const displayPart = normalizeAndTake(displayName, 3);
  const timeCode = createdAt.toString(36).slice(-4);

  if (!legalPart && !displayPart) return '';

  return [legalPart, displayPart, normalizeAndTake(timeCode, 3)]
    .filter(Boolean)
    .join('');
}

export function deriveWarehouseCode(
  legalName: string,
  displayName: string,
  warehouseName: string,
  createdAt = Date.now(),
): string {
  const legalPart = normalizeAndTake(legalName, 3);
  const displayPart = normalizeAndTake(displayName, 3);
  const warehousePart = normalizeAndTake(warehouseName, 3);
  
  const timeCode = createdAt.toString(36).slice(-4);
  const timePart = normalizeAndTake(timeCode, 3);

  if (!legalPart && !displayPart && !warehousePart) return '';

  return [legalPart, displayPart, warehousePart, timePart]
    .filter(Boolean)
    .join('');
}

export const notBlank = (value: string) => value.trim().length > 0;
export function getPageItems(
  page: number,
  pageCount: number,
  siblingCount = 1,
): PageItem[] {
  const range = (from: number, to: number) => {
    const out: number[] = [];
    for (let i = from; i <= to; i++) out.push(i);
    return out;
  };
  if (pageCount <= siblingCount * 2 + 5) return range(1, pageCount);

  const leftSibling = Math.max(page - siblingCount, 2);
  const rightSibling = Math.min(page + siblingCount, pageCount - 1);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < pageCount - 1;

  const items: PageItem[] = [1];
  if (showLeftEllipsis) items.push("ellipsis-left");
  else items.push(...range(2, leftSibling - 1));
  items.push(...range(leftSibling, rightSibling));
  if (showRightEllipsis) items.push("ellipsis-right");
  else items.push(...range(rightSibling + 1, pageCount - 1));
  items.push(pageCount);
  return items;
}

/**
 * Generic "has this form changed?" check.
 *
 * Compares the way a form actually saves:
 *  - strings are trimmed, so a trailing space is not a change
 *  - null, undefined, "" (and empty arrays) all count as "no value"
 *  - arrays are compared ignoring order by default, so unticking and
 *    re-ticking a checkbox is not a change
 *  - Dates compare by time, plain objects compare key by key
 */

export interface HasChangedOptions<O, C> {
  /** Fields to compare. Defaults to every key present in `current`. */
  fields?: readonly (keyof O & keyof C)[];
  /** Treat arrays as ordered lists. Defaults to false (order is ignored). */
  orderMatters?: boolean;
}

/** The fields whose value differs, compared the same way as `hasChanged`. */
export function changedFields<O extends object, C extends object>(
  original: O,
  current: C,
  options: HasChangedOptions<O, C> = {},
): (keyof O & keyof C)[] {
  const {
    fields = Object.keys(current) as (keyof O & keyof C)[],
    orderMatters = false,
  } = options;

  return fields.filter(
    (field) => !isEqual(original[field], current[field], orderMatters),
  );
}

export function hasChanged<O extends object, C extends object>(
  original: O,
  current: C,
  options: HasChangedOptions<O, C> = {},
): boolean {
  return changedFields(original, current, options).length > 0;
}

function isBlank(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function isEqual(a: unknown, b: unknown, orderMatters: boolean): boolean {
  if (isBlank(a) && isBlank(b)) return true;
  if (typeof a === "string" && typeof b === "string") {
    return a.trim() === b.trim();
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return sameArray(a, b, orderMatters);
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].every((key) => isEqual(a[key], b[key], orderMatters));
  }
  return Object.is(a, b);
}

function sameArray(
  a: readonly unknown[],
  b: readonly unknown[],
  orderMatters: boolean,
): boolean {
  if (a.length !== b.length) return false;
  if (orderMatters) return a.every((item, i) => isEqual(item, b[i], true));

  // Unordered: match each item of `a` with a distinct, equal item of `b`.
  const remaining = [...b];
  return a.every((item) => {
    const index = remaining.findIndex((other) => isEqual(item, other, false));
    if (index === -1) return false;
    remaining.splice(index, 1);
    return true;
  });
}

/**
 * The locale dates are written in: the APP's language (fr/en), not the
 * device's. A French-speaking user on an English-set phone still reads French
 * dates. Read at call time, so a component re-rendered by a language switch
 * picks up the new one.
 */
export function appLocale(): string {
  const language = i18n.resolvedLanguage ?? i18n.language ?? 'fr'
  return language.startsWith('fr') ? 'fr-CM' : 'en-CM'
}

const dateFormats = new Map<string, Intl.DateTimeFormat>()

/** One cached formatter per locale and style. */
function dateFormat(style: 'date' | 'dateTime' | 'month'): Intl.DateTimeFormat {
  const locale = appLocale()
  const key = `${locale}|${style}`
  let format = dateFormats.get(key)
  if (!format) {
    format = new Intl.DateTimeFormat(
      locale,
      style === 'date'
        ? { dateStyle: 'medium' }
        : style === 'dateTime'
          ? { dateStyle: 'medium', timeStyle: 'short' }
          : { month: 'long', year: 'numeric' },
    )
    dateFormats.set(key, format)
  }
  return format
}

function parse(value: string | Date | null | undefined): Date | undefined {
  if (!value) return undefined
  const date = typeof value === 'string' ? new Date(value) : value
  return Number.isNaN(date.getTime()) ? undefined : date
}

/** A backend `Instant` as date and time in the app's language and the user's time zone ("13 Oct 2026, 19:33"). */
export function formatDateTime(iso: string | Date | null | undefined): string {
  const date = parse(iso)
  return date ? dateFormat('dateTime').format(date) : '—'
}

/** A month ("yyyy-MM") as "octobre 2026" / "October 2026". */
export function formatMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)
  if (!year || !monthNumber) return '—'
  return dateFormat('month').format(new Date(year, monthNumber - 1, 1))
}

/**
 * The LOCAL calendar day ("yyyy-MM-dd") of an instant or Date, for grouping and
 * "is it today?" checks. Slicing the ISO string instead gives the UTC day, which
 * is the previous day for anything recorded before 01:00 in UTC+1.
 */
export function localDateKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Renders a backend `Instant` (ISO-8601 with offset) as a medium date.
 *
 * WHY a shared helper: the subscription and enterprise surfaces show several
 * of these, and `new Date(x).toLocaleDateString()` in each one is how the same
 * field ends up formatted two different ways. A missing or unparseable value
 * reads as an em dash rather than the browser's "Invalid Date".
 */
export function formatDate(iso: string | Date | null | undefined): string {
  const date = parse(iso)
  return date ? dateFormat('date').format(date) : '—'
}

/**
 * A date picked in a form ("yyyy-MM-dd") as the instant the API expects.
 *
 * The API's dates (`purchaseDate`, `advanceDate`, `effectiveFrom`…) are
 * `java.time.Instant`s and reject a bare calendar date. Today becomes the current
 * time, so the same day's records stay in order. Any other day becomes:
 *  - "midday" (default): local noon, far enough from midnight that the UTC
 *    conversion cannot move it to the previous or next day;
 *  - "startOfDay": local midnight, for things that take effect "from" that day.
 */
export function dateToInstant(
  date: string,
  timeOfDay: "midday" | "startOfDay" = "midday",
): string {
  const [year, month, day] = date.split("-").map(Number);
  const now = new Date();
  const isToday =
    now.getFullYear() === year && now.getMonth() + 1 === month && now.getDate() === day;
  if (isToday) return now.toISOString();
  return new Date(year, month - 1, day, timeOfDay === "midday" ? 12 : 0).toISOString();
}
