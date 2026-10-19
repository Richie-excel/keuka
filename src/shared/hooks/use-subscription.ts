import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscriptionApi, type UpdateCompanyContactRequest } from "@/api/subscription";
import { qk } from "@/shared/hooks/query-keys";
import { SUBSCRIPTION_STALE_MS } from "@/constants";

/**
 * Subscription queries and the two status mutations.
 *
 * The subscription is the tenant's own record, so it is a single query rather
 * than a paged list. Activating or suspending it changes BOTH the subscription
 * and the enterprise register (the server flips the tenant status alongside the
 * plan), so a successful mutation invalidates both caches — otherwise the
 * dashboard's enterprise table would keep showing the old status.
 */

export function useSubscription(enabled = true) {
  return useQuery({
    queryKey: qk.subscription.current(),
    queryFn: subscriptionApi.current,
    staleTime: SUBSCRIPTION_STALE_MS,
    enabled,
  });
}

function useSubscriptionStatusMutation(active: boolean) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      active ? subscriptionApi.activate() : subscriptionApi.suspend(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.subscription.all });
      // The server also moves the tenant between ACTIVE and SUSPENDED when the
      // plan moves, so the enterprise register is now stale too.
      queryClient.invalidateQueries({ queryKey: qk.enterprises.all });
    },
    // Suspending blocks every user in the tenant, a consequence far away from
    // the switch that caused it — it must be stated in the confirmation toast.
    meta: {
      success: active
        ? "toast.subscription.activated"
        : "toast.subscription.suspended",
    },
  });
}

/** Sets the company's letterhead contact details (boss only). */
export function useUpdateCompanyContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCompanyContactRequest) => subscriptionApi.updateContact(input),
    onSuccess: (subscription) => {
      queryClient.setQueryData(qk.subscription.current(), subscription);
      // The company name shows in the sidebar, which reads it from the session.
      void queryClient.invalidateQueries({ queryKey: qk.session.me() });
    },
    meta: { success: "toast.subscription.contactSaved" },
  });
}

export function useActivateSubscription() {
  return useSubscriptionStatusMutation(true);
}

export function useSuspendSubscription() {
  return useSubscriptionStatusMutation(false);
}
