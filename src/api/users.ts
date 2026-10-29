import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";
import { withPageQuery, withQueryParam } from "@/api/paging";
import type {
  AvailableEmployee,
  CreateUserRequest,
  PageParams,
  PageResponse,
  ResetPasswordRequest,
  UpdateUserRequest,
  UserResponse,
} from "@/interfaces";

/**
 * User accounts (`/api/v1/users`).
 *
 * A user is a LOGIN; an employee is a personnel record. They are separate
 * concepts that may be linked (`UserResponse.employeeId`), and the warehouse
 * manager is a case of an employee who never gets an account. Creating a user
 * here must therefore not be confused with hiring someone.
 *
 * WHY the UI is not the authorization boundary: these calls record an
 * administrator's decision. The server independently checks `USER_READ`,
 * `USER_CREATE`, `USER_UPDATE` and `USER_DELETE` on every one of them, so hiding
 * a button is a convenience, never a control. A 403 from the API is the real
 * answer.
 *
 * `remove` is a SOFT delete — `UserController.delete` calls the same
 * `deactivate` path as `disable`. The row and its audit trail stay; the account
 * simply stops being able to sign in.
 */
export const usersApi = {
  /** `enterpriseId` narrows the platform admin's list to one company; others always get their own. */
  list(page?: PageParams, enterpriseId?: string): Promise<PageResponse<UserResponse>> {
    return apiClient.get<PageResponse<UserResponse>>(
      withPageQuery(withQueryParam(ApiRoutes.users.all, "enterpriseId", enterpriseId), page),
    );
  },

  byId(id: string): Promise<UserResponse> {
    return apiClient.get<UserResponse>(ApiRoutes.users.byId(id));
  },

  /** Active employees with no sign-in yet, each with the role their job suggests. */
  availableEmployees(): Promise<AvailableEmployee[]> {
    return apiClient.get<AvailableEmployee[]>(ApiRoutes.users.availableEmployees);
  },

  /** A free username: first name + current warehouse code, e.g. "alma.main". */
  async suggestUsername(fullName: string): Promise<string> {
    const { username } = await apiClient.get<{ username: string }>(
      ApiRoutes.users.suggestedUsername(fullName),
    );
    return username;
  },

  create(
    input: CreateUserRequest,
    idempotencyKey?: string,
  ): Promise<UserResponse> {
    return apiClient.post<UserResponse>(
      ApiRoutes.users.all,
      input,
      idempotencyKey,
    );
  },

  update(id: string, patch: UpdateUserRequest): Promise<UserResponse> {
    return apiClient.patch<UserResponse>(ApiRoutes.users.byId(id), patch);
  },

  /** Blocks sign-in. Reversible via `enable`. */
  disable(id: string): Promise<UserResponse> {
    return apiClient.post<UserResponse>(ApiRoutes.users.disable(id), {});
  },

  enable(id: string): Promise<UserResponse> {
    return apiClient.post<UserResponse>(ApiRoutes.users.enable(id), {});
  },

  /**
   * Admin password reset. The server takes only the new password
   * (`ResetPasswordRequest`) — an administrator is not asked to know the old one.
   */
  resetPassword(
    id: string,
    input: ResetPasswordRequest,
    idempotencyKey?: string,
  ): Promise<UserResponse> {
    return apiClient.post<UserResponse>(
      ApiRoutes.users.resetPassword(id),
      input,
      idempotencyKey,
    );
  },

  /** Emails the invitation again; the earlier link stops working. */
  resendInvitation(id: string): Promise<UserResponse> {
    return apiClient.post<UserResponse>(ApiRoutes.users.invitation(id));
  },

  /** Soft delete — server-side this deactivates, it does not remove the row. */
  remove(id: string, idempotencyKey?: string): Promise<UserResponse> {
    return apiClient.delete<UserResponse>(
      ApiRoutes.users.byId(id),
      idempotencyKey,
    );
  },
};
