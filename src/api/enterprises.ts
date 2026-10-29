import { ApiRoutes } from "@/api/routes";
import { withPageQuery } from "@/api/paging";
import { apiClient } from "@/lib/api-client";
import type { PageParams, PageResponse } from "@/interfaces";
import type { EnterpriseStatus, SubscriptionStatus } from "@/enums";
import type { WarehouseSummary } from "./warehouses";

export interface EnterpriseResponse {
  tenantId: string;
  uniqueId: string;
  companyCode: string;
  displayName: string;
  legalName?: string | null;
  tenantStatus: EnterpriseStatus;
  planCode: string;
  subscriptionStatus: string;
  startedAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  suspendedAt?: string | null;
  operationalAccess: boolean;
}

export interface CreateEnterpriseInput {
  uniqueId: string;
  companyCode: string;
  name: string;
  legalName?: string;
  warehouseCode?: string;
  warehouseName?: string;
  warehouseLocation?: string;
  adminUsername: string;
  /** Left out: the boss is emailed an invitation to choose their own. */
  adminPassword?: string;
  adminFullName: string;
  adminEmail: string;
}

/** `tenancy.dto.PlatformStatsResponse`: the platform at a glance. */
export interface PlatformStats {
  enterprises: number;
  /** Companies per subscription status as shown to them (a lapsed period counts as EXPIRED). */
  byStatus: Record<SubscriptionStatus, number>;
  closed: number;
  /** Running trials and paid periods that end within `endingSoonDays`. */
  endingSoon: number;
  endingSoonDays: number;
  users: number;
  activeUsers: number;
}

export type UpdateEnterpriseInput = Partial<CreateEnterpriseInput> & {
  displayName?: string;
}

export const enterprisesApi = {
  list(page?: PageParams): Promise<PageResponse<EnterpriseResponse>> {
    return apiClient.get<PageResponse<EnterpriseResponse>>(
      withPageQuery(ApiRoutes.enterprises.all, page),
    );
  },

  async create(
    input: CreateEnterpriseInput,
    idempotencyKey?: string,
  ): Promise<EnterpriseResponse> {
    return apiClient.post<EnterpriseResponse>(
      ApiRoutes.enterprises.all,
      input,
      idempotencyKey,
    );
  },

  update(
    companyCode: string,
    input: UpdateEnterpriseInput,
  ): Promise<EnterpriseResponse> {
    return apiClient.patch<EnterpriseResponse>(
      ApiRoutes.enterprises.byCode(companyCode),
      input,
    );
  },

  setActive(companyCode: string, active: boolean): Promise<EnterpriseResponse> {
    return apiClient.post<EnterpriseResponse>(
      active
        ? ApiRoutes.enterprises.activate(companyCode)
        : ApiRoutes.enterprises.suspend(companyCode),
    );
  },

  changePlan(companyCode: string, planCode: string): Promise<EnterpriseResponse> {
    return apiClient.post<EnterpriseResponse>(ApiRoutes.enterprises.plan(companyCode), { planCode });
  },

  stats(): Promise<PlatformStats> {
    return apiClient.get<PlatformStats>(ApiRoutes.enterprises.stats);
  },

  /** One enterprise's warehouses (the platform operator's view of a tenant). */
  listWarehouses(id: string, page?: PageParams): Promise<PageResponse<WarehouseSummary>> {
    return apiClient.get<PageResponse<WarehouseSummary>>(
      withPageQuery(ApiRoutes.enterprises.listWarehouses(id), page),
    );
  },
};
