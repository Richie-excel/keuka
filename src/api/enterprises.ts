import { ApiRoutes } from "@/api/routes";
import { withPageQuery } from "@/api/paging";
import { apiClient } from "@/lib/api-client";
import type { PageParams, PageResponse } from "@/interfaces";
import type { EnterpriseStatus } from "@/enums";
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
    try {
      const result = await apiClient.post<EnterpriseResponse>(
        ApiRoutes.enterprises.all,
        input,
        idempotencyKey,
      );
      console.log("Enterprise create result:", result);
      return result;
    } catch (error) {
      console.error("Enterprise create error:", error);
      throw error; // Re-throw so the caller (e.g. TanStack Query) still catches it
    }
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

  /** One enterprise's warehouses (the platform operator's view of a tenant). */
  listWarehouses(id: string, page?: PageParams): Promise<PageResponse<WarehouseSummary>> {
    return apiClient.get<PageResponse<WarehouseSummary>>(
      withPageQuery(ApiRoutes.enterprises.listWarehouses(id), page),
    );
  },
};
