import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";
import { withPageQuery, withQueryParam } from "@/api/paging";
import type {
  CreatePartnerRequest,
  PageParams,
  PageResponse,
  PartnerResponse,
  UpdatePartnerRequest,
} from "@/interfaces";
import type { PartnerType } from "@/enums";


export const partnersApi = {
  list(type?: PartnerType, page?: PageParams): Promise<PageResponse<PartnerResponse>> {
    return apiClient.get<PageResponse<PartnerResponse>>(
      withPageQuery(withQueryParam(ApiRoutes.partners.all, "type", type), page),
    );
  },

  byId(id: string): Promise<PartnerResponse> {
    return apiClient.get<PartnerResponse>(ApiRoutes.partners.byId(id));
  },

  create(input: CreatePartnerRequest, idempotencyKey?: string): Promise<PartnerResponse> {
    return apiClient.post<PartnerResponse>(ApiRoutes.partners.all, input, idempotencyKey);
  },

  update(id: string, patch: UpdatePartnerRequest): Promise<PartnerResponse> {
    return apiClient.patch<PartnerResponse>(ApiRoutes.partners.byId(id), patch);
  },
};
