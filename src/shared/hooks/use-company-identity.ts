import { useMemo } from "react";
import { useSubscription } from "@/shared/hooks/use-subscription";
import type { CompanyIdentity } from "@/components/documents/types";

const EMPTY: CompanyIdentity = {
  legalName: "",
  displayName: "",
  companyCode: "",
};

/**
 * The signed-in tenant's identity for document headers and watermarks.
 *
 * Source: `GET /api/v1/subscription`, which is the one endpoint that returns
 * the current tenant's own `displayName`/`legalName`/`companyCode` without
 * needing platform authority. The legal name is preferred for the letterhead
 * and watermark; the display name is the fallback when no legal name is set.
 */
export function useCompanyIdentity(): {
  company: CompanyIdentity;
  isLoading: boolean;
} {
  const subscription = useSubscription();

  const company = useMemo<CompanyIdentity>(() => {
    const data = subscription.data;
    if (!data) return EMPTY;
    return {
      legalName: data.legalName?.trim() || data.displayName,
      displayName: data.displayName,
      companyCode: data.companyCode,
      address: data.address ?? undefined,
      phone: data.phone ?? undefined,
      email: data.email ?? undefined,
    };
  }, [subscription.data]);

  return { company, isLoading: subscription.isPending };
}
