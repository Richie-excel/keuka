import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";

/** The records whose notes the AI can propose (`ai.NoteContext`). */
export type NoteContext =
  | "TILL"
  | "DELIVERY"
  | "PREFINANCE"
  | "PARTNER"
  | "SALARY_PAYOUT"
  | "EMPLOYEE";

export interface AiStatus {
  enabled: boolean;
  model?: string | null;
}

/** Small AI helpers backed by the open model on the server (`/api/v1/ai`). */
export const aiApi = {
  status(): Promise<AiStatus> {
    return apiClient.get<AiStatus>(ApiRoutes.ai.status);
  },

  /** A proposed text for a notes field, from the form's details (labels → readable values). */
  suggestNote(input: {
    context: NoteContext;
    details: Record<string, string>;
    language: string;
  }): Promise<{ text: string }> {
    return apiClient.post<{ text: string }>(ApiRoutes.ai.noteSuggestions, input);
  },
};
