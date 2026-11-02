import { useMutation, useQuery } from "@tanstack/react-query";
import { aiApi, type NoteContext } from "@/api/ai";
import { qk } from "@/shared/hooks/query-keys";
import { useAuth } from "@/shared/hooks/useAuth";

/** Whether the server's open model is on. Rarely changes: asked once per session. */
export function useAiStatus() {
  const { user } = useAuth();
  return useQuery({
    queryKey: qk.ai.status(),
    queryFn: aiApi.status,
    // The shell asks on every page, the change-password one included, where the
    // server refuses everything but /auth (403 until a password is chosen).
    enabled: Boolean(user) && !user?.mustChangePassword,
    staleTime: Infinity,
    retry: false,
    // A probe for optional features: a refusal means "no AI", never the forbidden page.
    throwOnError: false,
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
