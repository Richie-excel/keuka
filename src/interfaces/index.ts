import type {
  CashMovementType,
  CashSessionStatus,
  DeliveryStatus,
  EmployeeType,
  ExpenseStatus,
  PartnerKind,
  PartnerType,
  PayableStatus,
  PaymentMethod,
  PaymentStatus,
  PermissionKey,
  PrefinanceStatus,
  PriceStatus,
  PurchaseStatus,
  SalaryStatus,
  StockMovementType,
  SystemRole,
} from "@/enums";

/**
 * Types mirroring the CoMS backend DTOs.
 *
 * Rules this file follows, so it stays honest:
 *
 * 1. **Names are the backend's names** (`UserResponse`, `CreatePurchaseRequest`,
 *    ...). When something here disagrees with Java, the difference should be
 *    visible at a glance rather than hidden behind a rename.
 * 2. **`Instant` → `string`** (ISO-8601 with offset), **`LocalDate` → `string`**
 *    (`YYYY-MM-DD`), **`BigDecimal` → `number`**. Jackson serialises BigDecimal as
 *    a JSON number by default, and these are quantities and money that the client
 *    formats for display — it never does arithmetic that matters, because the
 *    server is the calculation boundary (backend design principle #2).
 * 3. **Nothing is invented.** If a field is not on the DTO, it is not here, however
 *    convenient it would be.
 */

/* ================================================================== *
 * Shared
 * ================================================================== */

/** Mirrors `com.richie.coms.shared.domain.BaseEntity`. */
export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Mirrors `com.richie.coms.shared.web.PageResponse`.
 *
 * EVERY list endpoint returns this, including the ones that look like a simple
 * array. `page` is **0-based** (Spring Data convention), so the first page is 0
 * and the last is `totalPages - 1`.
 */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/** Mirrors `com.richie.coms.shared.web.ApiError`. */
export interface ApiErrorBody {
  timestamp?: string;
  status: number;
  code: string;
  message: string;
  path?: string;
  correlationId?: string;
  fieldErrors?: Array<{ field: string; message: string; rejectedValue?: unknown }>;
}

/** Paging query params accepted by every paged `GET`. */
export interface PageParams {
  page?: number;
  size?: number;
}

/* ================================================================== *
 * Identity — identity.dto.*
 * ================================================================== */

/** `identity.dto.TokenResponse` — what `POST /auth/login` returns. */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessExpiresAt: string;
}

/** `identity.dto.LoginRequest`. `companyCode`/`warehouseCode` are optional today. */
export interface LoginRequest {
  companyCode?: string;
  username: string;
  password: string;
  warehouseCode?: string;
}

/** `identity.dto.RefreshRequest`. */
export interface RefreshRequest {
  companyCode?: string;
  refreshToken: string;
}

/** `identity.dto.ChangePasswordRequest`. */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * `identity.dto.UserResponse` — what `GET /auth/me` and the user endpoints return.
 *
 * Note `roles` is an array and the flag is `active`; an earlier frontend type used
 * a single `role` and `isActive` and could never have been populated from this.
 */
export interface UserResponse {
  id: string;
  username: string;
  fullName: string;
  email: string;
  active: boolean;
  lastLogin?: string | null;
  employeeId?: string | null;
  enterpriseId?:string | null;
  enterpriseName?: string | null;
  roles: SystemRole[];
  permissions: PermissionKey[];
  createdAt?: string;
  updatedAt?: string;
  /** Signed in with a one-time password: must choose their own first. */
  mustChangePassword?: boolean;
  /** The person opened a link sent to the email: the address is really theirs. */
  emailVerified?: boolean;
  /** Created by someone else and not set up yet: the invitation can be sent again. */
  invitationPending?: boolean;
}

/** `identity.service.EmployeeAccountService.AvailableEmployee`: an employee without a sign-in yet. */
export interface AvailableEmployee {
  id: string;
  fullName: string;
  email?: string | null;
  employeeType: EmployeeType;
  /** The role their job usually needs (CASHIER, INVENTORY, STAFF), if any. */
  suggestedRole?: string | null;
}

/** `identity.dto.RoleResponse`. */
export interface RoleResponse {
  id: string;
  name: string;
  description: string;
  builtIn: boolean;
  permissions: string[];
}
 
export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleRequest {
  description?: string;
  permissions?: string[];
}

/** `identity.dto.CreateUserRequest`. */
export interface CreateUserRequest {
  username: string;
  /** Left out: the server generates a one-time password and returns it once. */
  password?: string;
  fullName: string;
  email: string;
  roles: string[];
  /** The employee this sign-in belongs to (required when the boss creates one). */
  employeeId?: string;
}

/** `identity.dto.UpdateUserRequest`. */
export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  active?: boolean;
  roles?: string[];
  employeeId?: string;
}

/** `identity.dto.UpdateProfileRequest` — self-service name/email only. */
export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
}

/** `identity.dto.ResetPasswordRequest`. */
export interface ResetPasswordRequest {
  password: string;
}

/* ================================================================== *
 * Partner — partner.dto.*
 * ================================================================== */

/** `partner.dto.PartnerResponse`. Farmers, buyers and commercial parties alike. */
export interface PartnerResponse {
  id: string;
  name: string;
  type: PartnerType;
  idCardNumber: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  /** Only a trusted BUYER may be prefinanced (`BUYER_NOT_TRUSTED` otherwise). */
  trusted: boolean;
  active: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  /** Individual or company. Companies often share only name, location and a contact. */
  kind: PartnerKind;
  /** A company's trade register number (RCCM) — optional, often not shared. */
  registrationNumber?: string;
  /** A company's taxpayer number (NIU) — optional, often not shared. */
  taxNumber?: string;
}

/** `partner.dto.CreatePartnerRequest`. */
export interface CreatePartnerRequest {
  name: string;
  idCardNumber?: string,
  type: PartnerType;
  contactPerson?: string;
  phone?: string;
  address?: string;
  trusted?: boolean;
  notes?: string;
  /** Defaults from the type on the server when omitted. */
  kind?: PartnerKind;
  registrationNumber?: string;
  taxNumber?: string;
}

/** `partner.dto.UpdatePartnerRequest`. */
export interface UpdatePartnerRequest {
  name?: string;
  type?: PartnerType;
  idCardNumber?: string,
  contactPerson?: string;
  phone?: string;
  address?: string;
  trusted?: boolean;
  active?: boolean;
  notes?: string;
  kind?: PartnerKind;
  registrationNumber?: string;
  taxNumber?: string;
}

/* ================================================================== *
 * Personnel — personnel.dto.*
 * ================================================================== */

/**
 * `personnel.dto.EmployeeResponse`. A personnel record, NOT a login — an
 * employee may have no account at all (`userId` empty).
 */
export interface EmployeeResponse {
  id: string;
  fullName: string;
  email?: string;
  idCardNumber?: string;
  phone?: string;
  employeeType: EmployeeType;
  hireDate?: string;
  active: boolean;
  /** Set when this employee has a linked login. */
  userId?: string | null;
  /** What the company currently owes them. */
  salaryDue?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  /** The salary agreed per month; caps first-month advances. */
  monthlySalary?: number | null;
  /** Advances paid and not yet repaid by recorded salary. */
  advanceBalance?: number;
  /** First day salary can be due: one month after the hire date. */
  salaryDueFrom?: string | null;
  /** The day the next month's salary is added automatically. */
  nextSalaryDate?: string | null;
}

/** `personnel.dto.CreateEmployeeRequest`. `idCardNumber` is required. */
export interface CreateEmployeeRequest {
  fullName: string;
  email?: string;
  idCardNumber: string;
  phone?: string;
  employeeType: EmployeeType;
  hireDate?: string;
  notes?: string;
  monthlySalary?: number;
}

/** `personnel.dto.UpdateEmployeeRequest`. */
export interface UpdateEmployeeRequest {
  fullName?: string;
  email?: string;
  idCardNumber?: string;
  phone?: string;
  employeeType?: EmployeeType;
  hireDate?: string;
  active?: boolean;
  notes?: string;
  monthlySalary?: number;
}

/* ================================================================== *
 * Pricing — pricing.dto.*
 * ================================================================== */

/** `pricing.dto.CocoaPriceResponse`. At most one row is ACTIVE. */
export interface CocoaPriceResponse {
  id: string;
  pricePerKg: number;
  currency: string;
  effectiveFrom: string;
  status: PriceStatus;
  setBy?: string;
  createdAt?: string;
}

/** `pricing.dto.CreateCocoaPriceRequest`. Server closes the previous interval. */
export interface CreateCocoaPriceRequest {
  pricePerKg: number;
  currency?: string;
  effectiveFrom?: string;
}

/* ================================================================== *
 * Procurement — procurement.dto.*
 * ================================================================== */

/** `procurement.dto.PayableResponse`. */
export interface PayableResponse {
  id: string;
  purchaseId: string;
  amount: number;
  paidAmount: number;
  remaining: number;
  dueDate?: string;
  status: PayableStatus;
}

/**
 * `procurement.dto.PurchaseResponse`.
 *
 * Note what is NOT sent by the client: the unit price and amount are snapshotted
 * server-side from the effective cocoa price, and `recordedBy` comes from the
 * authenticated user. A client that submitted its own price would be able to
 * record a purchase at any price it liked.
 */
export interface PurchaseResponse {
  id: string;
  farmerId?: string | null;
  buyerId?: string | null;
  purchaseDate: string;
  grossWeight: number;
  humidity?: number | null;
  refraction?: number | null;
  netWeight: number;
  unitPrice: number;
  priceId?: string | null;
  amount: number;
  currency: string;
  status: PurchaseStatus;
  recordedBy?: string;
  /** Full name (or username) of whoever recorded it; null if the account is gone. */
  recordedByName?: string | null;
  notes?: string;
  createdAt?: string;
  payable?: PayableResponse | null;
  /**
   * The deliveries (weighings) making up this purchase, oldest first. A
   * partner who delivers twice the same day has ONE purchase with two lines;
   * the purchase's own weights and amount are their totals.
   */
  deliveries?: PurchaseDeliveryResponse[];
}

/** `procurement.dto.PurchaseDeliveryResponse` — one weighing within a day's purchase. */
export interface PurchaseDeliveryResponse {
  id: string;
  purchaseId: string;
  deliveredAt: string;
  grossWeight: number;
  humidity?: number | null;
  refraction?: number | null;
  netWeight: number;
  unitPrice: number;
  /** Null when priced at a buyer's agreed prefinance price. */
  priceId?: string | null;
  amount: number;
  /** Part of `amount` that repaid the buyer's prefinance. */
  prefinanceSettled: number;
  notes?: string;
}

/**
 * `procurement.dto.CreatePurchaseRequest`.
 *
 * `farmerId` XOR `buyerId` — the server answers `PARTNER_REQUIRED` if neither is
 * given. `netWeight <= grossWeight` or it answers `INVALID_MEASUREMENT`.
 */
export interface CreatePurchaseRequest {
  farmerId?: string;
  buyerId?: string;
  purchaseDate?: string;
  grossWeight: number;
  humidity?: number;
  refraction?: number;
  netWeight: number;
  notes?: string;
  /**
   * "Paid now": recorded with the purchase in one transaction, against what is
   * left after any prefinance repayment. Omit to record the purchase on credit.
   */
  payment?: CreatePaymentRequest;
}

/** Full editable purchase payload accepted by PATCH `/purchases/{id}`. */
export type UpdatePurchaseRequest = CreatePurchaseRequest;

/** `procurement.dto.PaymentResponse`. */
export interface PaymentResponse {
  id: string;
  purchaseId: string;
  payableId: string;
  amount: number;
  currency: string;
  paymentDate: string;
  method: PaymentMethod;
  reference?: string;
  status: PaymentStatus;
  /** Who was paid: the purchase's farmer or buyer. */
  partnerName?: string | null;
  /** When that purchase was made (for its receipt number). */
  purchaseDate?: string | null;
}

/**
 * `procurement.dto.CreatePaymentRequest`. A CASH payment with no open till is
 * rejected with `CASH_SESSION_REQUIRED`.
 */
export interface CreatePaymentRequest {
  amount: number;
  method: PaymentMethod;
  paymentDate?: string;
  reference?: string;
  cashSessionId?: string;
}
/* ================================================================== *
 * Finance — finance.dto.*
 * ================================================================== */

/** `finance.dto.CashTransactionResponse` — one line of till movement. */
export interface CashTransactionResponse {
  id: string;
  sessionId: string;
  movementType: CashMovementType;
  amount: number;
  occurredAt: string;
  referenceType?: string;
  referenceId?: string;
  description?: string;
}

/**
 * `finance.dto.CashSessionResponse` — one cashier's till for one session.
 *
 * `availableBalance` is the server's own running total
 * (`opening + provisions − cash outs`); the client must display it rather than
 * recompute, since only the server sees every movement.
 */
export interface CashSessionResponse {
  id: string;
  openedBy: string;
  openedAt: string;
  openingBalance: number;
  closedBy?: string | null;
  closedAt?: string | null;
  expectedClosing?: number | null;
  declaredClosing?: number | null;
  variance?: number | null;
  availableBalance: number;
  status: CashSessionStatus;
  notes?: string;
  transactions?: CashTransactionResponse[];
  /** Who opened / closed the till (full name, else username). */
  openedByName?: string | null;
  closedByName?: string | null;
}

/** `finance.dto.OpenCashSessionRequest`. */
export interface OpenCashSessionRequest {
  openingBalance: number;
  notes?: string;
}

/** `finance.dto.CloseCashSessionRequest`. */
export interface CloseCashSessionRequest {
  declaredClosing: number;
  notes?: string;
}

/** `finance.dto.AddCashProvisionRequest`. */
export interface AddCashProvisionRequest {
  amount: number;
  notes?: string;
}

/**
 * `finance.domain.ExpenseCategory` — a TABLE, not an enum.
 *
 * Categories are rows an administrator creates, so the frontend must fetch them
 * (`GET /expense-categories`) instead of hard-coding a list. The old frontend had
 * a REPAIRS/FUEL/... enum here, which could never match a user-created category.
 */
export interface ExpenseCategory {
  id: string;
  name: string;
  /** Set on default categories (FUEL…): translated by the app. Null for a company's own. */
  code?: string | null;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** `finance.dto.CreateExpenseCategoryRequest`. */
export interface CreateExpenseCategoryRequest {
  name: string;
  description?: string;
}

/** `finance.dto.ExpenseResponse`. */
export interface ExpenseResponse {
  id: string;
  categoryId: string;
  amount: number;
  currency: string;
  expenseDate: string;
  description: string;
  beneficiary?: string;
  paymentMethod: PaymentMethod;
  cashSessionId?: string | null;
  status: ExpenseStatus;
  recordedBy?: string;
  /** The category's name, so lists need no second lookup. */
  categoryName?: string | null;
  categoryCode?: string | null;
  /** Set when cancelled: it stays in the list, with the reason. */
  cancelledAt?: string | null;
  cancelReason?: string | null;
}

/**
 * `finance.dto.CreateExpenseRequest`. A CASH expense needs an open till
 * (`CASH_SESSION_REQUIRED`).
 */
export interface CreateExpenseRequest {
  categoryId: string;
  amount: number;
  expenseDate?: string;
  description: string;
  beneficiary?: string;
  paymentMethod: PaymentMethod;
  cashSessionId?: string;
}

/* ================================================================== *
 * Prefinance — prefinance.dto.*
 * ================================================================== */

/**
 * `prefinance.dto.PrefinanceResponse`.
 *
 * `historicalUnitPrice` is frozen at creation from the then-current cocoa price.
 * Settlement value is delivered quantity × THAT price, never today's — which is
 * why the field exists rather than being read from the price list at display time.
 */
export interface PrefinanceResponse {
  id: string;
  buyerId: string;
  buyerName?: string;
  buyerTrusted: boolean;
  amount: number;
  disbursedAmount: number;
  currency: string;
  historicalUnitPrice: number;
  priceId?: string | null;
  advanceDate: string;
  deliveredQuantity: number;
  deliveredValue: number;
  /** `amount − deliveredValue`, computed by the server. */
  outstandingAdvance: number;
  status: PrefinanceStatus;
  notes?: string;
}

/** `prefinance.dto.CreatePrefinanceRequest`. Only a TRUSTED buyer is accepted. */
export interface CreatePrefinanceRequest {
  buyerId: string;
  amount: number;
  /**
   * Price per kg agreed with the buyer for the cocoa that repays this advance.
   * Negotiated, so it can differ from the published price; the server falls
   * back to the current price when it is omitted.
   */
  pricePerKg?: number;
  advanceDate?: string;
  notes?: string;
}

/** `prefinance.dto.CreateDisbursementRequest`. */
export interface CreateDisbursementRequest {
  amount: number;
  method: PaymentMethod;
  disbursedAt?: string;
  cashSessionId?: string;
  reference?: string;
}

/* ================================================================== *
 * Logistics — logistics.dto.*
 * ================================================================== */

/**
 * `logistics.dto.DeliveryResponse` — a truck trip.
 *
 * Vehicle and driver live on the trip, not in a fleet catalog: there is no
 * vehicle master data, and the driver need not be an employee. `declared*Weight`
 * is what the company declared at loading and is never overwritten by a later
 * partner reception.
 */
export interface DeliveryResponse {
  id: string;
  partnerId: string;
  vehicleNumber: string;
  vehicleType?: string;
  driverName: string;
  driverLicenseNumber: string;
  driverPhone?: string;
  destination: string;
  departureAt?: string;
  declaredGrossWeight?: number;
  declaredNetWeight?: number;
  bagCount?: number | null;
  escortEmployeeId?: string | null;
  escortName?: string | null;
  status: DeliveryStatus;
  notes?: string;
  recordedBy?: string;
  createdAt?: string;
}

/** `logistics.dto.CreateDeliveryRequest`. */
export interface CreateDeliveryRequest {
  partnerId: string;
  vehicleNumber: string;
  vehicleType?: string;
  driverName: string;
  driverLicenseNumber: string;
  driverPhone?: string;
  destination: string;
  departureAt?: string;
  /** Ignored by the server, which computes it: net weight + bags. */
  declaredGrossWeight?: number;
  declaredNetWeight: number;
  notes?: string;
  /** Bags on the truck: each adds its weight to the gross. */
  bagCount: number;
  /** An employee travelling with the load (optional). */
  escortEmployeeId?: string;
}

/* ================================================================== *
 * Inventory — inventory.dto.*
 * ================================================================== */

/**
 * `inventory.dto.StockBalanceResponse` — on-hand kg for one warehouse.
 *
 * Inventory is a BALANCE plus a movement ledger, not a set of batches with
 * statuses. The old frontend modelled batches with AVAILABLE/RESERVED/LOADED,
 * which the server has no concept of.
 */
export interface StockBalanceResponse {
  warehouseId?: string | null;
  quantityKg: number;
}

/** `inventory.dto.StockMovementResponse`. */
export interface StockMovementResponse {
  id: string;
  warehouseId?: string | null;
  type: StockMovementType;
  quantityKg: number;
  sourceType?: string;
  sourceId?: string;
  movedAt: string;
  notes?: string;
}

/**
 * `inventory.dto.AdjustStockRequest` — a manual recount, loss or sample.
 * `inbound` decides the direction; negative quantities are not used.
 */
export interface AdjustStockRequest {
  warehouseId?: string;
  quantityKg: number;
  inbound: boolean;
  notes?: string;
}

/* ================================================================== *
 * Audit — audit.domain.AuditEvent
 * ================================================================== */

/**
 * `audit.domain.AuditEvent`. Append-only, read via `GET /audit/events`
 * (optionally `?eventType=`). The server writes these; the client only lists them.
 */
export interface AuditEvent {
  id: string;
  eventType: string;
  actorUserId?: string | null;
  actorUsername?: string;
  aggregateType: string;
  aggregateId?: string | null;
  action: string;
  /** JSON string as stored; parse defensively before rendering. */
  details?: string;
  reason?: string;
  correlationId?: string;
  /** Written from `coms.node.id`, for later multi-node sync. */
  nodeId?: string;
  createdAt?: string;
  updatedAt?: string;
}
/* ================================================================== *
 * Payroll — payroll.dto.*
 * ================================================================== */

/**
 * `payroll.dto.SalaryResponse`.
 *
 * Note there is no `status`: the DTO omits it even though the domain enum has
 * one. Progress is expressed by `EmployeeResponse.salaryDue` instead — money owed
 * versus money collected.
 */
/** `payroll.domain.SalaryKind`. */
export type SalaryKind = "SALARY" | "ADVANCE";

export interface SalaryResponse {
  id: string;
  employeeId: string;
  amount: number;
  paidAt: string;
  /** Name the employee signed with. This is the signature record. */
  signatureName: string;
  cashSessionId?: string | null;
  notes?: string;
  /** SALARY, or ADVANCE when paid in the employee's first month. */
  kind?: SalaryKind;
}

/**
 * `payroll.dto.CollectSalaryRequest` — employee takes cash and signs.
 * The server enforces amount ≤ `salaryDue` (`INSUFFICIENT_SALARY_DUE`) and, for
 * cash, amount ≤ the open till (`INSUFFICIENT_CASH`).
 */
export interface CollectSalaryRequest {
  amount: number;
  signatureName: string;
  cashSessionId?: string;
  notes?: string;
}

/** `payroll.dto.CreateSalaryRequest`. */
export interface CreateSalaryRequest {
  employeeId: string;
  periodId: string;
  amount: number;
}

/** Legacy persistence-shaped salary type; payroll endpoints use SalaryResponse. */
export interface Salary {
  id: string;
  employeeId: string;
  periodId?: string | null;
  amount: number;
  paidAt?: string;
  signatureName?: string;
  cashSessionId?: string | null;
  notes?: string;
  status?: SalaryStatus;
  createdAt?: string;
  updatedAt?: string;
}

/* ── Business analysis (`analysis.dto`) ───────────────────────────── */

/** `analysis.dto.BusinessSnapshot`: figures computed exactly from the records. */
export interface BusinessSnapshot {
  from: string;
  to: string;
  days: number;
  currency: string;
  purchases: SnapshotPurchases;
  previousPurchases: SnapshotPurchases;
  topSuppliers: { name: string; type: string; netKg: number; amount: number }[];
  payables: { open: number; outstanding: number; overdue: number; overdueAmount: number };
  stock: { onHandKg: number; receivedKg: number; issuedKg: number };
  deliveries: { count: number; netKg: number; notYetDelivered: number };
  prices: { currentPerKg?: number | null; atPeriodStartPerKg?: number | null; changes: number };
  till: {
    sessionsClosed: number;
    totalVariance: number;
    shortfalls: number;
    largestShortfall: number;
    openNow: boolean;
  };
  expenses: { total: number; topCategories: { category: string; amount: number }[] };
  prefinance: { open: number; outstanding: number; largest: { buyer: string; outstanding: number }[] };
  payroll: { activeEmployees: number; salaryDue: number; advancesOutstanding: number };
}

export interface SnapshotPurchases {
  count: number;
  netKg: number;
  amount: number;
  averagePricePerKg: number;
}

/** `analysis.dto.AnalysisResponse`: a report the open model wrote, with its figures. */
export interface AnalysisResponse {
  id: string;
  periodFrom: string;
  periodTo: string;
  days: number;
  language: "fr" | "en";
  /** The open model that wrote it, e.g. "mistral". */
  model: string;
  /** Markdown: ## headings, bullet points, **bold**. */
  content: string;
  snapshot: BusinessSnapshot;
  generatedAt: string;
  generatedBy?: string;
}
