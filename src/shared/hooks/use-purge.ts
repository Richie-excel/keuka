import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { purgeApi } from "@/api/purge";
import { qk } from "@/shared/hooks/query-keys";
import type { PageParams } from "@/interfaces";

export function usePurgeWatches(page?: PageParams) {
  return useQuery({
    queryKey: qk.purge.list(page),
    queryFn: () => purgeApi.pending(page),
  });
}

export function useCancelPurge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purgeApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.purge.all }),
    meta: { success: "toast.retention.kept" },
  });
}

export function usePurgeNow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purgeApi.purgeNow(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.purge.all }),
    meta: { success: "toast.retention.deleted" },
  });
}
