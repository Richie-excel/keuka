import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";
import { withPageQuery, withQueryParam } from "@/api/paging";
import type { AuditEvent, PageParams, PageResponse } from "@/interfaces";

export const auditApi = {
  /** Newest first. `search` matches type, action, who, what and reason (or an exact id), on the server. */
  list(page?: PageParams, eventType?: string, search?: string): Promise<PageResponse<AuditEvent>> {
    return apiClient.get<PageResponse<AuditEvent>>(
      withPageQuery(
        withQueryParam(
          withQueryParam(ApiRoutes.audit.events, "eventType", eventType),
          "q",
          search?.trim() || undefined,
        ),
        page,
      ),
    );
  },

  byId(id: string): Promise<AuditEvent> {
    return apiClient.get<AuditEvent>(ApiRoutes.audit.event(id));
  },
};
