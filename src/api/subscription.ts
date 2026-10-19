import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";
import type { EnterpriseStatus, SubscriptionStatus } from "@/enums";

/**
 * The current enterprise's subscription (`/api/v1/subscription`).
 *
 * This is a SINGLE RESOURCE, not a register: the backend resolves the tenant
 * from the authenticated request (`TenantContext`) and returns that one
 * company's plan. There is no list endpoint exposed — `SubscriptionService`
 * has a `listAll`, but the controller does not surface it — so this module
 * deliberately has no `list`.
 *
 * Mirrors `tenancy.dto.SubscriptionResponse`. `tenantStatus` is `TenantStatus`
 * on the wire (the existence/operational status of the company);
 * `subscriptionStatus` is `SubscriptionStatus` (the plan's lifecycle). They
 * are tracked separately and can disagree — an active tenant on a past-due
 * plan is exactly that case.
 */
export interface SubscriptionResponse {
  tenantId: string;
  /** The tenant slug; the same value carried as `companyCode` at login. */
  companyCode: string;
  displayName: string;
  legalName?: string | null;
  tenantStatus: EnterpriseStatus;
  subscriptionId: string;
  planCode: string;
  subscriptionStatus: SubscriptionStatus;
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd?: string | null;
  suspendedAt?: string | null;
  /**
   * The server's own answer to "may this tenant perform operational writes
   * right now" — true only when the tenant is active AND the plan is trial or
   * active. The client must display this rather than recompute it, because the
   * entitlement rule lives on the server.
   */
  operationalAccess: boolean;
  /** The company's contact details, printed on its documents' letterhead. */
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

/** `tenancy.dto.UpdateCompanyContactRequest` — "" clears a field. */
export interface UpdateCompanyContactRequest {
  /** Required by the server when sent: a company always has a name. */
  displayName?: string;
  legalName?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export const subscriptionApi = {
  /** Visible to any authenticated user, including when the plan is suspended. */
  current(): Promise<SubscriptionResponse> {
    return apiClient.get<SubscriptionResponse>(ApiRoutes.subscription.base);
  },

  /** `SYSTEM_ADMIN` only. Restores operational access and opens a new period. */
  activate(): Promise<SubscriptionResponse> {
    return apiClient.post<SubscriptionResponse>(
      ApiRoutes.subscription.activate,
    );
  },

  /** The company's boss: sets the letterhead contact details. */
  updateContact(input: UpdateCompanyContactRequest): Promise<SubscriptionResponse> {
    return apiClient.patch<SubscriptionResponse>(ApiRoutes.subscription.contact, input);
  },

  /** `SYSTEM_ADMIN` only. Blocks operational access for the whole tenant. */
  suspend(): Promise<SubscriptionResponse> {
    return apiClient.post<SubscriptionResponse>(ApiRoutes.subscription.suspend);
  },
};
