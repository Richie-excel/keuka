import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { auditApi } from "@/api/audit";
import { qk } from "@/shared/hooks/query-keys";
import type { PageParams } from "@/interfaces";

export function useAuditEvents(page?: PageParams, eventType?: string, search?: string) {
  return useQuery({
    queryKey: qk.audit.list({ ...page, eventType, search }),
    queryFn: () => auditApi.list(page, eventType, search),
    // Keep the current rows on screen while the next search loads: no flicker per keystroke.
    placeholderData: keepPreviousData,
  });
}

export function useAuditEvent(id: string | undefined) {
  return useQuery({
    queryKey: [...qk.audit.all, "detail", id ?? ""] as const,
    queryFn: () => auditApi.byId(id as string),
    enabled: Boolean(id),
  });
}
