import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";
import { withPageQuery } from "@/api/paging";
import type { PageParams, PageResponse } from "@/interfaces";
import type { BillingPeriod, PlanModule } from "@/enums";

/**
 * The subscription plan catalogue (`/api/v1/plans`).
 *
 * ===========================================================================
 * PROPOSED CONTRACT — NO CONTROLLER SERVES THESE YET.
 * Read `docs/plans-api-contract.md` before changing anything in this file: it
 * is the spec the Java side has to match, and every name here is a decision
 * recorded there.
 * ===========================================================================
 *
 * WHY the DTOs live here instead of `@/interfaces`: that file's own rule is
 * "nothing is invented — if a field is not on the DTO, it is not here". These
 * DTOs are the thing being proposed, so putting them in the registry of
 * confirmed backend shapes would make that rule lie. They sit beside the code
 * that uses them, exactly as `WarehouseSummary` and `EnterpriseResponse` do
 * (both also provisional), and they move to `@/interfaces` the day the
 * controller exists.
 *
 * WHAT A PLAN IS: a platform-level catalogue row — a price list entry a
 * subscription's `planCode` points into. It is NOT a tenant record, and it is
 * never edited in a way that changes what an existing subscription agreed to:
 * a plan that has gone out of circulation is retired with `active: false`
 * through `plansApi.update`, never deleted, so historic subscriptions keep
 * resolving their `planCode`.
 */

/**
 * One comparable line of "what this plan includes".
 *
 * `label`/`value` rather than a single sentence precisely so two plans can be
 * put side by side and diffed row by row; `included` is what draws the tick or
 * the cross. `value` is a `string` because half of the true answers are not
 * numbers — "Unlimited", "Email", "24 h".
 */
export interface PlanFeature {
  /** English (default) text. */
  label: string;
  value: string;
  included: boolean;
  /** French text, optional: the app falls back to label/value. */
  labelFr?: string | null;
  valueFr?: string | null;
}

/** `tenancy.dto.PlanResponse`. */
export interface PlanResponse {
  id: string;
  /** The join key `SubscriptionResponse.planCode` stores. Immutable. */
  code: string;
  name: string;
  description?: string | null;
  priceAmount: number;
  currency: string;
  billingPeriod: BillingPeriod;
  features: PlanFeature[];
  /** Free-text selling points; not compared across plans, so not structured. */
  benefits: string[];
  /** The French texts (name/description/benefits are English); see localizePlan. */
  nameFr?: string | null;
  descriptionFr?: string | null;
  benefitsFr?: string[];

  active: boolean;
  displayOrder: number;
  /** The level its prices belong to: ESSENTIEL, PRO, ENTREPRISE, TRIAL. */
  tier?: string | null;
  /** What it allows; null is unlimited. Enforced by the server. */
  maxWarehouses?: number | null;
  maxUsers?: number | null;
  /** Modules beyond the core; the others are read-only for companies on it. */
  modules: PlanModule[];
  /** A free trial lasts this many days. */
  trialDays?: number | null;
  createdAt?: string;
  updatedAt?: string;
}


export interface CreatePlanRequest {
  code: string;
  name: string;
  description?: string;
  priceAmount: number;
  currency?: string;
  billingPeriod: BillingPeriod;
  features: PlanFeature[];
  benefits: string[];
  active?: boolean;
  displayOrder?: number;
  tier?: string;
  maxWarehouses?: number;
  maxUsers?: number;
  modules?: PlanModule[];
  trialDays?: number;
  nameFr?: string;
  descriptionFr?: string;
  benefitsFr?: string[];
}

/** Limits left out mean "unchanged", so lifting one to unlimited is said explicitly. */
export type UpdatePlanRequest = Partial<Omit<CreatePlanRequest, "code">> & {
  unlimitedWarehouses?: boolean;
  unlimitedUsers?: boolean;
};

export const plansApi = {
  /** The plans on offer, for visitors (no sign-in). */
  publicCatalogue(): Promise<PlanResponse[]> {
    return apiClient.get<PlanResponse[]>(ApiRoutes.plans.public, { auth: false });
  },

  list(page?: PageParams): Promise<PageResponse<PlanResponse>> {
    return apiClient.get<PageResponse<PlanResponse>>(
      withPageQuery(ApiRoutes.plans.all, page),
    );
  },

  /** Readable by any authenticated user — a price list is not a secret. */
  byCode(code: string): Promise<PlanResponse> {
    return apiClient.get<PlanResponse>(ApiRoutes.plans.byCode(code));
  },

  create(
    input: CreatePlanRequest,
    idempotencyKey?: string,
  ): Promise<PlanResponse> {
    return apiClient.post<PlanResponse>(
      ApiRoutes.plans.all,
      input,
      idempotencyKey,
    );
  },

  update(code: string, input: UpdatePlanRequest): Promise<PlanResponse> {
    return apiClient.patch<PlanResponse>(ApiRoutes.plans.byCode(code), input);
  },
};
