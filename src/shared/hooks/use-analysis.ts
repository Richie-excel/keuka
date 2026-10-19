import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { analysisApi } from "@/api/analysis";
import { qk } from "@/shared/hooks/query-keys";

export function useAnalysisSnapshot(days: number) {
  return useQuery({
    queryKey: qk.analysis.snapshot(days),
    queryFn: () => analysisApi.snapshot(days),
  });
}

export function useLatestAnalysis(language: string) {
  return useQuery({
    queryKey: qk.analysis.latest(language),
    queryFn: () => analysisApi.latest(language),
  });
}

/** Writing a report is slow and costs the model's time: no automatic retry. */
export function useGenerateAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ days, language }: { days: number; language: string }) =>
      analysisApi.generate(days, language),
    retry: false,
    // The page shows the failure in place (with how to fix it): no toast as well.
    meta: { silent: true },
    onSuccess: (report) => {
      queryClient.setQueryData(qk.analysis.latest(report.language), report);
      queryClient.invalidateQueries({ queryKey: qk.analysis.all });
    },
  });
}
