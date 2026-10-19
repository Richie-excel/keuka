import { ApiRoutes } from "@/api/routes";
import { apiClient } from "@/lib/api-client";
import type { RoleResponse, CreateRoleRequest, UpdateRoleRequest } from "@/interfaces";


export const rolesApi = {
  list(): Promise<RoleResponse[]> {
    return apiClient.get<RoleResponse[]>(ApiRoutes.roles.all);
  },
  create(input: CreateRoleRequest): Promise<RoleResponse> {
    return apiClient.post<RoleResponse>(ApiRoutes.roles.all, input);
  },
 
  update(id: string, patch: UpdateRoleRequest): Promise<RoleResponse> {
    return apiClient.patch<RoleResponse>(ApiRoutes.roles.byId(id), patch);
  },
 
  remove(id: string): Promise<void> {
    return apiClient.delete<void>(ApiRoutes.roles.byId(id));
  },
};
