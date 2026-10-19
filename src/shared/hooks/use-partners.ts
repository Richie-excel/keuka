import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { partnersApi } from "@/api/partners";
import { qk } from "@/shared/hooks/query-keys";
import { useIdempotentMutation } from "@/shared/hooks/use-idempotent-mutation";
import type {
  CreatePartnerRequest,
  PageParams,
  PartnerResponse,
  UpdatePartnerRequest,
} from "@/interfaces";
import type { PartnerType } from "@/enums";

export function usePartners(type?: PartnerType, page?: PageParams) {
  return useQuery({
    queryKey: qk.partners.list({ type, ...page }),
    queryFn: () => partnersApi.list(type, page),
  });
}

export function usePartner(id: string | undefined) {
  return useQuery({
    queryKey: qk.partners.detail(id ?? ""),
    queryFn: () => partnersApi.byId(id as string),
    enabled: Boolean(id),
  });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();

  return useIdempotentMutation<CreatePartnerRequest, PartnerResponse>({
    mutationFn: (input, idempotencyKey) =>
      partnersApi.create(input, idempotencyKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.partners.all }),
    meta: { success: "toast.partners.created" },
  });
}

export function useUpdatePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; patch: UpdatePartnerRequest }) =>
      partnersApi.update(vars.id, vars.patch),
    onSuccess: (partner) => {
      queryClient.setQueryData(qk.partners.detail(partner.id), partner);
      queryClient.invalidateQueries({ queryKey: qk.partners.all });
      queryClient.invalidateQueries({ queryKey: qk.prefinances.all });
    },
    meta: { success: "toast.partners.updated" },
  });
}
