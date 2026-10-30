import { useMutation, useQuery } from "@tanstack/react-query";
import { aiApi, type NoteContext } from "@/api/ai";
import { qk } from "@/shared/hooks/query-keys";

/** Whether the server's open model is on. Rarely changes: asked once per session. */
export function useAiStatus() {
  return useQuery({
    queryKey: qk.ai.status(),
    queryFn: aiApi.status,
    staleTime: Infinity,
    retry: false,
  });
}

/**
 * Whether this company may use the AI analysis: the server runs a model AND the
 * company's plan includes it (only Entreprise does). False while still asking,
 * so nothing AI-related flashes up and then disappears.
 */
export function useAiAvailable(): boolean {
  return useAiStatus().data?.enabled === true;
}

export function useSuggestNote() {
  return useMutation({
    mutationFn: (input: { context: NoteContext; details: Record<string, string>; language: string }) =>
      aiApi.suggestNote(input),
    retry: false,
  });
}
