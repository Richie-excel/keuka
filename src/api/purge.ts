import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";
import { withPageQuery } from "@/api/paging";
import type { PageParams, PageResponse } from "@/interfaces";

/** `purge.domain.PurgeWatchStatus`. Only the first two are listed: the others are finished. */
export type PurgeWatchStatus = "WATCHING" | "NOTIFIED" | "CANCELLED" | "PURGED";

/**
 * `purge.dto.PurgeWatchResponse`: a deactivated record counting down to its
 * permanent deletion. `notifyAt` is when the reminder goes out, `purgeAt` when
 * it is wiped unless someone keeps it.
 */
export interface PurgeWatch {
  id: string;
  /** UserAccount, BusinessPartner, Employee or Warehouse. */
  resourceType: string;
  resourceId: string;
  label: string;
  deactivatedAt: string;
  notifyAt: string;
  purgeAt: string;
  notifiedAt?: string | null;
  status: PurgeWatchStatus;
}

export const purgeApi = {
  /** Records waiting to be deleted, the soonest first (a boss sees only their company's). */
  pending(page?: PageParams): Promise<PageResponse<PurgeWatch>> {
    return apiClient.get<PageResponse<PurgeWatch>>(withPageQuery(ApiRoutes.purge.all, page));
  },

  /** Keep the record: the scheduled deletion is cancelled; it stays deactivated. */
  cancel(id: string): Promise<PurgeWatch> {
    return apiClient.post<PurgeWatch>(ApiRoutes.purge.cancel(id));
  },

  /** Delete for good now, without waiting for the date (platform admin only). */
  purgeNow(id: string): Promise<PurgeWatch> {
    return apiClient.post<PurgeWatch>(ApiRoutes.purge.purge(id));
  },
};
