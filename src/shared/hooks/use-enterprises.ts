import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  enterprisesApi,
  type CreateEnterpriseInput,
  type UpdateEnterpriseInput,
} from "@/api/enterprises";
import { qk } from "@/shared/hooks/query-keys";
import { useIdempotentMutation } from "@/shared/hooks/use-idempotent-mutation";
import type { PageParams } from "@/interfaces";

export function useEnterprises(page?: PageParams, enabled = true) {
  return useQuery({
    queryKey: qk.enterprises.list(page),
    queryFn: () => enterprisesApi.list(page),
    enabled,
  });
}

export function useCreateEnterprise() {
  const queryClient = useQueryClient();
  return useIdempotentMutation<
    CreateEnterpriseInput,
    Awaited<ReturnType<typeof enterprisesApi.create>>
  >({
    mutationFn: (input, key) => enterprisesApi.create(input, key),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: qk.enterprises.all }),
    meta: { success: "toast.enterprises.created" },
  });
}

export function useUpdateEnterprise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      companyCode: string;
      input: UpdateEnterpriseInput;
    }) => enterprisesApi.update(variables.companyCode, variables.input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: qk.enterprises.all }),
    meta: { success: "toast.enterprises.updated" },
  });
}

export function useSetEnterpriseActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { companyCode: string; active: boolean }) =>
      enterprisesApi.setActive(variables.companyCode, variables.active),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: qk.enterprises.all }),
    // Suspending a tenant blocks every user in it — the consequence is far away
    // from this switch, so it must be stated.
    meta: { success: "toast.enterprises.statusChanged" },
  });
}

export function useListEnterpriseWarehouses(enterpriseId?: string, page?: PageParams) {
  return useQuery({
    queryKey: [...qk.enterprises.warehouses(enterpriseId ?? ""), page ?? {}],
    queryFn: () => enterprisesApi.listWarehouses(enterpriseId!, page),
    enabled: Boolean(enterpriseId),
  });
}
