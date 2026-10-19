import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";

/** `InvitationService.InvitationView`: who the invitation is for. */
export interface InvitationView {
  fullName: string;
  username: string;
  email: string;
  companyName: string;
  expiresAt: string;
}

/**
 * The page an invitation email links to (no sign-in). A link that was used,
 * replaced by a newer email or has expired answers 410 `INVITATION_INVALID`.
 */
export const invitationsApi = {
  view(token: string): Promise<InvitationView> {
    return apiClient.get<InvitationView>(ApiRoutes.invitations.byToken(token), { auth: false });
  },

  /** Sets the password; opening the emailed link also verifies the address. */
  accept(token: string, password: string): Promise<InvitationView> {
    return apiClient.post<InvitationView>(ApiRoutes.invitations.accept(token), { password });
  },
};
