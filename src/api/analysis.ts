import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";
import type { AnalysisResponse, BusinessSnapshot } from "@/interfaces";

/**
 * The owner's business analysis (`/api/v1/analysis`, BOSS only).
 *
 * The figures are computed by the server from the records; the open model
 * (Mistral, Llama… served by Ollama) only writes a report about them.
 */
export const analysisApi = {
  /** Live figures for the last `days` days. No AI involved. */
  snapshot(days: number): Promise<BusinessSnapshot> {
    return apiClient.get<BusinessSnapshot>(ApiRoutes.analysis.snapshot(days));
  },

  /** The most recent report in that language, or null when none was written yet (204). */
  async latest(language: string): Promise<AnalysisResponse | null> {
    const report = await apiClient.get<AnalysisResponse | undefined>(ApiRoutes.analysis.latest(language));
    return report ?? null;
  },

  /** Has the model write a new report. Can take a minute on an office computer. */
  generate(days: number, language: string): Promise<AnalysisResponse> {
    return apiClient.post<AnalysisResponse>(ApiRoutes.analysis.generate(days, language));
  },
};
