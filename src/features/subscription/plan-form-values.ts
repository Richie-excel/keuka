import type {
  CreatePlanRequest,
  PlanFeature,
  PlanResponse,
  UpdatePlanRequest,
} from "@/api/plans";
import { BillingPeriod, type PlanModule } from "@/enums";
import { parseAmount } from "@/lib/amount";
import { DEFAULT_CURRENCY } from "@/constants";

/**
 * The shape the plan form actually edits, and the rules that turn it into a
 * request. Kept out of the component so the validation can be reasoned about —
 * and tested — without rendering anything, the same way `pricing-form-values`
 * carries the price rules.
 *
 * WHY PRICE IS A STRING HERE: it is typed, character by character, and an empty
 * box is not the number 0. Holding it as a string keeps "nothing entered" and
 * "the user deliberately typed 0" distinguishable until submit — a distinction
 * that matters, because a free tier is a legitimate plan.
 */

export const PLAN_CODE_MAX_LENGTH = 32;
export const PLAN_NAME_MAX_LENGTH = 120;
export const PLAN_DESCRIPTION_MAX_LENGTH = 500;
/** The currency the rest of the app prices in (see `formatMoney`). */
export const DEFAULT_PLAN_CURRENCY = DEFAULT_CURRENCY;

export interface PlanFormValues {
  code: string;
  name: string;
  description: string;
  /** Raw keystrokes; see the note above. */
  priceAmount: string;
  currency: string;
  billingPeriod: BillingPeriod;
  features: PlanFeature[];
  benefits: string[];
  active: boolean;
  /** Raw keystrokes too — blank means "unspecified", which is not 0. */
  displayOrder: string;
  /** Blank is unlimited. */
  maxWarehouses: string;
  maxUsers: string;
  modules: PlanModule[];
  /** The French texts; blank falls back to the English ones on screen. */
  nameFr: string;
  descriptionFr: string;
  benefitsFr: string[];
}

/**
 * A plan code derived from the plan's name, in the same spirit as
 * `deriveWarehouseCode`: something readable and stable rather than a UUID, so
 * a `planCode` on an enterprise row says what the company is on.
 *
 * Word separators become underscores ("Premium Plus" to "PREMIUM_PLUS") because
 * the code is matched by eye in registers far more often than by machine.
 */
export function derivePlanCode(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, PLAN_CODE_MAX_LENGTH);
}

/** The server's rule: `[A-Z0-9_]+`, non-blank (see the contract). */
export function isValidPlanCode(value: string): boolean {
  const code = value.trim();
  return code.length > 0 && code.length <= PLAN_CODE_MAX_LENGTH &&
    /^[A-Z0-9_]+$/.test(code);
}

/**
 * A price is valid when it is a real number, zero or more. Zero is allowed on
 * purpose: a free or trial tier is a plan.
 */
export function isValidPlanPrice(value: string): boolean {
  if (value.trim() === "") return false;
  const amount = parseAmount(value);
  return Number.isFinite(amount) && amount >= 0;
}

export function emptyFeature(): PlanFeature {
  return { label: "", value: "", included: true };
}

export function emptyPlanFormValues(): PlanFormValues {
  return {
    code: "",
    name: "",
    description: "",
    priceAmount: "",
    currency: DEFAULT_PLAN_CURRENCY,
    billingPeriod: BillingPeriod.YEARLY,
    features: [emptyFeature()],
    benefits: [""],
    maxWarehouses: "",
    maxUsers: "",
    modules: [],
    nameFr: "",
    descriptionFr: "",
    benefitsFr: [""],
    active: true,
    displayOrder: "",
  };
}

/** Pre-fills the form from a catalogue row, for "edit". */
export function planFormValuesFrom(plan: PlanResponse): PlanFormValues {
  return {
    code: plan.code,
    name: plan.name,
    description: plan.description ?? "",
    priceAmount: String(plan.priceAmount),
    currency: plan.currency,
    billingPeriod: plan.billingPeriod,
    // An empty stored list still gets one blank row, so the form always shows
    // somewhere to type rather than an empty area with an "Add" button.
    features: plan.features.length > 0 ? plan.features : [emptyFeature()],
    benefits: plan.benefits.length > 0 ? plan.benefits : [""],
    active: plan.active,
    displayOrder:
      plan.displayOrder === 0 ? "" : String(plan.displayOrder),
    maxWarehouses: plan.maxWarehouses == null ? "" : String(plan.maxWarehouses),
    maxUsers: plan.maxUsers == null ? "" : String(plan.maxUsers),
    modules: plan.modules ?? [],
    nameFr: plan.nameFr ?? "",
    descriptionFr: plan.descriptionFr ?? "",
    benefitsFr: plan.benefitsFr && plan.benefitsFr.length > 0 ? plan.benefitsFr : [""],
  };
}

/** A limit is blank (unlimited) or a whole number of at least 1. */
export function isValidPlanLimit(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === "" || (/^\d+$/.test(trimmed) && Number(trimmed) >= 1);
}

/**
 * Drops the rows the user left blank, and trims what remains.
 *
 * WHY THIS IS NOT JUST COSMETIC: the form starts with one empty feature row and
 * one empty benefit row so there is somewhere to type. Sending those empty rows
 * would store a feature with no label, which the comparison table would then
 * render as a nameless line. The server is told to reject blanks as well; this
 * is the client making the same call so it never has to.
 */
export function cleanFeatures(features: PlanFeature[]): PlanFeature[] {
  return features
    .map((feature) => ({
      label: feature.label.trim(),
      value: feature.value.trim(),
      included: feature.included,
      // Kept: the comparison shows them to French readers.
      labelFr: feature.labelFr?.trim() || undefined,
      valueFr: feature.valueFr?.trim() || undefined,
    }))
    .filter((feature) => feature.label.length > 0);
}

export function cleanBenefits(benefits: string[]): string[] {
  return benefits.map((benefit) => benefit.trim()).filter(Boolean);
}

function parseOptionalInt(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
}

/** Everything both create and update send, after cleaning. */
function commonFields(values: PlanFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    priceAmount: parseAmount(values.priceAmount),
    currency: values.currency.trim() || undefined,
    billingPeriod: values.billingPeriod,
    features: cleanFeatures(values.features),
    benefits: cleanBenefits(values.benefits),
    active: values.active,
    displayOrder: parseOptionalInt(values.displayOrder),
    maxWarehouses: parseOptionalInt(values.maxWarehouses),
    maxUsers: parseOptionalInt(values.maxUsers),
    modules: values.modules,
    nameFr: values.nameFr.trim(),
    descriptionFr: values.descriptionFr.trim(),
    benefitsFr: cleanBenefits(values.benefitsFr),
  };
}

export function buildCreatePlanRequest(values: PlanFormValues): CreatePlanRequest {
  return {
    code: values.code.trim().toUpperCase(),
    ...commonFields(values),
  };
}

/**
 * The update payload. `code` is absent by design — it is the join key a
 * subscription stores, so the server refuses to change it, and sending it would
 * invite a rename that breaks every tenant on the plan. The form shows it
 * read-only while editing for exactly that reason.
 */
export function buildUpdatePlanRequest(values: PlanFormValues): UpdatePlanRequest {
  return {
    ...commonFields(values),
    // A blank limit means unlimited; the server needs that said, not left out.
    unlimitedWarehouses: values.maxWarehouses.trim() === "",
    unlimitedUsers: values.maxUsers.trim() === "",
  };
}
