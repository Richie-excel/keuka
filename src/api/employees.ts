import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";
import { withPageQuery } from "@/api/paging";
import type {
  CreateEmployeeRequest,
  EmployeeResponse,
  PageParams,
  PageResponse,
  UpdateEmployeeRequest,
} from "@/interfaces";

/**
 * Employees (`/api/v1/employees`) — personnel records, NOT logins.
 *
 * WHY that distinction matters: an employee may have no application account at
 * all. `EmployeeResponse.userId` is empty until someone is given one, and the
 * warehouse manager is explicitly a physical job that needs no account. Creating
 * an employee must therefore never be conflated with creating a user.
 *
 * There is deliberately no `remove`. The backend exposes only GET/POST/PATCH for
 * employees — people are deactivated (`PATCH { active: false }`), not deleted,
 * because salaries and audit events reference them by id.
 *
 * `idCardNumber` is REQUIRED by `CreateEmployeeRequest`; the server rejects a
 * create without it (`VALIDATION_FAILED`).
 */
export const employeesApi = {
  list(page?: PageParams): Promise<PageResponse<EmployeeResponse>> {
    return apiClient.get<PageResponse<EmployeeResponse>>(
      withPageQuery(ApiRoutes.employees.all, page),
    );
  },

  byId(id: string): Promise<EmployeeResponse> {
    return apiClient.get<EmployeeResponse>(ApiRoutes.employees.byId(id));
  },

  create(
    input: CreateEmployeeRequest,
    idempotencyKey?: string,
  ): Promise<EmployeeResponse> {
    return apiClient.post<EmployeeResponse>(
      ApiRoutes.employees.all,
      input,
      idempotencyKey,
    );
  },

  update(id: string, patch: UpdateEmployeeRequest): Promise<EmployeeResponse> {
    return apiClient.patch<EmployeeResponse>(
      ApiRoutes.employees.byId(id),
      patch,
    );
  },
};
