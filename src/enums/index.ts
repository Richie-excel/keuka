/**
 * Backend vocabulary, mirrored.
 *
 * Every enum below is a 1:1 copy of an enum in
 * `com.richie.coms.*.domain`, and the wire value is the Java constant name.
 * Keeping these exact is not cosmetic: the frontend sends these strings as JSON
 * and matches them in filters, so a single renamed value is a field the server
 * rejects (400) or a badge that silently renders blank.
 *
 * Anything the frontend invented and the backend does not have is in the
 * `LEGACY` block at the bottom, each labelled with what should replace it.
 */

/* ------------------------------------------------------------------ *
 * Identity
 * ------------------------------------------------------------------ */

/** `identity.domain.SystemRole` */
export enum SystemRole {
  SYSADMIN = 'SYSTEM_ADMIN',
  BOSS = 'BOSS',
  STAFF = 'STAFF',
  BUYER = 'BUYER',
  INVENTORY = 'INVENTORY',
  CASHIER = 'CASHIER',
}

/** `identity.domain.RoleScope` — how far a role reaches. */
export enum RoleScope {
  PLATFORM = 'PLATFORM',
  ENTERPRISE = 'ENTERPRISE',
  WAREHOUSE = 'WAREHOUSE',
}

/**
 * `identity.domain.PermissionCode` — Spring authorities checked by
 * `hasAuthority(...)`. Per-verb (READ/CREATE/UPDATE/DELETE), not READ/MANAGE.
 */
export enum PermissionKey {
  USER_READ = 'USER_READ',
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',

  ROLE_READ = 'ROLE_READ',
  ROLE_CREATE = 'ROLE_CREATE',
  ROLE_UPDATE = 'ROLE_UPDATE',
  ROLE_DELETE = 'ROLE_DELETE',

  EMPLOYEE_READ = 'EMPLOYEE_READ',
  EMPLOYEE_CREATE = 'EMPLOYEE_CREATE',
  EMPLOYEE_UPDATE = 'EMPLOYEE_UPDATE',
  EMPLOYEE_DELETE = 'EMPLOYEE_DELETE',

  PARTNER_READ = 'PARTNER_READ',
  PARTNER_CREATE = 'PARTNER_CREATE',
  PARTNER_UPDATE = 'PARTNER_UPDATE',
  PARTNER_DELETE = 'PARTNER_DELETE',

  CONTRACT_READ = 'CONTRACT_READ',
  CONTRACT_CREATE = 'CONTRACT_CREATE',
  CONTRACT_UPDATE = 'CONTRACT_UPDATE',
  CONTRACT_DELETE = 'CONTRACT_DELETE',

  PRICE_READ = 'PRICE_READ',
  PRICE_CREATE = 'PRICE_CREATE',
  PRICE_UPDATE = 'PRICE_UPDATE',
  PRICE_DELETE = 'PRICE_DELETE',

  PURCHASE_READ = 'PURCHASE_READ',
  PURCHASE_CREATE = 'PURCHASE_CREATE',
  PURCHASE_UPDATE = 'PURCHASE_UPDATE',
  PURCHASE_DELETE = 'PURCHASE_DELETE',

  PAYMENT_READ = 'PAYMENT_READ',
  PAYMENT_CREATE = 'PAYMENT_CREATE',
  PAYMENT_UPDATE = 'PAYMENT_UPDATE',
  PAYMENT_DELETE = 'PAYMENT_DELETE',

  PREFINANCE_READ = 'PREFINANCE_READ',
  PREFINANCE_CREATE = 'PREFINANCE_CREATE',
  PREFINANCE_UPDATE = 'PREFINANCE_UPDATE',
  PREFINANCE_SETTLE = 'PREFINANCE_SETTLE',
  PREFINANCE_DELETE = 'PREFINANCE_DELETE',

  INVENTORY_READ = 'INVENTORY_READ',
  INVENTORY_CREATE = 'INVENTORY_CREATE',
  INVENTORY_UPDATE = 'INVENTORY_UPDATE',
  INVENTORY_DELETE = 'INVENTORY_DELETE',

  LOGISTICS_READ = 'LOGISTICS_READ',
  LOGISTICS_CREATE = 'LOGISTICS_CREATE',
  LOGISTICS_UPDATE = 'LOGISTICS_UPDATE',
  LOGISTICS_DELETE = 'LOGISTICS_DELETE',

  EXPENSE_READ = 'EXPENSE_READ',
  EXPENSE_CREATE = 'EXPENSE_CREATE',
  EXPENSE_UPDATE = 'EXPENSE_UPDATE',
  EXPENSE_DELETE = 'EXPENSE_DELETE',

  PAYROLL_READ = 'PAYROLL_READ',
  PAYROLL_CREATE = 'PAYROLL_CREATE',
  PAYROLL_UPDATE = 'PAYROLL_UPDATE',
  PAYROLL_DELETE = 'PAYROLL_DELETE',

  CASH_SESSION_READ = 'CASH_SESSION_READ',
  CASH_SESSION_CREATE = 'CASH_SESSION_CREATE',
  CASH_SESSION_UPDATE = 'CASH_SESSION_UPDATE',
  CASH_SESSION_DELETE = 'CASH_SESSION_DELETE',

  REPORT_READ = 'REPORT_READ',
  AUDIT_READ = 'AUDIT_READ',

  SYNC_READ = 'SYNC_READ',
  SYNC_CREATE = 'SYNC_CREATE',
  SYNC_UPDATE = 'SYNC_UPDATE',
  SYNC_DELETE = 'SYNC_DELETE',

  TENANT_READ = 'TENANT_READ',
  TENANT_CREATE = 'TENANT_CREATE',
  TENANT_UPDATE = 'TENANT_UPDATE',
  TENANT_DELETE = 'TENANT_DELETE',

  WAREHOUSE_READ = 'WAREHOUSE_READ',
  WAREHOUSE_CREATE = 'WAREHOUSE_CREATE',
  WAREHOUSE_UPDATE = 'WAREHOUSE_UPDATE',
  WAREHOUSE_DELETE = 'WAREHOUSE_DELETE',
}

/* ------------------------------------------------------------------ *
 * Partner
 * ------------------------------------------------------------------ */

/** `partner.domain.PartnerType`. Buyers are partners, never employees. */
/** `partner.domain.PartnerKind` — natural person or legal entity. */
export enum PartnerKind {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
}

export enum PartnerType {
  FARMER = 'FARMER',
  BUYER = 'BUYER',
  COMMERCIAL = 'COMMERCIAL',
  LOGISTICS = 'LOGISTICS',
  OTHER = 'OTHER',
}

/* ------------------------------------------------------------------ *
 * Personnel
 * ------------------------------------------------------------------ */

/** `personnel.domain.EmployeeType` — a job family, not an application role. */
export enum EmployeeType {
  DRIVER = 'DRIVER',
  MECHANIC = 'MECHANIC',
  LOADER = 'LOADER',
  FINANCIAL_SECRETARY = 'FINANCIAL_SECRETARY',
  CASHIER = 'CASHIER',
  WAREHOUSE_CLERK = 'WAREHOUSE_CLERK',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  OTHER = 'OTHER',
}

/* ------------------------------------------------------------------ *
 * Pricing
 * ------------------------------------------------------------------ */

/**
 * `pricing.domain.PriceStatus`. Publishing a price closes the previous open
 * interval, so at most one row is ACTIVE at a time.
 */
export enum PriceStatus {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  SUPERSEDED = 'SUPERSEDED',
  CANCELLED = 'CANCELLED',
}

/* ------------------------------------------------------------------ *
 * Procurement
 * ------------------------------------------------------------------ */

/** `procurement.domain.PurchaseStatus` */
export enum PurchaseStatus {
  RECORDED = 'RECORDED',
  PAYABLE = 'PAYABLE',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
}

/** `procurement.domain.PayableStatus` — OPEN, not PAYABLE. */
export enum PayableStatus {
  OPEN = 'OPEN',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
}

/** `procurement.domain.PaymentMethod` */
export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  OTHER = 'OTHER',
  /**
   * Part of a buyer's purchase written off against their prefinance. Recorded
   * by the server when the purchase is created; never chosen by a user.
   */
  PREFINANCE_OFFSET = 'PREFINANCE_OFFSET',
}

/** The methods a user may pick when recording a payment by hand. */
export const MANUAL_PAYMENT_METHODS = Object.values(PaymentMethod).filter(
  (method) => method !== PaymentMethod.PREFINANCE_OFFSET,
);

/** `procurement.domain.PaymentStatus` */
export enum PaymentStatus {
  RECORDED = 'RECORDED',
  VOIDED = 'VOIDED',
}

/* ------------------------------------------------------------------ *
 * Finance
 * ------------------------------------------------------------------ */

/** `finance.domain.CashSessionStatus` */
export enum CashSessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

/** `finance.domain.CashMovementType` */
export enum CashMovementType {
  IN = 'IN',
  OUT = 'OUT',
}

/** `finance.domain.ExpenseStatus` */
export enum ExpenseStatus {
  RECORDED = 'RECORDED',
  CANCELLED = 'CANCELLED',
}

/* ------------------------------------------------------------------ *
 * Prefinance
 * ------------------------------------------------------------------ */

/** `prefinance.domain.PrefinanceStatus` */
export enum PrefinanceStatus {
  OPEN = 'OPEN',
  PARTIALLY_SETTLED = 'PARTIALLY_SETTLED',
  SETTLED = 'SETTLED',
  COMPANY_OWES_BUYER = 'COMPANY_OWES_BUYER',
}

/* ------------------------------------------------------------------ *
 * Logistics
 * ------------------------------------------------------------------ */

/** `logistics.domain.DeliveryStatus` */
export enum DeliveryStatus {
  LOADED = 'LOADED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

/* ------------------------------------------------------------------ *
 * Payroll
 * ------------------------------------------------------------------ */

/** `payroll.domain.SalaryStatus` — accrual + signed collection, not a calendar. */
export enum SalaryStatus {
  DUE = 'DUE',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
}

/* ------------------------------------------------------------------ *
 * Inventory
 * ------------------------------------------------------------------ */

/** `inventory.domain.StockMovementType` */
export enum StockMovementType {
  RECEIPT = 'RECEIPT',
  ISSUE = 'ISSUE',
  ADJUSTMENT = 'ADJUSTMENT',
}

/* ------------------------------------------------------------------ *
 * Tenancy
 * ------------------------------------------------------------------ */

/**
 * `tenancy.domain.SubscriptionStatus` — the lifecycle of a company's plan,
 * tracked separately from `EnterpriseStatus` (`TenantStatus`). A tenant can be
 * `ACTIVE` while its subscription is `PAST_DUE`, which is exactly the state the
 * entitlement filter uses to refuse operational writes.
 */
export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

/**
 * PROPOSED — `tenancy.domain.BillingPeriod`, not yet on the server. See
 * `docs/plans-api-contract.md`.
 *
 * What a plan's price buys. An enum rather than a free-text interval ("per
 * month") because the period has to be sortable and comparable to put plans
 * side by side, and because a future renewal calculation needs a real value
 * rather than a label to parse.
 */
export enum BillingPeriod {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  /** The cocoa campaign: always ends on the last day of February. */
  SEASON = 'SEASON',
  /** Between campaigns: always ends on 31 July. */
  OFF_SEASON = 'OFF_SEASON',
}

/** `tenancy.domain.PlanModule`: what a plan may include beyond the core. */
export enum PlanModule {
  PREFINANCE = 'PREFINANCE',
  LOGISTICS = 'LOGISTICS',
  PAYROLL = 'PAYROLL',
  CUSTOM_ROLES = 'CUSTOM_ROLES',
  AUDIT_LOG = 'AUDIT_LOG',
  AI_ANALYSIS = 'AI_ANALYSIS',
}

/* ------------------------------------------------------------------ *
 * LEGACY — frontend-only enums with NO backend counterpart
 * ------------------------------------------------------------------ *
 * Each of these is used by a screen that has no server module behind it.
 * They are NOT sent to the API; they only drive badges and filters on
 * screens that are still running on fixtures. When the owning screen is
 * either wired to a real endpoint or removed, delete the entry here.
 */

/** No backend equivalent. A partner has `trusted` + `active`, nothing else. */
export enum BuyerStatus {
  ACTIVE = 'ACTIVE',
  SETTLED = 'SETTLED',
  UNSETTLED = 'UNSETTLED',
}

/** No backend equivalent. Used only by the buyer register, which is fixture data. */
export enum BuyerRisk {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/** No backend equivalent. Inventory is a balance + movements, not batch status. */
export enum StockStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  LOADED = 'LOADED',
}

/** No backend module. `CONTRACT_*` permissions exist but nothing serves them. */
export enum ContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

/** No backend module. */
export enum PartnerInvoiceStatus {
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

/** No backend module. The sync queue is documented as not yet built. */
export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCING = 'SYNCING',
  FAILED = 'FAILED',
}

export enum EnterpriseStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
}
