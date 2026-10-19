import type { StatusTone } from '@/components/status-badge'
import type { BuyerRisk, BuyerStatus, ContractStatus, DeliveryStatus, EnterpriseStatus, PayableStatus, PrefinanceStatus, StockStatus, SubscriptionStatus } from '@/enums'


interface StatusConfig {
  labelKey: string
  tone: StatusTone
}

export const PAYABLE_STATUS: Record<PayableStatus, StatusConfig> = {
  PAID: { labelKey: 'status.payable.PAID', tone: 'positive' },
  PARTIALLY_PAID: { labelKey: 'status.payable.PARTIALLY_PAID', tone: 'pending' },
  OPEN: { labelKey: 'status.payable.OPEN', tone: 'neutral' },
}

export const STOCK_STATUS: Record<StockStatus, StatusConfig> = {
  AVAILABLE: { labelKey: 'status.stock.AVAILABLE', tone: 'positive' },
  RESERVED: { labelKey: 'status.stock.RESERVED', tone: 'pending' },
  LOADED: { labelKey: 'status.stock.LOADED', tone: 'neutral' },
}

export const DELIVERY_STATUS: Record<DeliveryStatus, StatusConfig> = {
  CANCELLED: { labelKey: 'status.delivery.CANCELLED', tone: 'negative' },
  IN_TRANSIT: { labelKey: 'status.delivery.IN_TRANSIT', tone: 'pending' },
  LOADED: { labelKey: 'status.delivery.LOADED', tone: 'pending' },
  DELIVERED: { labelKey: 'status.delivery.DELIVERED', tone: 'positive' },
}

export const CONTRACT_STATUS: Record<ContractStatus, StatusConfig> = {
  ACTIVE: { labelKey: 'status.contract.ACTIVE', tone: 'positive' },
  COMPLETED: { labelKey: 'status.contract.COMPLETED', tone: 'neutral' },
  DRAFT: { labelKey: 'status.contract.DRAFT', tone: 'pending' },
}

export const BUYER_STATUS: Record<BuyerStatus, StatusConfig> = {
  ACTIVE: { labelKey: 'status.buyer.ACTIVE', tone: 'pending' },
  SETTLED: { labelKey: 'status.buyer.SETTLED', tone: 'positive' },
  UNSETTLED: { labelKey: 'status.buyer.UNSETTLED', tone: 'negative' },
}

export const BUYER_RISK: Record<
  BuyerRisk,
  { labelKey: string; tone: "positive" | "pending" | "negative" }
> = {
  LOW:    { labelKey: "buyers.risk.LOW",    tone: "positive" },
  MEDIUM: { labelKey: "buyers.risk.MEDIUM", tone: "pending" },
  HIGH:   { labelKey: "buyers.risk.HIGH",   tone: "negative" },
};
/**
 * `SubscriptionStatus` — the plan's lifecycle, distinct from the tenant's.
 * `TRIAL` and `ACTIVE` both grant operational access; everything else blocks
 * it, which is why only those two read as non-negative here.
 */
export const SUBSCRIPTION_STATUS: Record<SubscriptionStatus, StatusConfig> = {
  TRIAL: { labelKey: 'status.subscription.TRIAL', tone: 'pending' },
  ACTIVE: { labelKey: 'status.subscription.ACTIVE', tone: 'positive' },
  PAST_DUE: { labelKey: 'status.subscription.PAST_DUE', tone: 'pending' },
  SUSPENDED: { labelKey: 'status.subscription.SUSPENDED', tone: 'negative' },
  EXPIRED: { labelKey: 'status.subscription.EXPIRED', tone: 'negative' },
  CANCELLED: { labelKey: 'status.subscription.CANCELLED', tone: 'neutral' },
}

/** `TenantStatus` — the company account's existence, not its subscription. */
export const TENANT_STATUS: Record<EnterpriseStatus, StatusConfig> = {
  ACTIVE: { labelKey: 'status.tenant.ACTIVE', tone: 'positive' },
  SUSPENDED: { labelKey: 'status.tenant.SUSPENDED', tone: 'negative' },
  CLOSED: { labelKey: 'status.tenant.CLOSED', tone: 'neutral' },
}

/**
 * `PrefinanceStatus` — how far an advance has been worked off. An OPEN advance
 * is money out with cocoa still to come; COMPANY_OWES_BUYER is the company on
 * the hook, which is why it is the only negative of the four.
 */
export const PREFINANCE_STATUS: Record<PrefinanceStatus, StatusConfig> = {
  OPEN: { labelKey: 'status.prefinance.OPEN', tone: 'pending' },
  PARTIALLY_SETTLED: { labelKey: 'status.prefinance.PARTIALLY_SETTLED', tone: 'pending' },
  SETTLED: { labelKey: 'status.prefinance.SETTLED', tone: 'positive' },
  COMPANY_OWES_BUYER: { labelKey: 'status.prefinance.COMPANY_OWES_BUYER', tone: 'negative' },
}
