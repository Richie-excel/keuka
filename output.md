# Keuka — Functional & Technical Specification for the Odoo Edition

> **What this is.** A complete, implementation-level description of what Keuka (formerly *Kabos* / *CoMS*) does today: every record, field, rule, calculation, screen, permission, print-out and scheduled job. It was written by reading the two existing codebases line by line:
>
> - Backend: Spring Boot 4 + PostgreSQL (`CoMS`), the source of truth for every rule below.
> - Frontend: React 19 PWA (`Cocoa`), the source of truth for screens, forms, prints and labels.
>
> **Who it is for.** The team (or AI agent) building the **Odoo edition**: a self-hosted version that a cocoa company owns outright and runs on its own machine, with its data stored locally. Build from this document alone. Where the current system is inconsistent or unfinished, it is called out in §16 with a recommended decision, never silently "fixed" in the main text.
>
> **Conventions in this document.**
> - `MUST` = a rule the current system enforces; breaking it changes business behaviour.
> - Error codes in `UPPER_SNAKE` are the current system's; reuse them as the `UserError` message keys.
> - "Boss", "cashier"… are roles (§3). "Company" = the enterprise using the system.
> - Money is **XAF (FCFA)**; weights are **kg**.

---

## Table of contents

1. [Product in one page](#1-product-in-one-page)
2. [Global conventions](#2-global-conventions)
3. [Roles, permissions and access rules](#3-roles-permissions-and-access-rules)
4. [Data model](#4-data-model)
5. [Module: Pricing](#5-module-pricing)
6. [Module: Procurement (purchases, deliveries, payables, payments)](#6-module-procurement)
7. [Module: Buyer prefinancing](#7-module-buyer-prefinancing)
8. [Module: Till (cash sessions & provisions)](#8-module-till)
9. [Module: Expenses](#9-module-expenses)
10. [Module: Inventory](#10-module-inventory)
11. [Module: Logistics (truck loadings)](#11-module-logistics)
12. [Module: Personnel & Payroll](#12-module-personnel--payroll)
13. [Module: Administration (company, warehouses, users, roles, audit, retention)](#13-module-administration)
14. [Printed documents](#14-printed-documents)
15. [Dashboards, analysis and AI](#15-dashboards-analysis-and-ai)
16. [Known gaps & decisions to make](#16-known-gaps--decisions-to-make)
17. [Odoo implementation blueprint](#17-odoo-implementation-blueprint)
18. [SaaS layer (optional for self-hosted)](#18-saas-layer-optional-for-self-hosted)
19. [Appendix A — Error catalogue](#appendix-a--error-catalogue)
20. [Appendix B — Audit event catalogue](#appendix-b--audit-event-catalogue)
21. [Appendix C — Bilingual labels (EN/FR)](#appendix-c--bilingual-labels-enfr)

---

## 1. Product in one page

Keuka runs the daily operations and cash of a **Cameroonian cocoa trading company**:

| Area | What happens |
|---|---|
| **Pricing** | The boss publishes the price per kg. Every purchase snapshots the price in force at that moment. |
| **Procurement** | Farmers and field buyers bring cocoa. Each weighing is a *delivery line*; all lines of one seller on one business day form **one purchase**. The company owes the seller (a *payable*), paid at once ("paid now") or later, in part or in full. |
| **Buyer prefinancing** | Trusted field buyers receive cash advances at an **agreed price per kg**. The cocoa they later sell repays the advance automatically (oldest advance first), at the agreed price. |
| **Till** | Every cash movement goes through a cashier's **till session**: opened by the cashier, topped up by the boss (provisions), drained by cash payments, closed with a physical count and a variance. |
| **Expenses** | Running costs (fuel, parts, office…) paid in cash from the till, by category. Never deleted; cancelled with a reason, cash returned to the till. |
| **Inventory** | One stock balance (kg) per warehouse plus a movement ledger: purchases add, truck loadings remove, manual adjustments correct. |
| **Logistics** | Truck loadings of cocoa to commercial partners (exporters), with driver, vehicle, bags, escort and a printed **delivery note**. |
| **Personnel & payroll** | Employees (not the same thing as user accounts) with an agreed monthly salary that **accrues automatically** each completed month; payouts in cash from the till against the employee's signature; first-month advances. |
| **Administration** | Company details (printed letterhead), warehouses, user accounts linked to employees, built-in and custom roles, an append-only audit log, data retention of deactivated accounts. |
| **Analysis (optional)** | Owner's business snapshot for a period, plus an AI-written report from a **local** open model (Ollama). |
| **Printing** | Purchase receipt, prefinance receipt, delivery note, payslip, till report. Each one has a watermark, letterhead and signature boxes. Offered right after the operation that produces it. |

Languages: **English and French**, everything translatable, including printed documents. The UI is responsive (desktop, tablet, phone).

---

## 2. Global conventions

### 2.1 Numbers, money, time

| Item | Rule |
|---|---|
| Currency | XAF only (the `currency` field exists on records, default `"XAF"`). |
| Money storage | Decimal(19,2). Rounding **HALF_UP** at 2 decimals for every computed amount. |
| Money display | `fr-CM` locale, currency XAF, **0 decimals** (e.g. `125 000 FCFA`). |
| Weight storage | Decimal(19,3) for kg (purchases, stock, prefinance quantities, deliveries). |
| Weight display | `fr-CM` number + ` kg` (e.g. `1 234,5 kg`). |
| Humidity | Percent, 0–100 inclusive, 2 decimals; printed `12.50 %`; `—` when not measured (never guessed). |
| Time storage | UTC instants. |
| Business time zone | **Africa/Douala** (configurable). Everything that says "day", "today" or "month" uses it: the one-purchase-per-day rule, salary accrual dates, analysis periods. |
| Date picker → instant | If the chosen date is today: *now*. Otherwise local **12:00** of that date (avoids time-zone day shifts). |
| Dates on screen | App language locale; date, date-time and month formats. |

### 2.2 Field validation (identical everywhere)

| Field kind | Rule | Normalisation on save |
|---|---|---|
| Name (person, company, warehouse, role…) | trimmed length ≥ **2** | trim |
| Email | `local@domain.tld`: `[A-Za-z0-9._%+-]+@` + dotted domain + TLD of ≥ 2 letters | trim, lower-case |
| Cameroon phone | after removing non-digits and a leading `+237`/`00237`/`237` (when > 9 digits): exactly 9 digits matching `^(6[2-9]\|2[2-4])\d{7}$` | stored as `+237 677 099 845` |
| National ID card (CNI) | 2016 card: `^\d{9}$`; 2025/26 card: `^A[A-Z0-9]\d{8}$` (spaces ignored, case-insensitive) | spaces removed, upper-case |
| Password (server) | 8–72 chars (8–120 for change/reset) | hashed (bcrypt) |
| Password (UI rules shown) | ≥ 8 chars, ≥ 1 uppercase, ≥ 1 special char | — |

Blank optional fields are stored as NULL. On updates, a field sent as `""` is **cleared**, while a field that is left out is **kept**.

### 2.3 Record lifecycle policy

- **Money and stock records are never deleted or edited after the fact.** Payments are *voided* and expenses *cancelled* (both keep a reason/status trail). Stock is corrected by *adjustment* movements.
- **Master data is deactivated, not deleted**: partners, employees, users, warehouses all have an `active` flag. Only deactivated **user accounts** enter the retention/purge workflow (§13.7).
- A **closed till is never rewritten**: anything that would put cash back into a closed session is refused (`CASH_SESSION_CLOSED`).
- Every state-changing action writes an **audit event** in the same transaction (§13.6, Appendix B).

### 2.4 Document numbers

Every printed document number is derived from the record, so reprinting gives the same number:

```
PREFIX-YYYY-XXXXXX
  YYYY   = year of the record's own date (purchase date, advance date, departure date, opening date)
  XXXXXX = first 6 alphanumeric chars of the record id, upper-case
```

| Document | Prefix | Date used |
|---|---|---|
| Purchase receipt | `RCP` | purchase date |
| Prefinance receipt | `PF` | advance date |
| Delivery note | `BL` | departure date, else creation date |
| Till report | `CS` | opening time |
| Payslip | `PAY-YYYYMM-XXXXXX` | the payslip month; id part = employee id |

**Odoo:** use `ir.sequence` per document type instead (`RCP/2026/00042`). That is more readable and gap-checked. Keep the formats above only if continuity with printed history matters.

---

## 3. Roles, permissions and access rules

### 3.1 Permission vocabulary

Per-verb permissions (`READ`, `CREATE`, `UPDATE`, `DELETE`) on these areas:

`USER, ROLE, EMPLOYEE, PARTNER, CONTRACT*, PRICE, PURCHASE, PAYMENT, PREFINANCE (+SETTLE), INVENTORY, LOGISTICS, EXPENSE, PAYROLL, CASH_SESSION, SYNC*, TENANT†, WAREHOUSE`, plus singletons `REPORT_READ`, `AUDIT_READ`.

\* `CONTRACT_*` and `SYNC_*` exist but nothing uses them (§16).
† `TENANT_*` is platform-only (SaaS operator). Drop it in a self-hosted build.

### 3.2 Built-in roles (re-seeded on every start, cannot be edited)

| Role | Scope | Meaning | Permissions |
|---|---|---|---|
| `SYSTEM_ADMIN` | Platform | SaaS operator | all |
| `BOSS` | Company (all warehouses) | owner / company admin | all except `TENANT_*` |
| `STAFF` | One warehouse | office staff, read-mostly | EMPLOYEE_READ, PARTNER_READ, CONTRACT_READ, PRICE_READ, PURCHASE_READ, PAYMENT_READ, PREFINANCE_READ, INVENTORY_READ, LOGISTICS_READ, EXPENSE_READ, PAYROLL_READ, CASH_SESSION_READ, REPORT_READ, WAREHOUSE_READ |
| `BUYER` | One warehouse | field buyer with an account (read-only) | PRICE_READ, PURCHASE_READ, PAYMENT_READ, PREFINANCE_READ, REPORT_READ |
| `INVENTORY` | One warehouse | warehouse operator | PARTNER_READ, PURCHASE_READ, INVENTORY_READ/CREATE/UPDATE, LOGISTICS_READ/CREATE/UPDATE, REPORT_READ |
| `CASHIER` | One warehouse | one till | PRICE_READ, PURCHASE_READ, PAYMENT_READ/CREATE, EXPENSE_READ/CREATE, PAYROLL_READ/CREATE, CASH_SESSION_READ/CREATE/UPDATE, EMPLOYEE_READ, WAREHOUSE_READ |

Note: the cashier **cannot create purchases** with the built-in role (no `PURCHASE_CREATE`). A company that wants cashiers to record purchases at the scale gives them a custom role.

### 3.3 Role-based rules that are NOT plain permissions

| Rule | Where |
|---|---|
| Only a user holding the **CASHIER role** can **open** a till, and only their own; only the cashier who opened a till can **close** it (`TILL_CASHIER_ONLY`). | Till |
| A cashier can **never add provisions** (`PROVISION_NOT_ALLOWED`); provisions come from non-cashiers holding `CASH_SESSION_UPDATE` (the boss). | Till |
| The **Analysis** page and API are **BOSS-only** (role check, not permission). | Analysis |
| The **Retention** page: BOSS (own company) and SYSTEM_ADMIN. Only SYSTEM_ADMIN can "Delete now". | Retention |
| Editing **company contact details**: BOSS or SYSTEM_ADMIN. | Company |
| Pages marked *company-only* are hidden from the platform admin (purchases, stock, till, partners, payroll, pricing…). | Navigation |

### 3.4 User & role administration rules

- A user may hold **several roles**. Effective permissions = union of the roles' permissions.
- **Custom roles** belong to the company. Name: 2–64 chars, no commas, unique case-insensitively against built-in **and** company roles.
- An actor can only **create or change a custom role using permissions they hold themselves** (`ACCESS_DENIED: You can only change permissions you hold yourself: …`).
- An actor can only **assign a role whose every permission they hold**. Platform roles can only be assigned by the platform admin.
- Nobody can **change their own roles** or **disable their own account**.
- Built-in roles can't be edited or deleted. The UI offers **"Duplicate"** to start a custom copy.
- A custom role can be deleted only when **no user holds it**.
- Accounts outside the actor's company are reported as **not found** (never "forbidden"), so their existence isn't revealed.

### 3.5 Odoo mapping

- One `res.groups` per permission is too granular for Odoo UX. Recommended: one **group category "Keuka"** with groups that mirror the built-in roles (`Boss`, `Staff`, `Buyer (read-only)`, `Inventory`, `Cashier`), implied-group chains, and `ir.model.access` + record rules per model.
- Keep a technical **"Keuka permission" layer** only if custom roles must stay (see §17.3). Otherwise, custom roles = admins combine Odoo groups.
- The role-based rules in §3.3 are **code checks** in model methods (e.g. `if not self.env.user.has_group('keuka.group_cashier'): raise UserError(...)`), not access rights.

---

## 4. Data model

All business records belong to one company (`company_id` in Odoo; `enterprise_id` today) and carry `create_uid/create_date/write_uid/write_date`. "recorded_by" below = the user who did it.

Suggested Odoo technical names are given in brackets.

### 4.1 Company [`res.company` extension]

| Field | Type | Rules |
|---|---|---|
| display_name | char(160) | required, never empty; shown in the app and on documents |
| legal_name | char(200) | optional; **watermark & letterhead use legal name, else display name** |
| company_code | char(32) | unique, upper-case (SaaS identity; optional self-hosted) |
| unique_id | char(32) | unique registration id (SaaS; optional) |
| address | char(255) | letterhead |
| phone | char(40) | CM phone; letterhead |
| email | char(160) | letterhead |
| status | ACTIVE / SUSPENDED / CLOSED | SaaS only |

On creation, a company gets: the default warehouse `main` ("Main warehouse"), the **8 default expense categories** (§9.1), a BOSS account (invited by email), and a 30-day trial (SaaS).

### 4.2 Warehouse [`keuka.warehouse`, or reuse `stock.warehouse` name/code only]

| Field | Type | Rules |
|---|---|---|
| code | char(32) | required, lower-case, **unique per company**, immutable after creation; UI generates it from the name |
| name | char(160) | required, name rule |
| location | char(255) | optional |
| active | bool | default true |

The **default warehouse** is the first active warehouse ordered by code. A user with a warehouse role is attached to one warehouse; at login the session is bound to that warehouse, or to the default one for a BOSS.

### 4.3 Partner [`res.partner` extension with `keuka_type`]

| Field | Type | Rules |
|---|---|---|
| name | char(160) | required, name rule |
| type | FARMER / BUYER / COMMERCIAL / LOGISTICS / OTHER | required |
| kind | INDIVIDUAL / COMPANY | default COMPANY for COMMERCIAL & LOGISTICS, else INDIVIDUAL; user may override |
| contact_person | char(160) | name rule when present; "the person you deal with at this company" |
| id_card_number | char(120) | optional, CNI rule; **only for INDIVIDUAL** (UI hides/doesn't send it for COMPANY) |
| registration_number (RCCM) | char(64) | optional; **only for COMPANY** |
| tax_number (NIU) | char(32) | optional; **only for COMPANY** |
| phone | char(40) | CM phone |
| address | char(255) | labelled "Location" for companies |
| trusted | bool | default false; **only meaningful for BUYER**: gates prefinancing |
| active | bool | default true; deactivated partners are not offered for new purchases/loadings/prefinances |
| notes | char(255) | AI note suggestion available (context PARTNER) |

### 4.4 Employee [`hr.employee` extension]

Personnel record, **not** a login. Field buyers are partners, never employees.

| Field | Type | Rules |
|---|---|---|
| full_name | char(160) | required, name rule |
| email | char(160) | optional, unique when present, email rule |
| id_card_number | char(160) | **required**, CNI rule |
| phone | char(40) | CM phone |
| employee_type | DRIVER / MECHANIC / LOADER / FINANCIAL_SECRETARY / CASHIER / WAREHOUSE_CLERK / ADMINISTRATIVE / OTHER | required |
| hire_date | date | optional, but required before any payout; "salary is due one month after this date" |
| monthly_salary | money | optional, > 0; "caps the advances paid in the first month"; required for accrual & advances |
| active | bool | default true |
| user_id | m2o user | set when an account is linked (one account max per employee) |
| salary_due | money | **system-maintained**: what the company owes now |
| advance_balance | money | **system-maintained**: first-month advances not yet repaid |
| salary_months_accrued | int | **system-maintained**: months already added |
| notes | text(255) | AI note suggestion (context EMPLOYEE) |
| *salary_due_from* (computed) | date | hire_date + 1 month |
| *next_salary_date* (computed) | date | hire_date + (months_accrued + 1) months |

### 4.5 User account [`res.users` extension]

| Field | Rules |
|---|---|
| username (login) | 3–80 chars, unique case-insensitive |
| full_name | required, name rule |
| email | required, unique case-insensitive |
| roles | ≥ 1 |
| warehouse_id | required for warehouse-scoped roles; null for BOSS |
| employee_id | **required when a company user (boss) creates the account**; the employee must be active and not already linked |
| active | |
| must_change_password | true after an admin-set temporary/reset password |
| email_verified_at | set when an invitation link is used |
| last_login | |
| *invitation_pending* (computed) | never logged in and email not verified |

### 4.6 Cocoa price [`keuka.price`]

| Field | Type | Rules |
|---|---|---|
| price_per_kg | money | required, > 0 |
| currency | char(8) | default XAF |
| effective_from | datetime | default now |
| status | SCHEDULED / ACTIVE / SUPERSEDED / CANCELLED | set by the system |
| set_by | char | username of publisher |

### 4.7 Purchase [`keuka.purchase`] — one per seller per business day

| Field | Type | Notes |
|---|---|---|
| farmer_id | m2o partner (FARMER) | exactly one of farmer/buyer in practice |
| buyer_id | m2o partner (BUYER) | |
| business_date | date | the purchase day in Africa/Douala; **unique key (business_date, farmer_id, buyer_id)**, null-safe |
| purchase_date | datetime | time of the **latest** delivery line |
| gross_weight | kg | Σ lines |
| net_weight | kg | Σ lines |
| refraction | kg | Σ lines that have one (null if none) |
| humidity | % | **gross-weighted average** of lines that measured it (2 dp) |
| unit_price | money | the lines' price if all equal, else amount ÷ net (2 dp) |
| price_id | m2o price | kept only if every line used the same published price; null for agreed (prefinance) prices |
| amount | money | Σ lines |
| currency | | |
| status | RECORDED / PAYABLE / PARTIALLY_PAID / PAID | mirrors the payable (RECORDED is never left in practice) |
| recorded_by | user | creator of the first line |
| notes | text | notes of later lines are appended on new lines |
| **payable** (1:1) | see 4.9 | |

### 4.8 Purchase delivery line [`keuka.purchase.line`] — one weighing

| Field | Type | Rules |
|---|---|---|
| purchase_id | m2o | |
| delivered_at | datetime | |
| gross_weight | kg | required, > 0 |
| humidity | % | optional, 0–100 |
| refraction | kg | optional |
| net_weight | kg | required, > 0, **≤ gross** |
| unit_price | money | price applied to this line |
| price_id | m2o price | null when the agreed prefinance price applied |
| amount | money | line value |
| prefinance_settled | money | part of the line's value that repaid prefinances |
| recorded_by, notes | | |

### 4.9 Payable [`keuka.purchase` fields, or a separate `keuka.payable`]

| Field | Rules |
|---|---|
| purchase_id | unique |
| amount | what is owed in total (grows with same-day lines) |
| paid_amount | Σ non-voided payments, offsets included |
| remaining | amount − paid_amount |
| due_date | exists, **never set** (§16) |
| status | OPEN (paid = 0) / PARTIALLY_PAID (0 < paid < amount) / PAID (paid ≥ amount) |

Recommendation: fold the payable into the purchase as `amount_paid`, `amount_due` (stored computed) and `payment_state`.

### 4.10 Payment [`keuka.payment`]

| Field | Rules |
|---|---|
| payable/purchase | required |
| amount | > 0, ≤ remaining at the time |
| currency | |
| payment_date | default now |
| method | CASH / BANK_TRANSFER / MOBILE_MONEY / OTHER / **PREFINANCE_OFFSET** (system-only) |
| reference | ≤ 80–120 chars; for non-cash; `PREFINANCE:<prefinance id>` for offsets |
| cash_session_id | set for CASH |
| status | RECORDED / VOIDED |
| recorded_by | |
| *partner name, purchase date* (related, for the register) | |

### 4.11 Prefinance (advance) [`keuka.prefinance`]

| Field | Rules |
|---|---|
| buyer_id | partner of type BUYER, **trusted** |
| amount | money > 0: the advance agreed |
| disbursed_amount | Σ disbursements, ≤ amount |
| currency | from the current price, default XAF |
| historical_unit_price | **agreed price per kg**, frozen; repayment always uses it |
| price_id | set only if the price came from the published price (no agreed price given) |
| advance_date | default now |
| delivered_quantity | kg of cocoa that repaid it |
| delivered_value | money repaid |
| *outstanding_advance* | amount − delivered_value |
| status | OPEN / PARTIALLY_SETTLED / SETTLED (/ COMPANY_OWES_BUYER, now unreachable) |
| notes | ≤ 500; AI suggestion (context PREFINANCE) |
| recorded_by | |

### 4.12 Prefinance disbursement [`keuka.prefinance.disbursement`]

`prefinance_id, amount, method, disbursed_at (default now), cash_session_id, reference (≤80), recorded_by`.

### 4.13 Prefinance settlement [`keuka.prefinance.settlement`] (today: `buyer_deliveries`)

One row per (purchase delivery × prefinance it repaid): `prefinance_id, purchase_id, quantity (kg, 3 dp), unit_price_snapshot, delivered_value, delivered_at, notes ("Settled by purchase"), recorded_by`.

### 4.14 Cash session (till) [`keuka.cash.session`]

| Field | Rules |
|---|---|
| opened_by (cashier) | user |
| opened_at | |
| opening_balance | = declared closing of the cashier's **last closed** session, else 0 (cash carries over) |
| closed_by, closed_at | |
| expected_closing | computed at close: opening + Σ IN − Σ OUT |
| declared_closing | counted cash, ≥ 0 |
| variance | declared − expected (negative = shortage, positive = surplus) |
| status | OPEN / CLOSED; **max one OPEN per cashier** |
| notes | ≤ 255; AI suggestion (context TILL) |
| *available_balance* | live: opening + Σ IN − Σ OUT |

### 4.15 Cash movement [`keuka.cash.move`]

`session_id, movement_type (IN/OUT), amount, occurred_at, reference_type, reference_id, description (≤255), recorded_by`.

`reference_type` values: `PROVISION` (IN), `PURCHASE_PAYMENT` (OUT), `PURCHASE_PAYMENT_VOID` (IN), `EXPENSE` (OUT), `EXPENSE_CANCELLED` (IN), `PREFINANCE_DISBURSEMENT` (OUT), `SALARY_PAYOUT` (OUT).

### 4.16 Cash provision [`keuka.cash.provision`]

`cashier_id, amount (>0), notes (≤255), provided_by, provided_at, session_id (null while pending), applied_at`. Pending = no session yet.

### 4.17 Expense category [`keuka.expense.category`]

`name (≤80, unique per company case-insensitive), description (≤255), code (≤40, set only on defaults, used for translation)`.

### 4.18 Expense [`keuka.expense`]

| Field | Rules |
|---|---|
| category_id | required |
| amount | > 0 |
| currency | XAF |
| expense_date | **always "now"**: back-dating is refused by design |
| description | required, ≤255, "What was bought" |
| beneficiary | ≤160, optional, "Paid to" |
| payment_method | CASH in the UI (others accepted by the server) |
| cash_session_id | set for CASH |
| status | RECORDED / CANCELLED |
| cancelled_at, cancelled_by, cancel_reason (≤255, required on cancel) | |
| recorded_by | |

### 4.19 Stock [`keuka.stock.balance`, `keuka.stock.move`]

- Balance: `warehouse_id (unique), quantity_kg ≥ 0`.
- Movement: `warehouse_id, type (RECEIPT/ISSUE/ADJUSTMENT), quantity_kg (absolute, > 0), source_type (PURCHASE_DELIVERY / TRUCK_LOADING / ADJUSTMENT), source_id, moved_at, recorded_by, notes`.

### 4.20 Truck loading [`keuka.truck.loading`] (today: "Delivery")

| Field | Rules |
|---|---|
| partner_id | **COMMERCIAL** partner, required |
| vehicle_number | required, ≤32, stored **trimmed upper-case** |
| vehicle_type | ≤40 |
| driver_name | required, name rule, ≤160 |
| driver_license_number | required, ≤40 |
| driver_phone | CM phone, ≤40 |
| destination | required, ≤200 ("written on the waybill") |
| departure_at | default now |
| bag_count | required integer 1–100 000 |
| declared_net_weight | required kg > 0 |
| declared_gross_weight | **computed, never typed**: net + bag_count × **1 kg** |
| escort_employee_id | optional active employee |
| escort_name | snapshot of the escort's name at loading |
| status | LOADED → DELIVERED (IN_TRANSIT, CANCELLED exist but unused) |
| notes | ≤500; AI suggestion (context DELIVERY) |
| recorded_by | |

Declared weights are **never amended**. What the consignee actually received is written by hand on the printed note.

### 4.21 Salary payout [`keuka.salary.payout`]

`employee_id, amount (>0), paid_at (now), signature_name (required, name rule, ≤160: "the name the employee signed with"), cash_session_id, notes, kind (SALARY / ADVANCE), recorded_by`.

### 4.22 Audit event [`keuka.audit.event`]

`event_type, action (CREATE/UPDATE/DELETE/LOGIN/LOGOUT/NOTIFY), aggregate_type, aggregate_id, actor_user_id, actor_username ("system" for jobs), details (JSON), reason, correlation_id, node_id, company_id, create_date`. Append-only: no edit, no delete.

### 4.23 Retention watch [`keuka.retention.watch`]

`resource_type (UserAccount / BusinessPartner / Employee / Warehouse), resource_id, label, company_id, deactivated_at, notify_at, purge_at, notified_at, purged_at, status (WATCHING / NOTIFIED / CANCELLED / PURGED)`.

### 4.24 Business analysis [`keuka.analysis`] (optional AI)

`period_from, period_to, days, language (fr/en), model, snapshot (JSON), content (markdown ≤10 000 chars), generated_by`.

---

## 5. Module: Pricing

### 5.1 Rules

1. **Publish a price** (`PRICE_CREATE`): `price_per_kg > 0`; `effective_from` defaults to now. The UI says "a price cannot be back-dated" and offers *Today* or empty.
2. On publish: find the price **in force at `effective_from`**. If it started at or before that moment, set it to **SUPERSEDED**. The new price is **ACTIVE**. `set_by` = publisher. Audit `PRICE_PUBLISHED`.
3. **Price in force at instant T** = the non-CANCELLED price with the latest `effective_from ≤ T`. This is used by purchases (at the purchase instant) and by prefinances (fallback).
4. Price rows are immutable. Past purchases keep their snapshot.
5. No current price → purchases are refused with `PURCHASE_PRICE_NOT_FOUND`, and the dashboard tile and the purchase form show "—".

### 5.2 Screen "Cocoa price" (menu Operations › Pricing, `PRICE_READ`)

- Header: title, description "This is the price Cashiers and the Financial Secretary see when recording a purchase." Button **New price** if `PRICE_CREATE`.
- KPI cards: **Current price** (value/kg, "Effective from {date}"); **Change from previous** (± vs previous price); **Price records** (count, "Historical prices preserved").
- Note: "Past purchases keep the price that applied when they were recorded."
- **Price history** table: Effective from · Price per kg · Set by · Status (`Starts later` / `In force` / `Replaced` / `Cancelled`).
- **Publish dialog**:
  - Field *New price per kg (XAF)*, required, > 0. Hint: "This applies to purchases from now on…".
  - Field *Effective from* (date, optional; Today / Clear).
  - Live comparison: "Up/Down {amount} on the current price" / "Same as the current price".
  - Confirmation: "Publish this price? The price becomes {price} per kg. Every purchase recorded from now on will use it, and it cannot be undone." → **Yes, publish it**.

---

## 6. Module: Procurement

### 6.1 Recording a delivery (creating/extending a purchase) — exact algorithm

Input: `farmer_id` XOR `buyer_id`, `purchase_date` (instant, default now), `gross_weight`, `net_weight`, `humidity?`, `refraction?`, `notes?`, `payment?` ("paid now").
Permission: `PURCHASE_CREATE`; with a payment also `PAYMENT_CREATE` (else `ACCESS_DENIED`).
**All of the following is ONE transaction.** If the payment fails (no till, not enough cash), the purchase is not saved either.

1. Neither partner → `PARTNER_REQUIRED`. The partner must exist, be of the expected type (FARMER for farmer_id, BUYER for buyer_id) and be **active**, else `BUSINESS_RULE_VIOLATION`.
2. Humidity outside 0–100 → `INVALID_MEASUREMENT`. Net > gross → `INVALID_MEASUREMENT` ("Net weight cannot exceed gross weight").
3. `day` = purchase_date in Africa/Douala. `price` = price in force at purchase_date, else `PURCHASE_PRICE_NOT_FOUND`.
4. Find the purchase for `(day, farmer_id, buyer_id)`. If none, **create** one: status PAYABLE, unit_price/price_id/currency from `price`, recorded_by = me, notes, amount 0.
5. **Price this delivery** (`kg` = net_weight):
   - Default: `unit_price = price.price_per_kg`, `price_id = price.id`, `amount = round(kg × unit_price, 2)`.
   - If **buyer**: run **prefinance settlement** (§7.3) with `kg`. If ≥ 1 advance was repaid:
     - `agreed` = unit price of the **last** advance repaid.
     - If every repaid advance had the same price: `amount = round(kg × agreed, 2)`.
     - Else: `amount = settled_value + round((kg − settled_kg) × agreed, 2)`.
     - `unit_price = agreed`, `price_id = null`.
   - Else if **buyer** and they have **any** prefinance ever (even settled): `agreed` = the price of their **most recent** prefinance (latest advance_date, then latest creation). `amount = round(kg × agreed, 2)`, `price_id = null`.
   - Farmers and never-prefinanced buyers: the published price.
6. Create the **delivery line** (with `prefinance_settled = settled_value`).
7. **Receive stock**: +kg in the session's warehouse (§10), source `PURCHASE_DELIVERY` / line id, note "Purchase intake".
8. Recompute the purchase totals from **all lines** (§4.7 rules). `purchase_date` = max(existing, this delivery). For an existing purchase, append notes on a new line.
9. **Payable**: new → amount = line amount, paid 0. Existing → amount += line amount, then re-derive the status (a PAID payable becomes PARTIALLY_PAID or OPEN again for the new part).
10. For each settlement slice: create a **PREFINANCE_OFFSET** payment (amount = slice value, reference `PREFINANCE:<id>`, status RECORDED, **no cash movement**) and apply it to the payable.
11. Sync purchase.status from the payable (OPEN→PAYABLE, PARTIALLY_PAID, PAID).
12. Audit `PURCHASE_CREATED` (new) or `PURCHASE_DELIVERY_ADDED` (existing), with the line id, kg, unit price, amount, prefinance settled and the day's total.
13. If `payment` is given: run **Record a payment** (§6.2) against this purchase.

### 6.2 Recording a payment against a purchase

Permission `PAYMENT_CREATE`.

1. `method = PREFINANCE_OFFSET` → refused (system-only).
2. `amount > remaining` → `PAYMENT_EXCEEDS_BALANCE`. Partial payments are allowed.
3. Create the payment (date default now, reference, status RECORDED, recorded_by).
4. If CASH: **resolve the till** (§8.4) from `cash_session_id` or the caller's source till, and record an **OUT** movement `PURCHASE_PAYMENT`. This fails with `CASH_SESSION_REQUIRED`, `CASH_SESSION_CLOSED` or `INSUFFICIENT_CASH` ("Cash available is X, cannot pay Y").
5. Apply to the payable, sync the purchase status. Audit `PAYMENT_RECORDED` (purchase id, amount, remaining).

### 6.3 Voiding a payment

Permission `PAYMENT_DELETE`. The payment is kept, marked VOIDED.

- Already voided → refused. **PREFINANCE_OFFSET can't be voided** ("repays the buyer's prefinance and cannot be voided on its own").
- CASH payment: the cash goes back (**IN** `PURCHASE_PAYMENT_VOID`) into **the same session**, which must still be **open** (`CASH_SESSION_CLOSED` otherwise).
- Payable: paid −= amount (floor 0), re-derive the status; sync the purchase. Audit `PAYMENT_VOIDED`.
- Confirmation text: "Void this payment? The payment of {amount} will be voided: it stays on record, marked voided, and its amount is owed again on the purchase. A cash payment goes back into the till it came from, which must still be open."

### 6.4 Screen "Purchases" (Operations › Purchases, `PURCHASE_READ`, company-only)

- Header button **New purchase** (`PURCHASE_CREATE`).
- Table (paged, 20 rows; newest first recommended): **Farmer or buyer** (name) · **Date** (date-time) · **Net weight** · **Amount** · **Payment** (payable status) · **Recorded by** ("Full name (ROLE)"). Click a row → details. Row actions: View; Edit (`PURCHASE_UPDATE`, see §16).
- Empty state: "No purchases yet — Newly recorded purchases will show up here."

**Purchase form (dialog "Record a purchase")**

| Field | Behaviour |
|---|---|
| Farmer or buyer | Select of **active FARMER and BUYER** partners, shown as "Name (Farmer)" / "Name (Buyer)". Required. If none: "Register an active farmer or buyer before recording a purchase." |
| Gross weight (kg) | Required decimal > 0; placeholder "e.g. 80" |
| Net weight (kg) | Required decimal > 0, ≤ gross; hint "Use the weight the warehouse gave you, after humidity and refraction." |
| Date | Required, default today (local) |
| *Price box* | "Today's price" (or **"Agreed prefinance price"** for a prefinanced buyer) · for a buyer with an open advance: "Purchase value", "Repays prefinance ({kg})" −value · **Amount to pay** (bold). Notes: "This buyer has an open prefinance, so the whole purchase is bought at the agreed price. The repaid part is recorded as a prefinance offset payment; the rest is paid in cash." and "The price is set by the Boss and can't be changed here." |
| *Paid now* section | Shown only for a **new** purchase, if the user has `PAYMENT_CREATE` and amount to pay > 0. Checkbox **Paid now** (ticked by default). Hint when ticked: "The payment is recorded with the purchase. Cash comes out of your till." Unticked: "the purchase is recorded on credit and paid later from Payments." Fields: **Payment method** (Cash, Bank transfer, Mobile money, Other); **Amount paid now** (pre-filled with "left to pay" until the user types; hint "Left to pay: {amount}"); **Reference** (non-cash, ≤120). Cash info line: "Cash available in the till: {amount}", or "No till is open: the cashier must open theirs first. **See the till**". |

The preview of a buyer's settlement in the form **mirrors** §7.3 on the client (oldest advance first, rounding identical). The server's numbers are final.

Validation before the submit is enabled:
- partner, date, gross > 0, net > 0, net ≤ gross;
- a current price exists (new purchase);
- if paid now: amount > 0, ≤ amount to pay (+0.005 tolerance), and for cash ≤ till available and a till open.

Messages: "Enter the amount paid." / "More than what is left to pay." / "More cash than the till holds."

Submit label: **Record and pay** (paid now) / **Record purchase** / **Save** (edit).

After success: the **print prompt** "Print the purchase receipt? The purchase from {name} is recorded. Print the receipt to hand over now." [Print] [Not now].

**Purchase details page** (`/purchases/:id`)
- Back link; title = seller name; button **Print receipt**.
- Card **Seller**: Name, Type (Farmer/Buyer), Phone, Recorded by.
- Card **Weighing**: Gross, Humidity (— if none), Refraction (kg; if empty, gross − net), **Net**.
- Card **Deliveries ({n})**: Delivered (date-time), Gross, Humidity, Net, Price/kg, Amount. Hint: "Same-day deliveries by this partner are added to one purchase. The weights and amount above are the day's totals."
- Card **Price and payment**: status badge; Unit price (applied at purchase) or (agreed on prefinance); **Total amount**; Paid so far; **Still owed**. **Payment history** (needs `PAYMENT_READ`; voided hidden): Date, Method, Reference (an offset links to **Open the prefinance**), Amount.
- Card **Notes**.

### 6.5 Screen "Payments" (Finance › Payments, `PAYMENT_READ`)

- Header button **Record payment** (needs `PAYMENT_CREATE` and `PURCHASE_READ`).
- Table: **Date** · **Paid to** (seller name) · **Purchase / payable** (link) · **Method** · **Amount** · **Status** (Recorded/Voided). Newest first (payment date, then creation). Row actions: View (detail dialog), **Void payment** (`PAYMENT_DELETE`, not voided, not offset).
- **Record a payment** dialog:
  - **Which purchase?** — select among purchases with remaining > 0, labelled "{seller} — owes {remaining}". If none: "Every purchase is already fully paid. Nothing to record."
  - **Amount paid now (XAF)** — required, 0 < x ≤ remaining. Hint: "Total owed: {amount}. You can pay in full or part."
  - **Payment method** (manual methods).
  - **Reference**.
  - Cash requires an open till: "Open a cash session before recording a cash payment." / "You need cash-session access to record a cash payment."
- After success: "Print the updated receipt? The payment is recorded. Print the purchase receipt showing it."

---

## 7. Module: Buyer prefinancing

### 7.1 Creating an advance (`PREFINANCE_CREATE`)

1. The buyer must be a partner of type BUYER (`BUSINESS_RULE_VIOLATION`) and **trusted** (`BUYER_NOT_TRUSTED`).
2. `advance_date` defaults to now. `current` = price in force at that date.
3. Agreed price = `price_per_kg` from the request, else the current price. Neither available → `PURCHASE_PRICE_NOT_FOUND`. `price_id` is set only when the published price was used.
4. Save: status OPEN, disbursed 0, delivered 0. Audit `PREFINANCE_CREATED`.
5. If a `disbursement_method` is given (**the UI always sends CASH**): **disburse the full amount now** (§7.2). If that fails (no till, not enough cash) the whole advance is refused.

### 7.2 Disbursing (handing over cash)

`amount > 0`, `disbursed + amount ≤ prefinance.amount` (else "Disbursement would exceed the prefinance amount"). Allowed **whatever the status**: an advance agreed without cash can be repaid by cocoa before the cash is recorded, and the cash must still be recordable.
CASH → till OUT `PREFINANCE_DISBURSEMENT`, subject to the till rules. Audit `PREFINANCE_DISBURSED`.

### 7.3 Settlement by purchase — exact algorithm

There is **no separate "deliver against prefinance" action**: cocoa a buyer brings is a purchase, and the purchase repays their debt.

```
remaining_kg = purchase line net kg
for each prefinance of the buyer with status in (OPEN, PARTIALLY_SETTLED),
        ordered by advance_date ASC, then created ASC:          # oldest first
    if remaining_kg <= 0: stop
    owed = amount − delivered_value
    if owed <= 0: continue
    price = historical_unit_price
    kg = remaining_kg
    value = round(kg × price, 2)
    if value >= owed:                       # this purchase clears the advance
        value = owed                        # exactly, no rounding dust
        kg = min(round(owed / price, 3), remaining_kg)
    if value <= 0: continue
    create settlement row (kg, price, value, purchase id, note "Settled by purchase")
    delivered_quantity += kg ; delivered_value += value
    status = SETTLED if amount − delivered_value <= 0 else PARTIALLY_SETTLED
    audit PREFINANCE_SETTLED_BY_PURCHASE
    remaining_kg −= kg
```

Repayment is **capped at what is owed**. The surplus kg stays on the purchase's own payable and is paid like any purchase (at the agreed price, §6.1 step 5).

> "Owed" for settlement uses the **amount** of the advance (agreed), not what was disbursed.

### 7.4 Balances

| Figure | Definition |
|---|---|
| Buyer **owes** company | Σ over the buyer's advances of `(disbursed − delivered_value)` where disbursed > delivered |
| Company **owes** buyer | Σ `(delivered_value − disbursed)` where delivered > disbursed **+** Σ unpaid remaining of the buyer's purchase payables |
| Open advances | count of the buyer's advances with disbursed > delivered |
| Company-wide summary | buyers owe (all buyers) · number of buyers in debt · company owes buyers |

The debt **carries over** across cash sessions: a buyer who could not repay can be advanced again, and their cocoa repays the oldest advance first.

### 7.5 Screens

**Partners › Buyers** is the partner register filtered to buyers (§13.3). A buyer row opens **Buyer details** (`PARTNER_READ` + `PREFINANCE_READ`):
- Balance cards: **Owes the company** ("Over {n} advance(s), all cash sessions"); **Company owes the buyer** ("Cocoa delivered, not yet paid"); "Nothing owed".
- Advances table: Advance date · Advanced · Still owed · Cocoa delivered · Status · actions (open, **Print prefinance receipt**, **Hand over advance** when disbursed < amount).
- Button **Add prefinance** (trusted buyer, `PREFINANCE_CREATE`). Button **Record a purchase**. Explanatory note: "Cocoa this buyer brings is recorded as a purchase. The purchase repays this advance first, at the agreed price, and only the rest is paid to the buyer."
- **Delivery history**: every delivery line of this partner (newest first): Delivered · Gross · Net · Price · Amount · Repaid on prefinance; row opens the purchase.

**Add prefinance** dialog:
- Banner: "This buyer still owes {amount} from earlier advances. It carries over." + "Total owed after this advance: {amount}".
- Fields:
  - **Budget amount** (required > 0).
  - **Agreed price per kg** (required > 0; hint "Current market price: {price}/kg. The agreed price can differ.").
  - **Advance date** (default today).
  - **Notes** (with AI *Suggest*).
- Till line: "The advance is handed over in cash from the till (available: {amount})", or "More cash than the till holds.", or "No till is open… See the till".
- Submit **Add prefinance** is disabled without an open till or when the amount exceeds the till.
- After success: print prompt "Print the prefinance receipt? The advance to {name} is recorded. Print the receipt for the buyer to sign."

**Hand over advance** dialog: "This advance was recorded without being handed over. The cash leaves the till and the buyer owes it." Field *To hand over* (≤ amount − disbursed) → **Hand over in cash**.

**Prefinance details** page: advance figures, settlement rows, print button.

---

## 8. Module: Till

### 8.1 Opening (`CASH_SESSION_CREATE` + CASHIER role)

- Not a cashier → `TILL_CASHIER_ONLY`. Already has an OPEN session → `OPEN_CASH_SESSION_EXISTS`.
- opening_balance = declared closing of the cashier's most recent **closed** session (0 if none). Notes optional.
- **Every pending provision** for this cashier goes in (oldest first): an IN movement `PROVISION` each, provision.session_id = this session, applied_at = now.
- Audit `CASH_SESSION_OPENED` {carriedOver, provisions}.
- UI: "The till opens with the cash counted at its last closing, plus the provisions the boss gave you." + "The cash counted at the last closing stays in the till and is added to it."

### 8.2 Provisions (`CASH_SESSION_UPDATE`, **not** a cashier)

- **Give to a cashier** (`cashier_id`, `amount > 0`, notes). The cashier must be an active user of the company holding the CASHIER role (`CASHIER_NOT_FOUND`). If their till is open → it goes in immediately; otherwise it **waits** (pending) and goes in when they open. **The till is never opened for them.**
- **Top up an open till directly** (session id, amount, notes) → IN `PROVISION` now.
- Audit `CASH_PROVISION_ADDED`.
- Cashier picker: lists active cashiers with "Their till is open: the provision goes in at once." / "Their till is closed: the provision waits until they open it." If none: "No active cashier. First create an account with the Cashier role."

### 8.3 Closing (`CASH_SESSION_UPDATE`, only the opener)

Input: `declared_closing ≥ 0`, notes. `expected = opening + Σ IN − Σ OUT`; `variance = declared − expected`. Status CLOSED, closed_by/at. Audit `CASH_SESSION_CLOSED` {expected, declared, variance}. Already closed → `CASH_SESSION_CLOSED`.
UI: "Count the cash in the till. Any difference with the expected amount is recorded as a variance." After closing: "Print the till report? The till is closed. Print its closing report."

### 8.4 Which till pays? (source-till resolution) — used by every cash operation

1. If the request names a session → it must exist and be **OPEN** (`CASH_SESSION_CLOSED`).
2. Else, for the caller:
   - a **cashier** → their own open session, or nothing;
   - **anyone else** → a session they opened themselves (legacy), else the **most recently opened** open session of a cashier **at the caller's warehouse**, else the most recently opened open session in the company.
3. Nothing found → `CASH_SESSION_REQUIRED` ("No till is open: a cashier must open theirs before cash can be paid").
4. OUT movement > available → `INSUFFICIENT_CASH`.

`GET current till` follows the same resolution, so the boss's till page shows "{name}'s till, which your cash payments come from."

### 8.5 Screen "Till" (Finance › Till, `CASH_SESSION_READ`)

- Header actions depend on the state:
  - Till open: **Print till report**; **Add provision** (provider); **Record expense** (`EXPENSE_CREATE`); **Close till** (owner).
  - Till closed: **Open till** (cashier) or **Add provision** (boss).
- Closed state messages:
  - "Your till is closed — Open your till to receive the waiting provisions and record cash payments." (cashier)
  - "No till is open. You can already give a provision: it goes into the till when the cashier opens it." (boss)
  - "Only a cashier opens the till…" (others)
- Open state KPI cards: **Opening float**, **Provisions** ({n} provisions), **Paid out**, **Available now** ("Opened {date}").
- Tables:
  - **Provisions** (this session).
  - **All movements**: When · Type (reference-type label) · Description · Amount (signed).
  - **Provisions waiting for the till to open**: Cashier (boss only) · Amount · Given by · When · Description.
  - **Till history**: Cashier · Opened · Status · Opening float · Cash in till (available if open, declared if closed) · Variance (red if negative, green with "+" if positive). A row opens **Till of {name}** details with its movements and print.

---

## 9. Module: Expenses

### 9.1 Default categories (created for every new company)

| Code | Name (EN) | Description |
|---|---|---|
| VEHICLE_PARTS | Vehicle parts & repairs | Spare parts, tyres, mechanic |
| FUEL | Fuel | Fuel for trucks and motorbikes |
| OFFICE_SUPPLIES | Office supplies | Paper, ink, stationery, small equipment |
| TRANSPORT | Transport & travel | Fares, tolls, travel costs |
| UTILITIES | Utilities | Electricity, water, phone, internet |
| CASUAL_LABOUR | Casual labour | Day workers and loaders paid in cash |
| MAINTENANCE | Maintenance & cleaning | Warehouse upkeep, repairs, cleaning |
| OTHER | Other | Anything that fits nowhere else |

Default categories are displayed translated through `code`. Company-created categories have no code and are shown as typed.

### 9.2 Rules

- **Record** (`EXPENSE_CREATE`): category must exist; amount > 0; description required (trimmed); beneficiary optional; `expense_date = now` (no back-dating). CASH → resolve the till (§8.4), OUT `EXPENSE` with description "{category}: {description}" (`INSUFFICIENT_CASH` etc.). Non-cash → no till movement. Audit `EXPENSE_RECORDED`.
- **New category** (`EXPENSE_CREATE`): name unique case-insensitive in the company (`CONFLICT` "Category already exists").
- **Cancel** (`EXPENSE_DELETE`, "the boss"): reason required (≤255); not already cancelled. CASH with a session → IN `EXPENSE_CANCELLED` into **that** session, which must still be open. Status CANCELLED + cancelled_at/by/reason. Audit `EXPENSE_CANCELLED` (reason in the audit `reason`).
- List: newest first (expense date, then creation); filter by category and by till session.

### 9.3 Screen "Expenses" (Finance › Expenses, `EXPENSE_READ`)

- Header **Record expense**. Filter **category** (All categories).
- Table: Date · Category · What for (+ "Paid to {name}", + "Cancelled: {reason}") · Amount · Status (Recorded/Cancelled). Row action **Cancel expense** (`EXPENSE_DELETE`, recorded only).
- **Record an expense** dialog: "Paid in cash from the open till. The till goes down by this amount."
  - "In the till now: {amount}" / "Expenses are paid from the till: open the till first."
  - **Category** (select, with inline **New category** text + **Add**).
  - **Amount** (≤ till: "The till holds only {amount}.").
  - **What was bought** (required; e.g. "Brake pads for the Hilux, 2 reams of paper").
  - **Paid to** (optional: "The shop, garage or person who received the cash").
  - Submit **Record and pay**.
- Cancel dialog: "Cancel this expense? {amount} for "{what}" goes back into the till it was paid from. The expense stays in the list, marked cancelled." Field "Why is it cancelled?" → **Cancel the expense**.

---

## 10. Module: Inventory

### 10.1 Rules

- Stock = **one balance per warehouse** (kg) + an append-only movement ledger. There are no batches or lots.
- Warehouse resolution for any movement: explicit warehouse → the warehouse of the user's session (the user's warehouse, or the default warehouse for the boss) → the company default warehouse.
- Each movement: quantity ≠ 0 (`INVALID_MEASUREMENT` "Stock quantity must not be zero"). The resulting balance must stay **≥ 0** (`INSUFFICIENT_STOCK` "Stock is X kg; cannot apply −Y"). Movements store the absolute quantity + type. Audit `STOCK_RECEIPT` / `STOCK_ISSUE` / `STOCK_ADJUSTMENT` {warehouseId, deltaKg, onHand}.
- Sources: purchase delivery line → RECEIPT; truck loading → ISSUE (declared net); manual **adjustment** (`INVENTORY_UPDATE`): `quantity_kg > 0` + `inbound` (true = increase, false = decrease) + notes (business reason) → ADJUSTMENT.

### 10.2 Screen "Inventory" (Operations › Inventory, `INVENTORY_READ`)

- KPI: **Total stock** (kg of the session's warehouse).
- Movements table (paged, newest first): Movement (Receipt/Issue/Adjustment) · Quantity · Date · Notes (else source type).
- **To add in Odoo**: an **Adjust stock** action (`INVENTORY_UPDATE`): direction (Increase/Decrease), quantity, **reason required** ("Business reason for the adjustment; stored for audit"). The API exists but today's UI doesn't expose it.

---

## 11. Module: Logistics

### 11.1 Rules

- **Record a truck loading** (`LOGISTICS_CREATE`): partner must be **COMMERCIAL** ("Deliveries go to COMMERCIAL partners"). The escort, if given, must be an **active employee** (`EMPLOYEE_NOT_FOUND`). Normalise the fields as in §4.20. gross = net + bags × 1 kg. Status LOADED. **Issue the declared net weight from stock** (source TRUCK_LOADING, note "Loaded out"): fails with `INSUFFICIENT_STOCK`. Audit `TRUCK_LOADED`.
- **Mark as delivered** (`LOGISTICS_UPDATE`): status → DELIVERED. Audit `DELIVERY_COMPLETED`.
- Loadings are never edited after recording ("Declared weights cannot be changed afterwards").

### 11.2 Screen "Logistics" (`LOGISTICS_READ`)

- Header **New delivery** (`LOGISTICS_CREATE`). Filter by status.
- Table: Vehicle · Driver · Destination · Departed · Status (+ declared net weight). Row → details dialog: **Trip**, **Driver**, **Declared weights**, Recorded; buttons **Print delivery note**, **Mark as delivered** (`LOGISTICS_UPDATE`, if not delivered).
- **Record a truck loading** form ("Capture the trip and the weights declared at loading. Declared weights cannot be changed afterwards."):

| Field | Rules / text |
|---|---|
| Commercial partner | required; active COMMERCIAL partners; "No active commercial partner yet. Add one before recording a delivery." |
| Destination | required ≤200; "e.g. Douala port warehouse" |
| Plate number | required ≤32; "e.g. LT 123 AB" |
| Vehicle type | ≤40; "e.g. 10-tonne truck" |
| Driver name | required, name rule |
| Driver licence number | required ≤40 |
| Driver phone | CM phone |
| Declared net weight | required > 0; "In stock: {weight}" / "Only {weight} in stock." (if `INVENTORY_READ`) |
| Number of bags | required integer ≥ 1 |
| Declared gross weight | read-only computed; "Net weight + 1 kg per bag, calculated." |
| Departure date | date, default today |
| Escort | optional employee ("No escort"); "An employee travelling with the load (optional)." Needs `EMPLOYEE_READ`, else "You cannot see the staff list: no escort can be chosen." |
| Notes | AI *Suggest* |

Submit **Record loading** → print prompt "Print the delivery note? Truck {vehicle} for {name} is recorded. Print the note to travel with it."

---

## 12. Module: Personnel & Payroll

### 12.1 Employees (Admin › Personnel, `EMPLOYEE_READ`)

- KPIs: Total / Active / Inactive employees. Search (name or phone), status filter.
- Table: Employee · Work type · Phone ("Not provided") · Status · Actions (View, Edit).
- Form ("Add an employee" / "Edit employee"): Full name*, Work type*, Phone, Email, **ID card number*** (CNI), Hire date ("Salary is due one month after this date."), Agreed monthly salary ("Caps the advances paid in the first month."), Active (edit), Notes (AI).
- **Create/update triggers salary catch-up immediately** (a past hire date or a new salary can already make months due). Audit `EMPLOYEE_CREATED` / `EMPLOYEE_UPDATED`.
- Employees are deactivated (Active off), never deleted (today's UI shows "Delete"; implement as archive).

### 12.2 Automatic salary accrual — exact algorithm

Runs: **nightly at 00:05 Africa/Douala**, **at server start** (catches up missed nights), on every employee create/update, and **before every payout**.

```
skip if not active or hire_date is null or monthly_salary is null
completed = number of n ≥ 1 such that hire_date + n months ≤ today
            # month n ends on hire_date + n months; 31 Aug hire → first month completes 30 Sep
if completed <= salary_months_accrued: stop
months  = completed − salary_months_accrued
earned  = monthly_salary × months
repaid  = min(earned, advance_balance)            # advances are repaid first
advance_balance −= repaid
salary_due      += earned − repaid
salary_months_accrued = completed
audit SALARY_ACCRUED {months, throughDate, amount, advanceRepaid, salaryDue, advanceBalance}  # actor "system"
```

Idempotent: running it twice never adds a month twice.

### 12.3 Paying an employee (`PAYROLL_CREATE`) — always cash from the till

1. No hire date → `HIRE_DATE_REQUIRED`.
2. Catch up the accrual (§12.2).
3. **Advance period** = today < hire_date + 1 month.
   - Advance: needs monthly_salary (`AGREED_SALARY_REQUIRED`); amount ≤ monthly_salary − advance_balance (`ADVANCE_LIMIT_EXCEEDED`, "Advances cannot exceed the agreed salary: X left").
   - Salary: amount ≤ salary_due (`INSUFFICIENT_SALARY_DUE`).
4. Resolve the till (§8.4); create the payout (signature name trimmed, kind ADVANCE/SALARY); OUT `SALARY_PAYOUT` "Salary advance to {name}" / "Salary collected by {name}" (`INSUFFICIENT_CASH`).
5. Advance → advance_balance += amount; salary → salary_due −= amount. Audit `SALARY_ADVANCED` / `SALARY_COLLECTED`.

### 12.4 Screen "Salaries" (Finance › Payroll, `EMPLOYEE_READ` + `PAYROLL_READ`)

- KPIs: Salary due on this page; Employees with salary due.
- Table: Employee · Work type · Due amount · Status (**Due** / **Settled**). Actions: **Collection history**, **Collect salary**.
- Employee dialog:
  - **Currently owed** {salary_due}.
  - "Outstanding advances: {amount} (repaid by the next salary)."
  - "Next month of salary ({amount}) is added on {date}."
  - Warnings: "No agreed monthly salary is recorded, so no salary is being added." · "Record this employee's hire date before paying them." · first month: "First month: salary is due from {date}. Any payment before then is an advance on the agreed salary."
  - Mode **Pay salary** / **Pay advance**:
    - **Cash collected** / **Advance amount**, ≤ min(limit, till available). Hints: "Cannot exceed salary due ({due}) or available till balance ({till})." / "Up to {due} left of the agreed salary; the till holds {till}."
    - **Employee signature name** (required, ≤160).
    - Notes (AI).
    - Submit **Record signed collection** / **Record signed advance**. "Open a cashier till before recording a cash salary collection." when no till.
  - Mode **History**: signed collections (newest first): date, amount, "Advance" badge, "Signed by {name}", notes. **Print payslip** for a month.
- After a payout: "Print the payslip? The payment to {name} is recorded. Print this month's payslip for their signature."

### 12.5 Payslip month logic

Payslip for month M (local `YYYY-MM`): payouts whose **local** paid date falls in M; `paid` = Σ amounts; gross = net = paid; "Still owed" = current salary_due; payment date = latest payout in M; method Cash; received by = distinct signature names; status PAID if paid > 0 else PENDING (stamp "Paid").

---

## 13. Module: Administration

### 13.1 Company details ("My enterprise", BOSS)

- **Company details** card (read-only identity): name, legal name, code. "Contact the system administrator to change the company name or plan." (SaaS)
- **Contact details** card: "Printed on the letterhead of your receipts and payslips." **Edit company details**:
  - Company name (required, never empty).
  - Legal name (optional; "The registered name, if different").
  - Address ("e.g. Douala, Bonabéri industrial zone").
  - Phone (CM rule).
  - Email.
- **Warehouses** card: list + **Create warehouse** (name; code auto-generated from the name, lower-case, unique; location) and **Update warehouse** (name, location). "A warehouse sets the scope of the till, the stock and the staff working in it." Audit `WAREHOUSE_CREATED` / `WAREHOUSE_UPDATED`.
- Banner if access is blocked: "This company's access is currently suspended, so new records cannot be saved."

### 13.2 Users (Admin › Users, `USER_READ`)

- Table: Name/username · Email · Roles · Company (platform admin only, with "All companies" filter) · Status (ACTIVE/INACTIVE, "Invitation sent") · Last login. Actions: View details (effective permissions summary "{n} permissions across {m} modules"), Edit, Disable/Enable, **Resend invitation** (pending only), Reset password.
- **Create user** (`USER_CREATE`):
  1. **Employee** (required for a company user): active employees without an account, sorted by name. Selecting one pre-fills name, email and the **suggested role**: CASHIER→CASHIER, WAREHOUSE_CLERK→INVENTORY, FINANCIAL_SECRETARY/ADMINISTRATIVE→STAFF, others none. "Every active employee already has an account. Add the employee in Personnel first." (`EMPLOYEE_REQUIRED`, `EMPLOYEE_ALREADY_HAS_ACCOUNT`.)
  2. **Username**: suggested = slug(first name) + "." + slug(current warehouse code), e.g. `alma.main` (accents removed, lower-case, `[a-z0-9]` only, ≥3 chars, numbered `alma.main2`… while taken). Editable.
  3. Full name, Email.
  4. **Roles** (≥ 1, only assignable ones, §3.4).
  5. **Temporary password** (optional). Empty → an **invitation email** is sent (link valid **48 h**, single-use, a newer one invalidates older ones): "The employee receives an email to confirm their address and choose their own password. Nobody else ever sees it." Filled → no email; the user must change it at first sign-in: "No email will be sent: give this password to the person."
  - Checks: username/email unique (`USERNAME_TAKEN`, `EMAIL_TAKEN`); plan user limit (SaaS).
  - Warehouse: given, else the creator's current warehouse; BOSS has none. Audit `USER_CREATED`.
- **Edit**: name, email (unique), roles (not your own), active, warehouse. Audit `USER_UPDATED`.
- **Disable** ("Deactivate this account? {name} will no longer be able to sign in. The account record and its audit history will be retained."): not yourself. Starts a **retention watch** (§13.7). Audit `USER_DISABLED`. **Enable** cancels the watch (plan limit re-checked). Audit `USER_ENABLED`.
- **Reset password** (`USER_UPDATE`): an admin sets a temporary password (8–120); must_change_password = true. Audit `USER_PASSWORD_RESET`.
- **Resend invitation** (`USER_CREATE`): only if never verified/logged in and active. Audit `USER_INVITATION_SENT`.

### 13.3 Partners (Operations › Partners, `PARTNER_READ`)

Sub-menus: **All partners** (every type, inactive included) · **Buyers** · **Farmers** · **Commercial partners** · **Logistics partners** · **Other partners** (each type list shows **active** partners of that type).

- Table: Name · Type · ID/RCCM · Phone · Status (Active/Inactive; buyers: "Trusted for prefinancing" / "Not trusted…"). Actions: View, Edit (`PARTNER_UPDATE`), **Deactivate/Reactivate**.
  - Deactivate: "{name} will no longer be offered for new purchases, deliveries or prefinances. Existing records are kept, and you can reactivate them from All partners."
- Form (titles per section, e.g. "Add buyer"):
  - **Partner type** (only in "All", on create).
  - **Partner is** Individual/Company (follows the type until the user picks).
  - **Full name / Legal name***.
  - Contact person ("The person you deal with at this company").
  - Individual: **ID number** (CNI).
  - Company: collapsible **Official identifiers (optional)**: RCCM, NIU.
  - Phone, Address/Location.
  - **Trusted buyer** (buyers only: "Trusted buyers are eligible for prefinance budgets").
  - Notes (AI).
- Audit `PARTNER_CREATED` / `PARTNER_UPDATED`. **Partner details** page: identity, contacts, timestamps; for buyers → buyer details (§7.5).

### 13.4 Roles (Admin › Roles, `ROLE_READ`)

- Role picker grouped **Built-in** / **Custom**. A built-in role shows its permissions read-only with "Built-in roles can't be edited. Duplicate this role to make a version with different permissions." and **Duplicate**.
- Custom role editor: name, description (defaults to the name), permission checklist grouped by module with "Select all {module}", selected count; Save (`ROLE_UPDATE`), Delete (`ROLE_DELETE`, refused while assigned: "This role is still assigned to users. Reassign them before deleting it."), **New role** (`ROLE_CREATE`). Discard-changes prompt.
- Audit `ROLE_CREATED` / `ROLE_UPDATED` {added, removed} / `ROLE_DELETED`.

### 13.5 Permissions overview (Admin › Permissions)

Read-only per-user view: choose a user → their roles and effective permissions by module. "Permissions come from roles, so they are read-only here. Change the roles above, or edit a role on the Roles page."

### 13.6 Audit log (Admin › Audit, `AUDIT_READ`)

- Newest first (time, then id). Free-text search over event type, action, actor, aggregate type, reason, or a record id. Filter by event type.
- Columns: What happened (event type + aggregate) · Who · When · Event type; row → details JSON.
- Company users see their company's events only.
- Empty: "Nothing recorded yet." No match: "No event matches "{term}". Try a user name, an action such as PURCHASE, or a record id."

### 13.7 Data retention (Admin › Retention; BOSS & SYSTEM_ADMIN)

- When a user account is disabled, a watch is created: notify_at = now + **retention period** (default **30 days**), purge_at = notify_at + **14 days** notice. One open watch per resource.
- Nightly job **03:30**:
  - watches due for notice → status NOTIFIED (audit `PURGE_NOTICE`, actor system, reason "Inactive for N days; hard delete scheduled");
  - NOTIFIED watches past purge_at → **hard delete** of the resource (if hard-delete enabled), status PURGED (audit `PURGE_EXECUTED`).
- Re-enabling the account cancels the watch.
- Screen columns: Record (label) · Type · Deactivated · Deleted on ("Today" / "In n days") · Status (Scheduled/Notified/Kept/Deleted) · Actions **Keep** (cancel: "Keep this record? "{label}" will not be deleted. It stays deactivated.") and **Delete now** (platform admin only: "…will be erased right away. This cannot be undone.").

**Odoo note:** hard-deleting a `res.users` that authored records breaks foreign keys. Archive instead and anonymise personal fields (name → "Deleted user #id", email/login cleared) at purge time. Decide (§16).

### 13.8 Authentication & account self-service

| Feature | Rule |
|---|---|
| Login | username (case-insensitive) + password. Errors: wrong → "Incorrect username or password."; disabled → "This account has been deactivated by an administrator…"; no company → "This account is not linked to a company yet…"; no warehouse; company suspended. |
| Session | access token 30 min, refresh 7 days, **rotating** refresh; logout revokes all refresh tokens. Session-expired page "Your session has ended… Sign in again". |
| Forced password change | must_change_password → every endpoint except the user's own account endpoints answers `PASSWORD_CHANGE_REQUIRED`; the UI routes to **Change password** with "Your account was created with a one-time password. Choose your own password to continue." |
| Change password | current + new (+ confirm). Rules shown: 8+ chars, 1 uppercase, 1 special. Wrong current → `INVALID_CREDENTIALS`. Audit `PASSWORD_CHANGED`. |
| Profile | change own full name and email (email unique). Audit `PROFILE_UPDATED`. |
| Accept invitation (public page) | shows name, username, email, company, expiry; choose password + confirm; success → "Your account is ready. Sign in with your username {u}…"; invalid/expired → "This link no longer works… Ask the person who created your account to send the invitation again." Sets email_verified. Audit `USER_INVITATION_ACCEPTED`. |

**Odoo:** use `auth_signup` (invitation / reset-password emails are native), `res.users` login, and Odoo's own session management. Implement "must change password" with a flag and a controller redirect. Odoo's password policy module (`auth_password_policy`) covers the length rule.

---

## 14. Printed documents

All documents share the same page: **A4 portrait, max content width 180 mm**, white, black text. Odoo: QWeb PDF reports (`report_type = qweb-pdf`), one paper format, translations via `t-lang`.

**Common frame**

- **Watermark**: the company **legal name** (else display name), bold upper-case, ~5 % black, along the page **diagonal** (bottom-left → top-right), spanning ~75 % of the diagonal. Real text, behind the content.
- **Letterhead** (centred): company legal/display name (bold, upper-case), address, "phone · email", then the **document title** (upper-case, underlined).
- **Footer** (small):
  - "Measurements and amounts are recorded facts. Keep this document as proof."
  - Left: copy label (**Original** by default). Right: "Printed {date-time}".
  - Last line: "Ref: {record id}".
- **Signature row**: N equal columns, each with a label and a dashed line about 14 mm above it.
- Missing values print as **—**.

**When printing is offered**: right after the operation succeeds, a dialog ("Print …?" [Print] [Not now]). There is also a print button on the record's page. Documents are always built from **current server data**.

### 14.1 Purchase receipt — "Cocoa purchase receipt" / "Reçu d'achat de cacao"

1. Meta grid: Receipt No (`RCP-YYYY-XXXXXX`) · Farmer/Buyer: name · Date (purchase date-time) · Phone.
2. If the day has **> 1 delivery**: table "Deliveries of the day ({n})": Time · Gross weight · Net weight · Price (/kg) · Amount.
3. "Measurements" (or "Day total" if several lines) "(as recorded at weighing)": Gross weight · Humidity (`x.xx %` or —) · Refraction (kg; if empty, gross − net) · **Net weight** (bold).
4. Boxed money section:
   - "Unit price (applied at purchase)" or, for a buyer priced at their prefinance price (buyer and no price id), "Unit price (agreed on prefinance)": `{price}/kg`.
   - **TOTAL AMOUNT** (bold).
   - If payments are readable:
     - "Repaid on prefinance −{offsets}" (if > 0);
     - one line per non-voided real payment "Paid ({method})" or "Paid ({method}, ref. {ref}) −{amount}";
     - final bold line **STILL OWED {remaining}** or **SETTLED IN FULL {0}**.
5. Signatures (3): Farmer signature / Buyer signature · Warehouse manager · Cashier.

### 14.2 Prefinance receipt — "Prefinance receipt" / "Reçu de préfinancement"

1. Meta: Receipt No (`PF-…`) · Advance date · Buyer · Phone · ID card · Address.
2. Box "Terms of the advance":
   - Agreed price per kg.
   - Cocoa equivalent (= amount ÷ price, 3 dp).
   - **AMOUNT ADVANCED**.
3. Commitment sentence: "I, {name}, acknowledge receiving {amount} and agree to repay it in cocoa at {price}/kg." (FR: "Je soussigné(e) {name} reconnais avoir reçu {amount} et m'engage à le rembourser en cacao au prix de {price}/kg.")
4. "Statement on the printing date": Cocoa delivered (kg) · Value repaid · **Still owed** (amount − delivered value) · Status.
5. Notes (if any).
6. Signatures: Buyer signature · Manager · Cashier.

### 14.3 Delivery note — "Delivery note" / "Bordereau de livraison"

1. Meta: Note No (`BL-…`) · Date (departure, else recorded) · Destination · Status.
2. Two columns:
   - **Consignee**: Name, Location (partner address), Contact person, Phone.
   - **Transport**: Vehicle ("plate · type"), Driver, Driving licence, Phone, Escort (if any).
3. Box **Goods**: "Dried cocoa beans" · Number of bags · Declared gross weight · **DECLARED NET WEIGHT**.
4. Notes.
5. Dashed box **"Reception (filled in by the consignee)"**: "Write the weights actually received. The declared weights above are not changed." Four blank dotted lines: Gross weight received · Net weight received · Received on · Remarks.
6. Signatures: Dispatched by · Driver · Received by.

### 14.4 Payslip — "Employee payslip" / "Fiche de paie"

- Optional big diagonal **status stamp** ("PAID") behind the content, in addition to the watermark.
1. Meta: Payslip No (`PAY-YYYYMM-XXXXXX`) · Period (month name) · Employee · Position (work type) · Phone · ID card · Status (Paid / Not paid yet).
2. **Earnings**: "Salary paid this period" {paid}.
3. **Deductions** (none today; structure supports labelled lines).
4. Box: Gross pay · (Total deductions) · **NET PAY** · Still owed {salary_due}.
5. **Payment details** (if any payout in the month): Paid on · Method (Cash) · Reference · Received by (signature names) · **Amount paid**.
6. Signatures (2): Employee signature · Paid by.
7. The footer reference is the first payout id of the month (else the employee id).

### 14.5 Till report — "Till closing report" / "Till report (interim)" for an open till

1. Meta: Report No (`CS-…`) · Cashier · Opened · Closed ("Still open") · Closed by.
2. Box:
   - Opening float.
   - Provisions +Σ.
   - Cash paid out −Σ.
   - **EXPECTED IN TILL** (closed) or **IN TILL NOW** (open).
   - For a closed till: Cash counted · **Variance** (signed) "(shortage)" / "(surplus)".
3. "Cash paid out by kind": one row per reference type label · ×count · total.
4. "Provisions": When · label · description · +amount ("None" if empty).
5. "All movements": When · type label · description · ±amount.
6. Notes. Signatures: Cashier · Manager.

---

## 15. Dashboards, analysis and AI

### 15.1 Company dashboard (home after login)

- Greeting "Welcome, {name}" + "Access based on: {roles}".
- Tiles, **each shown only if the user can read the source**:

| Tile | Source |
|---|---|
| Current cocoa price (/kg) | `PRICE_READ` |
| Stock on hand (kg) | `INVENTORY_READ` |
| Purchases waiting on payment (count of non-PAID payables; "Needs your attention" / "All settled") | `PURCHASE_READ` |
| Today's purchases (Σ amount, local day) | `PURCHASE_READ` |
| Buyers still owing (summary `buyersOwe`; "{n} buyers, over all cash sessions") | `PREFINANCE_READ` |
| Owed to buyers (`companyOwesBuyers`; "Cocoa delivered, not yet paid") | `PREFINANCE_READ` |
| Salary due (Σ employees' salary_due) | `EMPLOYEE_READ` |
| Open cash sessions (count) | `CASH_SESSION_READ` |

- Charts:
  - Purchase value by day (last 14 days with purchases).
  - Cocoa price history (line).
  - Deliveries by status (donut).
  - Buyer prefinance balances (advanced vs outstanding, top 8).
  - Stock on hand.
- Lists: Recent purchases (6), Buyer prefinance (6, "Advanced {amount}"), Recent stock movements.
- Quick actions: Record a purchase, Record a payment, Go to the till.
- No readable source → "No operational data for your role."

### 15.2 Business analysis (BOSS only; optional, needs the AI module)

Period selector **7 / 30 / 90 days** (API: 1–366, default 30). Period = the N days ending today (Douala), compared with the N days before.

**Snapshot figures** (computed exactly from the records):

| Figure | Definition |
|---|---|
| purchases {count, netKg, amount, averagePricePerKg} | purchases with purchase_date in the period; average = amount ÷ kg (2 dp) |
| previousPurchases | same for the previous N days |
| topSuppliers (5) | by Σ net kg in the period: name, type, kg, amount |
| payables {open, outstanding, overdue, overdueAmount} | non-PAID payables (count, Σ remaining); overdue = due_date < today |
| stock {onHandKg, receivedKg, issuedKg} | Σ balances; Σ RECEIPT and Σ ISSUE movements in the period |
| deliveries {count, netKg, notYetDelivered} | loadings created in the period |
| prices {currentPerKg, atPeriodStartPerKg, changes} | price at now / at start; count published in the period |
| till {sessionsClosed, totalVariance, shortfalls, largestShortfall, openNow} | sessions closed in the period |
| expenses {total, topCategories(3)} | RECORDED expenses in the period |
| prefinance {open, outstanding, largest(3)} | OPEN/PARTIALLY_SETTLED: count, Σ(amount − delivered value), top buyers |
| payroll {activeEmployees, salaryDue, advancesOutstanding} | active employees |

Figure cards on the page:
- Cocoa bought (kg, "±x% vs. the previous period", count).
- Spent on cocoa ("Average {price} per kg").
- Stock on hand ("In {received} · out {issued}").
- Current price per kg ({n} changes in the period).
- Owed to suppliers ({n} overdue · {amount}).
- Prefinance not yet covered.
- Till difference ({n} shortfalls · largest …, or "{n} tills closed, no shortfall").
- Salaries owed ({n} active employees).
- Lists: "Who you bought the most from"; "Largest prefinance not yet covered".

**AI report** (button ✨, "Write the analysis"): the snapshot JSON is sent to a **local open model (Ollama, default `mistral`, temperature 0.2, timeout 3 min)**. Generated reports are **kept** (latest per language shown) with meta "Written by {model} on {date}, about {from} to {to}" and the disclaimer "Written by an AI from the figures of that day. Check any number against the figures above before acting on it." Audit `ANALYSIS_GENERATED`.

System prompt (use verbatim; `%s` = language name):

```
You are the business analyst of a cocoa trading company in Cameroon.
You receive the figures for one period as JSON. They were computed exactly from the
company's records. Write a short report for the owner, in %s.
Rules:
- Use only the figures in the JSON. Never invent, estimate or recalculate a figure.
  If something is not in the data, do not mention it.
- Amounts are in XAF (FCFA), weights in kg. Use thousands separators.
- "previousPurchases" covers the same number of days just before the period:
  compare with it when it helps.
- A negative till variance is a shortfall (cash missing).
- Plain, direct language for a busy owner. No greeting, no jargon, no closing remarks.
Format, in Markdown, with the headings translated into %s:
## Summary
Two or three sentences.
## What went well
Up to 3 bullet points.
## Watch out
Up to 4 bullet points on risks: till shortfalls, overdue payables, prefinance not yet
covered by cocoa, falling purchases, low stock, price changes, salaries owed.
## Suggested actions
Up to 3 concrete bullet points.
Stay under 300 words.
```

### 15.3 AI note suggestion (optional)

A **Suggest** button next to the Notes field of: till (TILL), truck loading (DELIVERY), prefinance (PREFINANCE), partner (PARTNER), salary payout (SALARY_PAYOUT), employee (EMPLOYEE). The form's filled values (label → readable value, max 20) are sent. The returned text is placed in the field for the user to edit; nothing is saved automatically. Output: first line only, bullets/quotes/"Note:" prefixes stripped, ≤255 chars.

```
You fill in the "notes" field of a record in the software of a cocoa trading
company in Cameroon. The record is <context description>.
Write ONE short factual note, at most 20 words, in <language>, that a colleague reading the
record later would find useful.
Rules:
- Use only the details given. Never invent a fact, a reason, a name or a figure.
- Do not list every detail; mention what matters or stands out.
- Amounts are in XAF (FCFA), weights in kg.
- Answer with the note only: no quotes, no Markdown, no greeting, no explanation.
```

Context descriptions:

| Context | Description |
|---|---|
| TILL | "a cash till operation (opening, top-up or closing the cash drawer)" |
| DELIVERY | "a truck loading cocoa for delivery to a commercial partner" |
| PREFINANCE | "a prefinance: money advanced to a cocoa buyer, repaid in cocoa" |
| PARTNER | "a business partner (farmer, buyer or commercial company)" |
| SALARY_PAYOUT | "a salary or salary-advance payment to an employee, in cash" |
| EMPLOYEE | "an employee record" |

AI status endpoint: AI features show only when the model is enabled (and, in SaaS, the plan includes it). **Odoo:** a settings toggle + Ollama URL/model in `res.config.settings`. All of this runs on the same local network, so no data leaves the premises.

---

## 16. Known gaps & decisions to make

| # | Current state | Recommendation for Odoo |
|---|---|---|
| 1 | The UI has "Edit purchase" (`PATCH /purchases/{id}`), but **the backend has no such endpoint**. | Don't allow editing posted lines. Add a manager-only **"Correct delivery line"** that writes a reversing line + new line with a reason (keeps stock, payable and audit consistent). |
| 2 | Inventory adjustment API exists; **no UI**. | Add the Adjust action (§10.2). |
| 3 | Payable `due_date` is never set, so "overdue" is always 0. | Add a company setting "payment term (days)" and set due_date = business date + term. |
| 4 | `COMPANY_OWES_BUYER` prefinance status is unreachable. | Drop it, or derive it when disbursed < delivered value. |
| 5 | `PREFINANCE_SETTLE`, `CONTRACT_*`, `SYNC_*`, `REPORT_READ` (no report page) are unused. | Drop CONTRACT/SYNC. Use REPORT_READ for Odoo pivot/graph report menus. |
| 6 | Price `SCHEDULED` is never assigned; a future-dated publish is ACTIVE but not yet in force. | Set SCHEDULED when effective_from > now; a cron flips it to ACTIVE and supersedes the previous one. |
| 7 | Purchases, cash, expenses and payroll are **company-wide**; only stock is per warehouse. | Add `warehouse_id` (default: the user's warehouse) to purchases, sessions, expenses and loadings, so multi-site companies get per-site reports. Keep the rules unchanged. |
| 8 | Retention: config says `retention-months=6` but the code reads `retentionPeriod` days, so the effective delay is **30 days**. Only users are watched, though the UI lists partner/employee/warehouse types. | Make it a setting (days). Archive + anonymise instead of hard delete. |
| 9 | Built-in BOSS role could be assigned by a boss (the "only platform assigns BOSS" rule is not enforced). | Enforce: only an Odoo *Settings* admin grants the Boss group. |
| 10 | The UI password rules (uppercase + special) are stricter than the server (length only). | Pick one policy and enforce it server-side. |
| 11 | `EMAIL_CHANGE` email template and token purpose exist; no flow uses them. | Optional: confirm a new email before applying it. |
| 12 | Truck loading statuses IN_TRANSIT / CANCELLED are unused; a loading can't be cancelled. | Add **Cancel loading** (manager) that puts the stock back (RECEIPT, source TRUCK_LOADING_CANCEL) with a reason. |
| 13 | Expense UI is cash-only; the server accepts other methods. | Allow Mobile money / Bank transfer with a reference (no till movement). |
| 14 | Personnel UI type labels include `WAREHOUSE_MANAGER`; the server enum has `WAREHOUSE_CLERK` and `ADMINISTRATIVE`. | Use the server list (§4.4). |
| 15 | Offline use: the current PWA caches screens only. | **Self-hosted Odoo on the office LAN solves offline-from-internet.** Field buyers on phones are out of scope for v1. Optional later: an Odoo PWA/outbox. |

---

## 17. Odoo implementation blueprint

### 17.1 Target

- **Odoo 17/18 Community** (no Enterprise dependency), PostgreSQL, installed on a machine in the office. Data stays local.
- Recommended deployment: **one database per company**; multi-company is only needed for one owner with several legal entities.
- Languages: English + French (`fr_FR`, or `fr_CM` if created). Ship `.po` files from Appendix C.
- Time zone: set company/user tz to `Africa/Douala`. Compute "business date" with the company tz, never the server tz.

### 17.2 Module split

| Module | Contents | Depends |
|---|---|---|
| `keuka_base` | company fields, warehouse, partner extension (type/kind/CNI/RCCM/NIU/trusted), validators (§2.2), security groups, audit model + helper, document frame (QWeb layout), settings | `base`, `mail` |
| `keuka_pricing` | price model, publish wizard, "price in force" helper | base |
| `keuka_cash` | sessions, moves, provisions, source-till resolver, till report | base |
| `keuka_procurement` | purchase, lines, payments (+offset), checkout wizard, receipt | pricing, cash, inventory |
| `keuka_inventory` | balance + ledger, adjust wizard | base |
| `keuka_prefinance` | advances, disbursements, settlement engine, balances, receipt | procurement, cash |
| `keuka_expense` | categories (+8 defaults via data XML with `code`), expenses, cancel wizard | cash |
| `keuka_logistics` | truck loadings, delivery note | inventory |
| `keuka_payroll` | employee extension, accrual cron, payout wizard, payslip | `hr`, cash |
| `keuka_retention` | watch model + cron | base |
| `keuka_dashboard` | dashboard (OWL client action) + pivot/graph menus | all |
| `keuka_ai` (optional) | analysis snapshot, Ollama client, note-suggest button widget | dashboard |

Plan-gated features (§18) map naturally to **installing or uninstalling** these modules.

### 17.3 Reuse vs build

| Need | Recommendation | Why |
|---|---|---|
| Partners | extend `res.partner` | contacts, search, chatter for free |
| Employees | extend `hr.employee` (`hr` is Community) | link `user_id` natively |
| Users / roles | `res.users` + `res.groups` | native login, invitations (`auth_signup`), password reset |
| Stock | **custom ledger** (`keuka.stock.*`), not `stock` | the kg balance + 3 movement types + "never negative" is far simpler than stock.quant; avoids valuation side effects |
| Payments / cash | **custom** (`keuka.payment`, `keuka.cash.*`) | no accounting exists today. Optional later bridge: post journal entries to `account` from cash moves. |
| Audit | custom `keuka.audit.event` + `mail.thread` tracking on main models | the event catalogue (Appendix B) is a business log, not field tracking |
| Prints | QWeb reports | |
| Scheduled jobs | `ir.cron`: salary accrual 00:05; retention 03:30; (price activation) | |
| Emails | `mail.template` (invitation via `auth_signup`) | |

### 17.4 Implementation rules that preserve behaviour

- Put every algorithm of §6.1, §6.2, §6.3, §7.1–7.3, §8.1–8.4, §9.2, §10.1, §11.1, §12.2–12.3 in **model methods**, called from wizards/buttons. Never compute money in views or JS.
- Each operation is one Odoo transaction (the default per RPC call). Raise `UserError` to roll back everything, e.g. a paid-now purchase with no till saves nothing.
- Use **`SELECT … FOR UPDATE`** (or `_cr.execute` row locks) on the cash session and the stock balance before checking availability, to avoid two cashiers overdrawing concurrently.
- Prefer `fields.Monetary` with an XAF currency (rounding 1 for display, 0.01 for storage), and `fields.Float(digits=(19,3))` for kg.
- Add SQL constraints:
  - unique `(company_id, business_date, farmer_id, buyer_id)` on purchase; null-safe, via a computed `seller_key`;
  - unique open session per cashier (partial unique index);
  - unique `(company_id, code)` on warehouse;
  - unique category name per company (lower).
- Record rules: company isolation on every model. Warehouse roles: optional record rule limiting to `user.warehouse_id`.
- Statuses as `fields.Selection` with the exact keys of this document. Use them for list decorations (e.g. `decoration-danger="variance < 0"`).
- Every list view gets the same columns, filters and default order as in this document. Add search panels for the status/type filters.

### 17.5 Menu tree (Odoo)

```
Keuka
├── Dashboard
├── Operations
│   ├── Purchases          (keuka.purchase)
│   ├── Inventory          (keuka.stock.move + balance KPI)
│   ├── Logistics          (keuka.truck.loading)
│   ├── Partners ▸ All / Buyers / Farmers / Commercial / Logistics / Other
│   └── Cocoa price        (keuka.price)
├── Finance
│   ├── Till               (keuka.cash.session; "My till" action for cashiers)
│   ├── Expenses           (keuka.expense)
│   ├── Payments           (keuka.payment)
│   └── Salaries           (hr.employee payroll view)
├── Administration
│   ├── Personnel          (hr.employee)
│   ├── Users / Roles      (res.users / res.groups)
│   ├── Company & Warehouses
│   ├── Audit log          (keuka.audit.event)
│   ├── Data retention     (keuka.retention.watch)
│   └── Business analysis  (Boss only; keuka_ai)
└── Configuration
    ├── Expense categories
    └── Settings (payment term, retention days, AI on/off + Ollama URL/model, bag weight = 1 kg)
```

### 17.6 Acceptance scenarios (use as tests)

1. **Same-day merge**: farmer F, 80/78 kg at 09:00 then 50/49 kg at 15:00 → one purchase, 2 lines, net 127, amount = 127 × price, purchase_date = 15:00, stock +127.
2. **Prefinance repay**: buyer B, advance 100 000 at 1 000/kg disbursed in cash. Purchase net 120 kg → settlement 100 kg / 100 000; offset payment 100 000; amount 120 000; remaining 20 000; prefinance SETTLED; till −100 000 (at disbursement only).
3. **Two advances, two prices**: A1 50 000 @ 1 000 (older), A2 60 000 @ 1 200. Purchase 120 kg → A1: 50 kg/50 000; A2: 50 kg/60 000; surplus 20 kg @ 1 200 = 24 000; amount 134 000; offsets 110 000; remaining 24 000.
4. **Paid-now failure rolls back**: no open till, paid-now CASH → nothing is saved; error `CASH_SESSION_REQUIRED`.
5. **Void cash payment after till closed** → `CASH_SESSION_CLOSED`, nothing changes.
6. **Till carry-over**: close with declared 30 000 → next open has opening_balance 30 000 + pending provisions.
7. **Accrual**: hired 31 Aug, salary 100 000, advance 40 000 on 10 Sep. On 30 Sep: months 1, repaid 40 000, salary_due 60 000, advance_balance 0.
8. **Stock guard**: stock 500 kg, loading net 600 → `INSUFFICIENT_STOCK`, no loading saved.
9. **Role guard**: a boss without `AUDIT_READ` creating a custom role containing `AUDIT_READ` → refused.

---

## 18. SaaS layer (optional for self-hosted)

For completeness: the hosted version sells plans. **A self-hosted owner can drop all of this**, or keep the "modules" idea as installable Odoo modules.

- **Plan**: code (immutable, `[A-Z0-9_]+`), tier, name/description/benefits (EN+FR), price (XAF), billing period (MONTHLY, QUARTERLY, YEARLY, **SEASON** = ends last day of February, **OFF_SEASON** = ends 31 July), max warehouses, max users (null = unlimited), modules (PREFINANCE, LOGISTICS, PAYROLL, CUSTOM_ROLES, AUDIT_LOG, AI_ANALYSIS), trial days, active, display order, comparison rows.
- Default catalogue:
  - TRIAL: 0 XAF, 30 days, Pro modules, 3 warehouses, 10 users.
  - ESSENTIEL_YEAR: 120 000 XAF/yr, core only, 1 warehouse, 3 users.
  - PRO_YEAR: 300 000 XAF/yr, PREFINANCE + LOGISTICS + PAYROLL + CUSTOM_ROLES + AUDIT_LOG, 3 warehouses, 10 users.
  - ENTREPRISE_YEAR: 600 000 XAF/yr, all modules, unlimited.
- **Gating**: a module not in the plan makes its **writes** refused (`PLAN_FEATURE_UNAVAILABLE`) while history stays readable. Audit log and AI are closed entirely. Limits block adding warehouses/users (`PLAN_LIMIT_REACHED`), never remove existing ones.
- **Subscription**: TRIAL / ACTIVE / PAST_DUE / SUSPENDED / EXPIRED / CANCELLED, with a period start/end. Past its end, a trial or paid period reads EXPIRED. Without ACTIVE/TRIAL **and** company ACTIVE, every non-GET request except auth/subscription is refused (`SUBSCRIPTION_INACTIVE`).
- Platform admin: onboard a company (code, unique id, names, first warehouse, boss invited), suspend/activate, change plan (period starts today), platform stats (companies per status, ending within N days, accounts), public price list page.

---

## Appendix A — Error catalogue

Use as `UserError` keys/messages (translate).

| Code | Meaning |
|---|---|
| VALIDATION_FAILED | a field breaks a rule (§2.2) |
| ACCESS_DENIED | missing permission / assigning or editing permissions you don't hold |
| RESOURCE_NOT_FOUND / *_NOT_FOUND | record missing or outside your company |
| CONFLICT | duplicate (category name, warehouse code, company code…) |
| BUSINESS_RULE_VIOLATION | generic rule: wrong partner type, inactive partner, own-role change, built-in role edit, role still assigned, already voided/cancelled, disbursement over amount… |
| USER_DISABLED | sign-in on a disabled account |
| USERNAME_TAKEN / EMAIL_TAKEN | |
| EMPLOYEE_REQUIRED | company account without an employee |
| EMPLOYEE_ALREADY_HAS_ACCOUNT | |
| PASSWORD_CHANGE_REQUIRED | temporary password not replaced yet |
| INVALID_CREDENTIALS | wrong username/password or wrong current password |
| INVITATION_INVALID | link expired, used or replaced |
| PURCHASE_PRICE_NOT_FOUND | no price in force (purchase or prefinance fallback) |
| PAYMENT_EXCEEDS_BALANCE | payment > remaining |
| PARTNER_REQUIRED | purchase without farmer or buyer |
| INVALID_MEASUREMENT | humidity outside 0–100, net > gross, zero stock quantity |
| CASH_SESSION_REQUIRED | no open till to pay cash from |
| CASH_SESSION_CLOSED | named till closed / closing a closed till / refund into a closed till |
| OPEN_CASH_SESSION_EXISTS | cashier already has an open till |
| TILL_CASHIER_ONLY | non-cashier opening, or someone else closing |
| PROVISION_NOT_ALLOWED | cashier adding a provision |
| CASHIER_NOT_FOUND | provision to a non-cashier |
| INSUFFICIENT_CASH | OUT > available |
| INSUFFICIENT_SALARY_DUE | payout > salary due |
| HIRE_DATE_REQUIRED / AGREED_SALARY_REQUIRED / ADVANCE_LIMIT_EXCEEDED | payroll |
| BUYER_NOT_TRUSTED | prefinance for an untrusted buyer |
| INSUFFICIENT_STOCK | balance would go negative |
| WAREHOUSE_REQUIRED / WAREHOUSE_NOT_FOUND / WAREHOUSE_INACTIVE | |
| AI_UNAVAILABLE | model off/unreachable |
| PLAN_FEATURE_UNAVAILABLE / PLAN_LIMIT_REACHED / SUBSCRIPTION_INACTIVE | SaaS only |

## Appendix B — Audit event catalogue

| Event | Action | Aggregate | Details |
|---|---|---|---|
| AUTH_LOGIN / AUTH_LOGOUT | LOGIN/LOGOUT | UserAccount | username |
| USER_CREATED / USER_UPDATED / USER_DISABLED / USER_ENABLED / USER_PASSWORD_RESET / USER_INVITATION_SENT / USER_INVITATION_ACCEPTED | | UserAccount | username, roles, active, email |
| PROFILE_UPDATED / PASSWORD_CHANGED | UPDATE | UserAccount | email / self |
| ROLE_CREATED / ROLE_UPDATED / ROLE_DELETED | | Role | name, permissions, added, removed |
| WAREHOUSE_CREATED / WAREHOUSE_UPDATED | | Warehouse | code, name |
| PARTNER_CREATED / PARTNER_UPDATED | | Partner | name, type, kind / active, trusted |
| EMPLOYEE_CREATED / EMPLOYEE_UPDATED | | Employee | type, name / active |
| PRICE_PUBLISHED | CREATE | CocoaPrice | pricePerKg, currency, effectiveFrom |
| PURCHASE_CREATED / PURCHASE_DELIVERY_ADDED | CREATE/UPDATE | CocoaPurchase | deliveryId, netWeight, unitPrice, amount, prefinanceSettled, dayAmount |
| PAYMENT_RECORDED / PAYMENT_VOIDED | CREATE/UPDATE | Payment | purchaseId, amount, remaining |
| PREFINANCE_CREATED / PREFINANCE_DISBURSED / PREFINANCE_SETTLED_BY_PURCHASE | | BuyerPrefinance / Disbursement | buyerId, amount, historicalUnitPrice / prefinanceId, amount / purchaseId, quantity, value, unitPrice, outstanding |
| CASH_SESSION_OPENED / CASH_SESSION_CLOSED / CASH_PROVISION_ADDED | | CashSession / CashProvision | carriedOver, provisions / expected, declared, variance / amount, cashierId |
| EXPENSE_RECORDED / EXPENSE_CANCELLED | | Expense | amount, category / amount (+reason) |
| STOCK_RECEIPT / STOCK_ISSUE / STOCK_ADJUSTMENT | | StockBalance | warehouseId, deltaKg, onHand (+notes as reason) |
| TRUCK_LOADED / DELIVERY_COMPLETED | | Delivery | partnerId, vehicleNumber, driverLicenseNumber, declaredNet, bags / status |
| SALARY_ACCRUED / SALARY_COLLECTED / SALARY_ADVANCED | | Employee / Salary | months, throughDate, amount, advanceRepaid, salaryDue, advanceBalance / employeeId, amount, signature |
| PURGE_NOTICE / PURGE_EXECUTED | NOTIFY/DELETE | resource type | label, purgeAt |
| ANALYSIS_GENERATED | CREATE | BusinessAnalysis | days, language, model |

## Appendix C — Bilingual labels (EN/FR)

Generated from the application's translation files. Use these strings as the source for the Odoo `.po` files (`fr.po`). `{{x}}` are placeholders.

### C.1 `documents`

| Key | English | Français |
|---|---|---|
| `documents.actions.printReceipt` | Print receipt | Imprimer le reçu |
| `documents.actions.printPayslip` | Print payslip | Imprimer la fiche de paie |
| `documents.actions.printDeliveryNote` | Print delivery note | Imprimer le bordereau |
| `documents.actions.printPrefinance` | Print prefinance receipt | Imprimer le reçu de préfinancement |
| `documents.actions.printTillReport` | Print till report | Imprimer le rapport de caisse |
| `documents.footer.note` | Measurements and amounts are recorded facts. Keep this document as proof. | Les mesures et les montants sont des faits enregistrés. Conservez ce document comme preuve. |
| `documents.footer.original` | Original | Original |
| `documents.footer.printedAt` | Printed {{when}} | Imprimé le {{when}} |
| `documents.footer.reference` | Ref: {{ref}} | Réf. : {{ref}} |
| `documents.receipt.title` | Cocoa purchase receipt | Reçu d'achat de cacao |
| `documents.receipt.receiptNo` | Receipt No | N° de reçu |
| `documents.receipt.date` | Date | Date |
| `documents.receipt.farmer` | Farmer | Producteur |
| `documents.receipt.buyer` | Buyer | Acheteur |
| `documents.receipt.phone` | Phone | Téléphone |
| `documents.receipt.measurementsHeading` | Measurements | Mesures |
| `documents.receipt.measurementsNote` | (as recorded at weighing) | (telles qu'enregistrées à la pesée) |
| `documents.receipt.grossWeight` | Gross weight | Poids brut |
| `documents.receipt.humidity` | Humidity | Humidité |
| `documents.receipt.refraction` | Refraction | Réfraction |
| `documents.receipt.netWeight` | Net weight | Poids net |
| `documents.receipt.unitPrice` | Unit price (applied at purchase) | Prix unitaire (appliqué à l'achat) |
| `documents.receipt.totalAmount` | Total amount | Montant total |
| `documents.receipt.signFarmer` | Farmer signature | Signature du producteur |
| `documents.receipt.signWarehouse` | Warehouse manager | Chef d'entrepôt |
| `documents.receipt.signCashier` | Cashier | Caissier |
| `documents.receipt.agreedPrice` | Unit price (agreed on prefinance) | Prix unitaire (convenu au préfinancement) |
| `documents.receipt.prefinanceRepaid` | Repaid on prefinance | Remboursé sur le préfinancement |
| `documents.receipt.paidWith` | Paid ({{method}}) | Payé ({{method}}) |
| `documents.receipt.paidWithRef` | Paid ({{method}}, ref. {{ref}}) | Payé ({{method}}, réf. {{ref}}) |
| `documents.receipt.stillOwed` | Still owed | Reste dû |
| `documents.receipt.settledInFull` | Settled in full | Entièrement réglé |
| `documents.receipt.signBuyer` | Buyer signature | Signature de l'acheteur |
| `documents.receipt.deliveriesHeading` | Deliveries of the day ({{count}}) | Livraisons du jour ({{count}}) |
| `documents.receipt.dayTotalHeading` | Day total | Total du jour |
| `documents.receipt.time` | Time | Heure |
| `documents.receipt.price` | Price | Prix |
| `documents.receipt.amount` | Amount | Montant |
| `documents.payslip.title` | Employee payslip | Fiche de paie |
| `documents.payslip.payslipNo` | Payslip No | N° de fiche |
| `documents.payslip.period` | Period | Période |
| `documents.payslip.employee` | Employee | Employé |
| `documents.payslip.position` | Position | Poste |
| `documents.payslip.phone` | Phone | Téléphone |
| `documents.payslip.idCard` | ID card | Pièce d'identité |
| `documents.payslip.status` | Status | Statut |
| `documents.payslip.earnings` | Earnings | Gains |
| `documents.payslip.baseSalary` | Salary paid this period | Salaire payé pour la période |
| `documents.payslip.deductions` | Deductions | Retenues |
| `documents.payslip.deductionsTotal` | Total deductions | Total des retenues |
| `documents.payslip.grossPay` | Gross pay | Salaire brut |
| `documents.payslip.netPay` | Net pay | Salaire net |
| `documents.payslip.outstanding` | Still owed | Reste dû |
| `documents.payslip.paymentDetails` | Payment details | Détails du paiement |
| `documents.payslip.paidOn` | Paid on | Payé le |
| `documents.payslip.method` | Method | Mode |
| `documents.payslip.reference` | Reference | Référence |
| `documents.payslip.paidAmount` | Amount paid | Montant payé |
| `documents.payslip.signEmployee` | Employee signature | Signature de l'employé |
| `documents.payslip.signPaidBy` | Paid by | Payé par |
| `documents.payslip.receivedBy` | Received by | Reçu par |
| `documents.deliveryNote.title` | Delivery note | Bordereau de livraison |
| `documents.deliveryNote.noteNo` | Note No | N° de bordereau |
| `documents.deliveryNote.date` | Date | Date |
| `documents.deliveryNote.destination` | Destination | Destination |
| `documents.deliveryNote.status` | Status | Statut |
| `documents.deliveryNote.consignee` | Consignee | Destinataire |
| `documents.deliveryNote.name` | Name | Nom |
| `documents.deliveryNote.location` | Location | Localisation |
| `documents.deliveryNote.contact` | Contact person | Personne à contacter |
| `documents.deliveryNote.phone` | Phone | Téléphone |
| `documents.deliveryNote.transport` | Transport | Transport |
| `documents.deliveryNote.vehicle` | Vehicle | Véhicule |
| `documents.deliveryNote.driver` | Driver | Chauffeur |
| `documents.deliveryNote.license` | Driving licence | Permis de conduire |
| `documents.deliveryNote.goods` | Goods | Marchandise |
| `documents.deliveryNote.goodsDescription` | Dried cocoa beans | Fèves de cacao séchées |
| `documents.deliveryNote.declaredGross` | Declared gross weight | Poids brut déclaré |
| `documents.deliveryNote.declaredNet` | Declared net weight | Poids net déclaré |
| `documents.deliveryNote.notes` | Notes | Remarques |
| `documents.deliveryNote.reception` | Reception (filled in by the consignee) | Réception (à remplir par le destinataire) |
| `documents.deliveryNote.receptionHint` | Write the weights actually received. The declared weights above are not changed. | Inscrivez les poids réellement reçus. Les poids déclarés ci-dessus ne sont pas modifiés. |
| `documents.deliveryNote.receivedGross` | Gross weight received | Poids brut reçu |
| `documents.deliveryNote.receivedNet` | Net weight received | Poids net reçu |
| `documents.deliveryNote.receivedOn` | Received on | Reçu le |
| `documents.deliveryNote.remarks` | Remarks | Observations |
| `documents.deliveryNote.signDispatcher` | Dispatched by | Expédié par |
| `documents.deliveryNote.signDriver` | Driver | Chauffeur |
| `documents.deliveryNote.signReceiver` | Received by | Reçu par |
| `documents.deliveryNote.escort` | Escort | Convoyeur |
| `documents.deliveryNote.bags` | Number of bags | Nombre de sacs |
| `documents.prefinance.title` | Prefinance receipt | Reçu de préfinancement |
| `documents.prefinance.receiptNo` | Receipt No | N° de reçu |
| `documents.prefinance.advanceDate` | Advance date | Date de l'avance |
| `documents.prefinance.buyer` | Buyer | Acheteur |
| `documents.prefinance.phone` | Phone | Téléphone |
| `documents.prefinance.idCard` | ID card | CNI |
| `documents.prefinance.address` | Address | Adresse |
| `documents.prefinance.terms` | Terms of the advance | Conditions de l'avance |
| `documents.prefinance.agreedPrice` | Agreed price per kg | Prix convenu par kg |
| `documents.prefinance.equivalent` | Cocoa equivalent | Équivalent en cacao |
| `documents.prefinance.amount` | Amount advanced | Montant avancé |
| `documents.prefinance.commitment` | I, {{name}}, acknowledge receiving {{amount}} and agree to repay it in cocoa at {{price}}/kg. | Je soussigné(e) {{name}} reconnais avoir reçu {{amount}} et m'engage à le rembourser en cacao au prix de {{price}}/kg. |
| `documents.prefinance.statement` | Statement on the printing date | Situation à la date d'impression |
| `documents.prefinance.delivered` | Cocoa delivered | Cacao livré |
| `documents.prefinance.repaid` | Value repaid | Valeur remboursée |
| `documents.prefinance.outstanding` | Still owed | Reste dû |
| `documents.prefinance.status` | Status | Statut |
| `documents.prefinance.notes` | Notes | Remarques |
| `documents.prefinance.signBuyer` | Buyer signature | Signature de l'acheteur |
| `documents.prefinance.signManager` | Manager | Responsable |
| `documents.prefinance.signCashier` | Cashier | Caissier |
| `documents.till.title` | Till closing report | Rapport de clôture de caisse |
| `documents.till.interimTitle` | Till report (interim) | Rapport de caisse (provisoire) |
| `documents.till.reportNo` | Report No | N° de rapport |
| `documents.till.cashier` | Cashier | Caissier |
| `documents.till.openedAt` | Opened | Ouverture |
| `documents.till.closedAt` | Closed | Clôture |
| `documents.till.stillOpen` | Still open | Toujours ouverte |
| `documents.till.closedBy` | Closed by | Clôturée par |
| `documents.till.openingFloat` | Opening float | Fonds de caisse |
| `documents.till.provisions` | Provisions | Provisions |
| `documents.till.payouts` | Cash paid out | Sorties d'espèces |
| `documents.till.expected` | Expected in till | Attendu en caisse |
| `documents.till.inTillNow` | In till now | En caisse maintenant |
| `documents.till.counted` | Cash counted | Espèces comptées |
| `documents.till.variance` | Variance | Écart |
| `documents.till.shortage` | shortage | manquant |
| `documents.till.surplus` | surplus | excédent |
| `documents.till.payoutsByType` | Cash paid out by kind | Sorties d'espèces par nature |
| `documents.till.provisionsHeading` | Provisions | Provisions |
| `documents.till.movementsHeading` | All movements | Tous les mouvements |
| `documents.till.none` | None | Aucun |
| `documents.till.notes` | Notes | Remarques |
| `documents.till.signCashier` | Cashier | Caissier |
| `documents.till.signManager` | Manager | Responsable |
| `documents.prompt.print` | Print | Imprimer |
| `documents.prompt.notNow` | Not now | Plus tard |
| `documents.prompt.receiptTitle` | Print the purchase receipt? | Imprimer le reçu d’achat ? |
| `documents.prompt.receiptText` | The purchase from {{name}} is recorded. Print the receipt to hand over now. | L’achat auprès de {{name}} est enregistré. Imprimez le reçu à remettre maintenant. |
| `documents.prompt.payslipTitle` | Print the payslip? | Imprimer le bulletin de paie ? |
| `documents.prompt.payslipText` | The payment to {{name}} is recorded. Print this month’s payslip for their signature. | Le paiement à {{name}} est enregistré. Imprimez le bulletin du mois pour signature. |
| `documents.prompt.deliveryTitle` | Print the delivery note? | Imprimer le bordereau ? |
| `documents.prompt.deliveryText` | Truck {{vehicle}} for {{name}} is recorded. Print the note to travel with it. | Le camion {{vehicle}} pour {{name}} est enregistré. Imprimez le bordereau qui l’accompagne. |
| `documents.prompt.prefinanceTitle` | Print the prefinance receipt? | Imprimer le reçu de préfinancement ? |
| `documents.prompt.prefinanceText` | The advance to {{name}} is recorded. Print the receipt for the buyer to sign. | L’avance à {{name}} est enregistrée. Imprimez le reçu que l’acheteur signera. |
| `documents.prompt.tillTitle` | Print the till report? | Imprimer le rapport de caisse ? |
| `documents.prompt.tillText` | The till is closed. Print its closing report. | La caisse est clôturée. Imprimez son rapport de clôture. |
| `documents.prompt.paymentTitle` | Print the updated receipt? | Imprimer le reçu mis à jour ? |
| `documents.prompt.paymentText` | The payment is recorded. Print the purchase receipt showing it. | Le paiement est enregistré. Imprimez le reçu d’achat qui le mentionne. |

### C.2 `status`

| Key | English | Français |
|---|---|---|
| `status.delivery.PLANNED` | Planned | Planifiée |
| `status.delivery.IN_TRANSIT` | On the way | En route |
| `status.delivery.DELIVERED` | Delivered | Livrée |
| `status.payroll.PAID` | Paid | Payé |
| `status.payroll.PENDING` | Not paid yet | Pas encore payé |
| `status.subscription.TRIAL` | Trial | Essai |
| `status.subscription.ACTIVE` | Active | Active |
| `status.subscription.PAST_DUE` | Past due | En retard |
| `status.subscription.SUSPENDED` | Suspended | Suspendue |
| `status.subscription.EXPIRED` | Expired | Expirée |
| `status.subscription.CANCELLED` | Cancelled | Annulée |
| `status.tenant.ACTIVE` | Active | Actif |
| `status.tenant.SUSPENDED` | Suspended | Suspendu |
| `status.tenant.CLOSED` | Closed | Fermé |
| `status.prefinance.OPEN` | Open | Ouvert |
| `status.prefinance.PARTIALLY_SETTLED` | Partially settled | Partiellement réglé |
| `status.prefinance.SETTLED` | Settled | Réglé |
| `status.prefinance.COMPANY_OWES_BUYER` | Company owes buyer | L'entreprise doit à l'acheteur |
| `status.price.SCHEDULED` | Starts later | Commence plus tard |
| `status.price.ACTIVE` | In force | En vigueur |
| `status.price.SUPERSEDED` | Replaced | Remplacé |
| `status.price.CANCELLED` | Cancelled | Annulé |

### C.3 `purchases`

| Key | English | Français |
|---|---|---|
| `purchases.title` | Purchases | Achats |
| `purchases.description` | Every cocoa purchase recorded, with its payment status. | Tous les achats de cacao enregistrés, avec leur statut de paiement. |
| `purchases.totalAmount` | Total purchase value | Valeur totale des achats |
| `purchases.totalWeight` | Total net weight | Poids net total |
| `purchases.outstandingAmount` | Outstanding value | Valeur restante |
| `purchases.purchaseRegister` | Purchase register | Registre des achats |
| `purchases.filterPayment` | Filter by payment | Filtrer par paiement |
| `purchases.allPayments` | All payments | Tous les paiements |
| `purchases.newPurchase` | New purchase | Nouvel achat |
| `purchases.columnFarmer` | Farmer | Producteur |
| `purchases.columnPartner` | Farmer or buyer | Producteur ou acheteur |
| `purchases.columnDate` | Date | Date |
| `purchases.columnNetWeight` | Net weight | Poids net |
| `purchases.columnAmount` | Amount | Montant |
| `purchases.columnPayment` | Payment | Paiement |
| `purchases.columnRecordedBy` | Recorded by | Enregistré par |
| `purchases.emptyTitle` | No purchases yet | Aucun achat pour le moment |
| `purchases.emptyDescription` | Newly recorded purchases will show up here. | Les nouveaux achats enregistrés apparaîtront ici. |
| `purchases.newPurchaseTitle` | Record a purchase | Enregistrer un achat |
| `purchases.newPurchaseDescription` | Enter the details for this cocoa delivery. | Saisissez les détails de cette livraison de cacao. |
| `purchases.editPurchaseTitle` | Edit purchase | Modifier l'achat |
| `purchases.partner` | Farmer or buyer | Producteur ou acheteur |
| `purchases.selectPartnerPlaceholder` | Select a farmer or buyer | Sélectionnez un producteur ou un acheteur |
| `purchases.loadingPartners` | Loading partners… | Chargement des partenaires… |
| `purchases.noPartners` | Register an active farmer or buyer before recording a purchase. | Enregistrez un producteur ou un acheteur actif avant de saisir un achat. |
| `purchases.farmer` | Farmer | Producteur |
| `purchases.buyer` | Buyer | Acheteur |
| `purchases.farmerName` | Farmer's name | Nom du producteur |
| `purchases.farmerNamePlaceholder` | e.g. Biya Jules | ex. Biya Jules |
| `purchases.grossWeight` | Gross weight (kg) | Poids brut (kg) |
| `purchases.grossWeightPlaceholder` | e.g. 80 | ex. 80 |
| `purchases.netWeight` | Net weight (kg) | Poids net (kg) |
| `purchases.netWeightHint` | Use the weight the warehouse gave you, after humidity and refraction. | Utilisez le poids donné par le magasinier, après humidité et taux de refraction. |
| `purchases.netWeightPlaceholder` | e.g. 78 | ex. 78 |
| `purchases.todaysPrice` | Today's price | Prix du jour |
| `purchases.amountToPay` | Amount to pay | Montant à payer |
| `purchases.priceLockedNote` | The price is set by the Boss and can't be changed here. | Le prix est fixé par le Patron et ne peut pas être modifié ici. |
| `purchases.recordPurchase` | Record purchase | Enregistrer l'achat |
| `purchases.recordedTitle` | Purchase recorded | Achat enregistré |
| `purchases.recordedDescription` | {{farmer}} — {{amount}} for {{weight}} kg. This is now waiting for payment. | {{farmer}} — {{amount}} pour {{weight}} kg. Ceci attend maintenant un paiement. |
| `purchases.recordAnother` | Record another purchase | Enregistrer un autre achat |
| `purchases.purchaseValue` | Purchase value | Valeur de l'achat |
| `purchases.prefinanceRepaid` | Repays prefinance ({{weight}}) | Rembourse le préfinancement ({{weight}}) |
| `purchases.prefinanceRepaidNote` | This buyer has an open prefinance, so the whole purchase is bought at the agreed price. The repaid part is recorded as a prefinance offset payment; the rest is paid in cash. | Cet acheteur a un préfinancement en cours : tout l’achat se fait au prix convenu. La partie remboursée est enregistrée comme compensation de préfinancement ; le reste est payé en espèces. |
| `purchases.agreedPrice` | Agreed prefinance price | Prix convenu (préfinancement) |
| `purchases.paidNow.label` | Paid now | Payé maintenant |
| `purchases.paidNow.hint` | The payment is recorded with the purchase. Cash comes out of your till. | Le paiement est enregistré avec l'achat. Les espèces sortent de votre caisse. |
| `purchases.paidNow.onCredit` | Not ticked: the purchase is recorded on credit and paid later from Payments. | Non coché : l'achat est enregistré à crédit et payé plus tard depuis Paiements. |
| `purchases.paidNow.method` | Payment method | Mode de paiement |
| `purchases.paidNow.amount` | Amount paid now | Montant payé maintenant |
| `purchases.paidNow.leftToPay` | Left to pay: {{amount}} | Reste à payer : {{amount}} |
| `purchases.paidNow.reference` | Reference | Référence |
| `purchases.paidNow.tillAvailable` | Cash available in the till: {{amount}} | Espèces disponibles dans la caisse : {{amount}} |
| `purchases.paidNow.noTill` | No till is open: the cashier must open theirs first. | Aucune caisse n'est ouverte : le caissier doit d'abord ouvrir la sienne. |
| `purchases.paidNow.openTill` | See the till | Voir la caisse |
| `purchases.paidNow.amountRequired` | Enter the amount paid. | Saisissez le montant payé. |
| `purchases.paidNow.exceedsToPay` | More than what is left to pay. | Supérieur au reste à payer. |
| `purchases.paidNow.exceedsTill` | More cash than the till holds. | Plus d'espèces que dans la caisse. |
| `purchases.paidNow.submit` | Record and pay | Enregistrer et payer |
| `purchases.details.back` | Back to purchases | Retour aux achats |
| `purchases.details.title` | Purchase | Achat |
| `purchases.details.seller` | Seller | Vendeur |
| `purchases.details.name` | Name | Nom |
| `purchases.details.kind` | Type | Type |
| `purchases.details.phone` | Phone | Téléphone |
| `purchases.details.weighing` | Weighing | Pesée |
| `purchases.details.payment` | Price and payment | Prix et paiement |
| `purchases.details.paid` | Paid so far | Déjà payé |
| `purchases.details.paymentHistory` | Payment history | Historique des paiements |
| `purchases.details.paidOn` | Date | Date |
| `purchases.details.method` | Method | Mode |
| `purchases.details.reference` | Reference | Référence |
| `purchases.details.amount` | Amount | Montant |
| `purchases.details.openPrefinance` | Open the prefinance | Ouvrir le préfinancement |
| `purchases.details.noPayments` | No payments yet | Aucun paiement |
| `purchases.details.noPaymentsDescription` | Payments recorded for this purchase will appear here. | Les paiements enregistrés pour cet achat apparaîtront ici. |
| `purchases.details.notes` | Notes | Remarques |
| `purchases.details.deliveredAt` | Delivered | Livré le |
| `purchases.details.price` | Price | Prix |
| `purchases.details.deliveries_one` | Delivery | Livraison |
| `purchases.details.deliveries_other` | Deliveries ({{count}}) | Livraisons ({{count}}) |
| `purchases.details.deliveriesHint` | Same-day deliveries by this partner are added to one purchase. The weights and amount above are the day's totals. | Les livraisons du même jour par ce partenaire sont regroupées en un seul achat. Les poids et le montant ci-dessus sont les totaux du jour. |
| `purchases.details.noDeliveries` | No deliveries | Aucune livraison |
| `purchases.datePlaceholder` | Select date | Choisir une date |

### C.4 `finance`

| Key | English | Français |
|---|---|---|
| `payments.title` | Payments | Paiements |
| `payments.description` | Recorded payments and their status. | Paiements enregistrés et leur statut. |
| `payments.newPayment` | Record payment | Enregistrer un paiement |
| `payments.newPaymentTitle` | Record a payment | Enregistrer un paiement |
| `payments.newPaymentDescription` | Pay a farmer for a purchase that's still owed. | Payer un producteur pour un achat encore dû. |
| `payments.columnPayment` | Payment | Paiement |
| `payments.columnPurchase` | Purchase / payable | Achat / dette |
| `payments.columnDate` | Date | Date |
| `payments.columnMethod` | Method | Mode |
| `payments.columnAmount` | Amount | Montant |
| `payments.columnStatus` | Status | Statut |
| `payments.detailTitle` | Payment details | Détails du paiement |
| `payments.detailDescription` | Recorded payment information. | Informations sur le paiement enregistré. |
| `payments.emptyTitle` | No payments yet | Aucun paiement pour le moment |
| `payments.emptyDescription` | Record a payment against a purchase to see it here. | Enregistrez un paiement sur un achat pour le voir ici. |
| `payments.deleteTitle` | Void this payment? | Annuler ce paiement ? |
| `payments.deleteDescription` | The payment of {{amount}} will be voided: it stays on record, marked voided, and its amount is owed again on the purchase. A cash payment goes back into the till it came from, which must still be open. | Le paiement de {{amount}} sera annulé : il reste enregistré, marqué annulé, et son montant est de nouveau dû sur l’achat. Un paiement en espèces retourne dans la caisse d’origine, qui doit encore être ouverte. |
| `payments.reference` | Reference | Référence |
| `payments.methods.CASH` | Cash | Espèces |
| `payments.methods.BANK_TRANSFER` | Bank transfer | Virement bancaire |
| `payments.methods.MOBILE_MONEY` | Mobile money | Mobile Money |
| `payments.methods.OTHER` | Other | Autre |
| `payments.methods.PREFINANCE_OFFSET` | Prefinance offset | Compensation préfinancement |
| `payments.status.RECORDED` | Recorded | Enregistré |
| `payments.status.VOIDED` | Voided | Annulé |
| `payments.whichPurchase` | Which purchase? | Quel achat ? |
| `payments.method` | Payment method | Mode de paiement |
| `payments.cashTillRequired` | Open a cash session before recording a cash payment. | Ouvrez une session de caisse avant d'enregistrer un paiement en espèces. |
| `payments.cashTillPermissionRequired` | You need cash-session access to record a cash payment. | L'accès aux sessions de caisse est nécessaire pour enregistrer un paiement en espèces. |
| `payments.purchaseOption` | {{name}} — owes {{amount}} | {{name}} — doit {{amount}} |
| `payments.amountPaidNow` | Amount paid now (XAF) | Montant payé maintenant (XAF) |
| `payments.amountPaidNowHint` | Total owed: {{amount}}. You can pay in full or part. | Total dû : {{amount}}. Vous pouvez payer en totalité ou en partie. |
| `payments.amountPlaceholder` | e.g. 50000 | ex. 50000 |
| `payments.recordPayment` | Record payment | Enregistrer le paiement |
| `payments.allPaidUp` | Every purchase is already fully paid. Nothing to record. | Tous les achats sont déjà entièrement payés. Rien à enregistrer. |
| `payments.recordedTitle` | Payment recorded | Paiement enregistré |
| `payments.recordedDescription` | {{amount}} paid to {{farmer}}. | {{amount}} payé à {{farmer}}. |
| `payments.recordAnother` | Record another payment | Enregistrer un autre paiement |
| `payments.columnPaidTo` | Paid to | Payé à |
| `payments.voidAction` | Void payment | Annuler le paiement |
| `till.title` | Till | Caisse |
| `till.description` | The till: what it held at its last closing, every provision received and every cash payment out. | La caisse : ce qu'elle contenait à la dernière clôture, chaque provision reçue et toutes les sorties d'espèces. |
| `till.openTill` | Open till | Ouvrir la caisse |
| `till.closeTill` | Close till | Clôturer la caisse |
| `till.addProvision` | Add provision | Ajouter une provision |
| `till.openDescription` | The till opens with the cash counted at its last closing, plus the provisions the boss gave you. | La caisse s'ouvre avec les espèces comptées à sa dernière clôture, plus les provisions que le patron vous a remises. |
| `till.provisionDescription` | Give a cashier cash. If their till is closed, the provision waits until they open it: it does not open it. | Remettez des espèces à un caissier. Si sa caisse est fermée, la provision attend qu'il l'ouvre : elle ne l'ouvre pas. |
| `till.closeDescription` | Count the cash in the till. Any difference with the expected amount is recorded as a variance. | Comptez les espèces en caisse. Tout écart avec le montant attendu est enregistré. |
| `till.openingFloat` | Opening float | Fonds de caisse |
| `till.openingFloatHint` | The cash physically in the till now. It can be 0. | Les espèces présentes dans la caisse maintenant. Peut être 0. |
| `till.provisionAmount` | Amount added | Montant ajouté |
| `till.declaredClosing` | Cash counted | Espèces comptées |
| `till.declaredClosingHint` | The cash physically in the till at closing. | Les espèces présentes dans la caisse à la clôture. |
| `till.expectedClosing` | Expected in till | Attendu en caisse |
| `till.variance` | Variance | Écart |
| `till.notes` | Notes | Remarques |
| `till.provisions` | Provisions | Provisions |
| `till.provisionCount_one` | {{count}} provision | {{count}} provision |
| `till.provisionCount_other` | {{count}} provisions | {{count}} provisions |
| `till.paidOut` | Paid out | Sorties |
| `till.available` | Available now | Disponible |
| `till.openedAt` | Opened {{date}} | Ouverte le {{date}} |
| `till.closedTitle` | Your till is closed | Votre caisse est fermée |
| `till.closedDescription` | Open your till to receive the waiting provisions and record cash payments. | Ouvrez votre caisse pour recevoir les provisions en attente et enregistrer les paiements en espèces. |
| `till.closedNoPermission` | Only a cashier opens the till. Cash payments are possible once they have opened it. | Seul un caissier ouvre la caisse. Les paiements en espèces seront possibles dès qu'il l'aura ouverte. |
| `till.provisionsHeading` | Provisions | Provisions |
| `till.noProvisions` | No provisions added yet | Aucune provision ajoutée |
| `till.movementsHeading` | All movements | Tous les mouvements |
| `till.noMovements` | No cash movements yet | Aucun mouvement d'espèces |
| `till.historyHeading` | Till history | Historique des caisses |
| `till.noHistory` | No tills yet | Aucune caisse |
| `till.status.OPEN` | Open | Ouverte |
| `till.status.CLOSED` | Closed | Clôturée |
| `till.columns.when` | When | Date |
| `till.columns.type` | Type | Type |
| `till.columns.description` | Description | Description |
| `till.columns.amount` | Amount | Montant |
| `till.columns.cashier` | Cashier | Caissier |
| `till.columns.opened` | Opened | Ouverture |
| `till.columns.status` | Status | Statut |
| `till.columns.balance` | Cash in till | Espèces en caisse |
| `till.columns.from` | Given by | Remise par |
| `till.referenceTypes.PROVISION` | Provision | Provision |
| `till.referenceTypes.PURCHASE_PAYMENT` | Purchase payment | Paiement d'achat |
| `till.referenceTypes.EXPENSE` | Expense | Dépense |
| `till.referenceTypes.PREFINANCE_DISBURSEMENT` | Prefinance disbursement | Décaissement de préfinancement |
| `till.referenceTypes.SALARY_PAYOUT` | Salary payout | Paiement de salaire |
| `till.referenceTypes.OTHER` | Other | Autre |
| `till.details.title` | Till of {{name}} | Caisse de {{name}} |
| `till.details.description` | Opened {{opened}} · closed {{closed}} | Ouverte le {{opened}} · clôturée le {{closed}} |
| `till.details.closedBy` | Closed by {{name}} | Clôturée par {{name}} |
| `till.closedForBoss` | No till is open. You can already give a provision: it goes into the till when the cashier opens it. | Aucune caisse n'est ouverte. Vous pouvez déjà remettre une provision : elle entrera dans la caisse quand le caissier l'ouvrira. |
| `till.pendingToReceive` | Provisions going into the till | Provisions qui entreront dans la caisse |
| `till.providedBy` | From {{name}}, {{date}} | De {{name}}, le {{date}} |
| `till.noPendingProvisions` | No provision waiting. | Aucune provision en attente. |
| `till.carryOverHint` | The cash counted at the last closing stays in the till and is added to it. | Les espèces comptées à la dernière clôture restent dans la caisse et s'y ajoutent. |
| `till.cashier` | Cashier | Caissier |
| `till.chooseCashier` | Choose the cashier | Choisir le caissier |
| `till.noCashiers` | No active cashier. First create an account with the Cashier role. | Aucun caissier actif. Créez d'abord un compte avec le rôle Caissier. |
| `till.cashierTillOpen` | Their till is open: the provision goes in at once. | Sa caisse est ouverte : la provision y entre tout de suite. |
| `till.cashierTillClosed` | Their till is closed: the provision waits until they open it. | Sa caisse est fermée : la provision attendra qu'il l'ouvre. |
| `till.viewingCashierTill` | {{name}}'s till, which your cash payments come from. | La caisse de {{name}}, d'où sortent vos paiements en espèces. |
| `till.pendingHeading` | Provisions waiting for the till to open | Provisions en attente d'ouverture |
| `expenses.title` | Expenses | Dépenses |
| `expenses.description` | Running costs paid from the till: vehicle parts, fuel, office supplies and the like. | Les frais de fonctionnement payés depuis la caisse : pièces de véhicule, carburant, fournitures de bureau… |
| `expenses.record` | Record expense | Enregistrer une dépense |
| `expenses.filterCategory` | Filter by category | Filtrer par catégorie |
| `expenses.allCategories` | All categories | Toutes les catégories |
| `expenses.paidTo` | Paid to {{name}} | Payé à {{name}} |
| `expenses.cancelledBecause` | Cancelled: {{reason}} | Annulée : {{reason}} |
| `expenses.cancelAction` | Cancel expense | Annuler la dépense |
| `expenses.emptyTitle` | No expenses yet | Aucune dépense pour l’instant |
| `expenses.emptyDescription` | Expenses recorded from the till appear here, newest first. | Les dépenses payées depuis la caisse apparaissent ici, les plus récentes d’abord. |
| `expenses.columns.date` | Date | Date |
| `expenses.columns.category` | Category | Catégorie |
| `expenses.columns.what` | What for | Objet |
| `expenses.columns.amount` | Amount | Montant |
| `expenses.columns.status` | Status | Statut |
| `expenses.status.RECORDED` | Recorded | Enregistrée |
| `expenses.status.CANCELLED` | Cancelled | Annulée |
| `expenses.form.title` | Record an expense | Enregistrer une dépense |
| `expenses.form.description` | Paid in cash from the open till. The till goes down by this amount. | Payée en espèces depuis la caisse ouverte. La caisse diminue de ce montant. |
| `expenses.form.tillAvailable` | In the till now: {{amount}} | En caisse maintenant : {{amount}} |
| `expenses.form.tillRequired` | Expenses are paid from the till: open the till first. | Les dépenses sont payées depuis la caisse : ouvrez d’abord la caisse. |
| `expenses.form.category` | Category | Catégorie |
| `expenses.form.categoryPlaceholder` | Choose a category | Choisissez une catégorie |
| `expenses.form.newCategory` | New category | Nouvelle catégorie |
| `expenses.form.newCategoryPlaceholder` | e.g. Generator fuel | ex. Carburant du groupe électrogène |
| `expenses.form.add` | Add | Ajouter |
| `expenses.form.amount` | Amount | Montant |
| `expenses.form.exceedsTill` | The till holds only {{amount}}. | La caisse ne contient que {{amount}}. |
| `expenses.form.what` | What was bought | Objet de la dépense |
| `expenses.form.whatHint` | e.g. Brake pads for the Hilux, 2 reams of paper | ex. Plaquettes de frein pour le Hilux, 2 rames de papier |
| `expenses.form.whatRequired` | Say what the money was spent on. | Indiquez à quoi l’argent a servi. |
| `expenses.form.paidTo` | Paid to | Payé à |
| `expenses.form.paidToHint` | The shop, garage or person who received the cash (optional). | La boutique, le garage ou la personne qui a reçu l’argent (facultatif). |
| `expenses.form.submit` | Record and pay | Enregistrer et payer |
| `expenses.cancel.title` | Cancel this expense? | Annuler cette dépense ? |
| `expenses.cancel.description` | {{amount}} for “{{what}}” goes back into the till it was paid from. The expense stays in the list, marked cancelled. | {{amount}} pour « {{what}} » revient dans la caisse qui l’a payée. La dépense reste dans la liste, marquée annulée. |
| `expenses.cancel.reason` | Why is it cancelled? | Pourquoi l’annuler ? |
| `expenses.cancel.confirm` | Cancel the expense | Annuler la dépense |
| `expenses.categories.VEHICLE_PARTS` | Vehicle parts & repairs | Pièces et réparations de véhicules |
| `expenses.categories.FUEL` | Fuel | Carburant |
| `expenses.categories.OFFICE_SUPPLIES` | Office supplies | Fournitures de bureau |
| `expenses.categories.TRANSPORT` | Transport & travel | Transport et déplacements |
| `expenses.categories.UTILITIES` | Utilities | Électricité, eau et téléphone |
| `expenses.categories.CASUAL_LABOUR` | Casual labour | Main-d’œuvre journalière |
| `expenses.categories.MAINTENANCE` | Maintenance & cleaning | Entretien et nettoyage |
| `expenses.categories.OTHER` | Other | Autres |

### C.5 `buyers`

| Key | English | Français |
|---|---|---|
| `buyers.title` | Buyers | Acheteurs |
| `buyers.description` | Money advanced to buyers, and what they still owe in cocoa or cash. | Argent avancé aux acheteurs, et ce qu'ils doivent encore en cacao ou en espèces. |
| `buyers.totalAdvanced` | Total advanced | Total avancé |
| `buyers.totalOutstanding` | Total outstanding | Total restant dû |
| `buyers.advanceDate` | Advance date | Date de l'avance |
| `buyers.deliveredQuantity` | Cocoa delivered | Cacao livré |
| `buyers.prefinanceDetailsDescription` | Advance and settlement recorded by the backend. | Avance et règlement enregistrés par le serveur. |
| `buyers.settlementTitle` | Prefinance settlement | Règlement du préfinancement |
| `buyers.settlePrefinance` | Record cocoa delivery | Enregistrer une livraison de cacao |
| `buyers.noPrefinanceTitle` | No advances recorded | Aucune avance enregistrée |
| `buyers.noPrefinanceDescription` | Prefinances returned by the backend will appear here. | Les préfinancements renvoyés par le serveur apparaîtront ici. |
| `buyers.activeBuyers` | Active buyers | Acheteurs actifs |
| `buyers.buyerRegister` | Buyer register | Registre des acheteurs |
| `buyers.filterStatus` | Filter by status | Filtrer par statut |
| `buyers.allStatuses` | All statuses | Tous les statuts |
| `buyers.columnBuyer` | Buyer name | Nom de l'acheteur |
| `buyers.columnAdvanced` | Advanced | Avancé |
| `buyers.columnStillOwed` | Still owed | Reste dû |
| `buyers.columnStatus` | Status | Statut |
| `buyers.emptyTitle` | No buyers yet | Aucun acheteur pour le moment |
| `buyers.emptyDescription` | Buyer records returned by the backend will appear here. | Les acheteurs renvoyés par le serveur apparaîtront ici. |
| `buyers.addBuyer` | Add buyer | Ajouter acheteur |
| `buyers.addBuyerDescription` | Register a new cocoa buyer. | Enregister un nouvel acheteur |
| `buyers.editTitle` | Edit buyer | Modifier acheteur |
| `buyers.editDescription` | Update buyer details. Trust status affects prefinance eligibility. | Mettre les informations de l'acheteur à jour |
| `buyers.phone` | Phone number | Numéro de téléphone |
| `buyers.contactPerson` | Contact to contact | Personne à contacter |
| `buyers.notes` | Notes | Notes |
| `buyers.unitPrice` | Price/Kg | Prix/Kg |
| `buyers.unitPricePlaceholder` | e.g 2000 | ex. 2000 |
| `buyers.address` | Address | Addresse |
| `buyers.idNumber` | ID number | Numéro CNI |
| `buyers.idNumberPlaceholder` | e.g. 123456789 or AB12345678 | ex. 123456789 ou AB12345678 |
| `buyers.isTrusted` | Trusted buyer | Trusted buyer |
| `buyers.trustedHint` | Trusted buyers are eligible for prefinance budgets (Boss approval required). | Trusted buyers are eligible for prefinance budgets (Boss approval required). |
| `buyers.addPrefinance` | Add prefinance | Ajouter préfinancement |
| `buyers.prefinanceDescription` | Create a prefinance budget. | Créer un préfinancement |
| `buyers.selectBuyer` | Buyer | *(missing)* |
| `buyers.selectBuyerPlaceholder` | Select a trusted buyer | Selectionner un acheteur |
| `buyers.prefinanceAmount` | Budget amount | Montant |
| `buyers.prefinanceAmountPlaceholder` | e.g 500 000 | ex. 500 000 |
| `buyers.prefinanceNotes` | Notes | Notes |
| `buyers.prefinanceNotesPlaceholder` | Season, contract reference, special terms… | Saison, reférence contrat, etc.... |
| `buyers.draftPrefinance` | Create draft | Create draft |
| `buyers.agreedPricePerKg` | Agreed price per kg | Prix convenu par kg |
| `buyers.agreedPriceHint` | Current market price: {{price}}/kg. The agreed price can differ. | Prix du marché actuel : {{price}}/kg. Le prix convenu peut être différent. |
| `buyers.settleThroughPurchase` | Cocoa this buyer brings is recorded as a purchase. The purchase repays this advance first, at the agreed price, and only the rest is paid to the buyer. | Le cacao apporté par cet acheteur s'enregistre comme un achat. L'achat rembourse d'abord cette avance, au prix convenu, et seul le reste est payé à l'acheteur. |
| `buyers.recordPurchase` | Record a purchase | Enregistrer un achat |
| `buyers.history.title` | Delivery history | Historique des livraisons |
| `buyers.history.description` | Every delivery of cocoa by this buyer. Open one to see its purchase. | Toutes les livraisons de cacao de cet acheteur. Ouvrez-en une pour voir son achat. |
| `buyers.history.when` | Delivered | Livré le |
| `buyers.history.gross` | Gross | Brut |
| `buyers.history.net` | Net | Net |
| `buyers.history.price` | Price | Prix |
| `buyers.history.amount` | Amount | Montant |
| `buyers.history.repaid` | Repaid on prefinance | Remboursé sur préfinancement |
| `buyers.history.emptyTitle` | No deliveries yet | Aucune livraison |
| `buyers.history.emptyDescription` | Cocoa this buyer brings is recorded as a purchase and listed here. | Le cacao apporté par cet acheteur est enregistré comme achat et listé ici. |
| `buyers.balance.owes` | Owes the company | Doit à l'entreprise |
| `buyers.balance.owesHint_one` | Over {{count}} advance, all cash sessions | Sur {{count}} avance, toutes caisses confondues |
| `buyers.balance.owesHint_other` | Over {{count}} advances, all cash sessions | Sur {{count}} avances, toutes caisses confondues |
| `buyers.balance.owedToBuyer` | Company owes the buyer | L'entreprise doit à l'acheteur |
| `buyers.balance.owedToBuyerHint` | Cocoa delivered, not yet paid | Cacao livré, pas encore payé |
| `buyers.balance.nothingOwed` | Nothing owed | Rien à régler |
| `buyers.balance.carriedOver` | This buyer still owes {{amount}} from earlier advances. It carries over. | Cet acheteur doit encore {{amount}} sur ses avances précédentes. Ce montant est reporté. |
| `buyers.balance.totalAfter` | Total owed after this advance: {{amount}} | Total dû après cette avance : {{amount}} |
| `buyers.advanceFromTill` | The advance is handed over in cash from the till (available: {{amount}}). | L'avance est remise en espèces depuis la caisse (disponible : {{amount}}). |
| `buyers.disburse.action` | Hand over advance | Remettre l'avance |
| `buyers.disburse.title` | Hand over the advance | Remettre l'avance |
| `buyers.disburse.description` | This advance was recorded without being handed over. The cash leaves the till and the buyer owes it. | Cette avance a été enregistrée sans être remise. Les espèces sortent de la caisse et l'acheteur les doit. |
| `buyers.disburse.amount` | To hand over | À remettre |
| `buyers.disburse.submit` | Hand over in cash | Remettre en espèces |

### C.6 `partners`

| Key | English | Français |
|---|---|---|
| `partners.fields.type` | Partner type | Type de partenaire |
| `partners.fields.selectType` | Select a type | Choisir un type |
| `partners.fields.name` | Name | Nom |
| `partners.fields.contactPerson` | Contact person | Personne à contacter |
| `partners.fields.phone` | Phone number | Téléphone |
| `partners.fields.idNumber` | ID number | Numéro d'identité |
| `partners.fields.address` | Address | Adresse |
| `partners.fields.notes` | Notes | Remarques |
| `partners.fields.status` | Status | Statut |
| `partners.fields.createdAt` | Added | Ajouté le |
| `partners.fields.updatedAt` | Last updated | Modifié le |
| `partners.fields.kind` | Partner is | Le partenaire est |
| `partners.fields.fullName` | Full name | Nom complet |
| `partners.fields.legalName` | Legal name | Raison sociale |
| `partners.fields.contactPersonHint` | The person you deal with at this company. | La personne avec qui vous traitez dans cette entreprise. |
| `partners.fields.location` | Location | Localisation |
| `partners.fields.locationPlaceholder` | e.g. Douala, Bonabéri industrial zone | ex. Douala, zone industrielle de Bonabéri |
| `partners.fields.officialIdentifiers` | Official identifiers (optional) | Identifiants officiels (facultatif) |
| `partners.fields.registrationNumber` | Trade register number (RCCM) | Numéro RCCM |
| `partners.fields.taxNumber` | Taxpayer number (NIU) | Numéro d'identifiant unique (NIU) |
| `partners.fields.identifier` | ID / RCCM | CNI / RCCM |
| `partners.types.BUYER` | Buyer | Acheteur |
| `partners.types.FARMER` | Farmer | Producteur |
| `partners.types.COMMERCIAL` | Commercial partner | Partenaire commercial |
| `partners.types.LOGISTICS` | Logistics partner | Partenaire logistique |
| `partners.types.OTHER` | Other partner | Autre partenaire |
| `partners.status.active` | Active | Actif |
| `partners.status.inactive` | Inactive | Inactif |
| `partners.trusted` | Trusted for prefinancing | Éligible au préfinancement |
| `partners.notTrusted` | Not trusted for prefinancing | Non éligible au préfinancement |
| `partners.openPrefinancing` | Open prefinancing | Ouvrir le préfinancement |
| `partners.deactivate` | Deactivate | Désactiver |
| `partners.reactivate` | Reactivate | Réactiver |
| `partners.deactivateTitle` | Deactivate partner? | Désactiver le partenaire ? |
| `partners.reactivateTitle` | Reactivate partner? | Réactiver le partenaire ? |
| `partners.deactivateDescription` | <bold>{{name}}</bold> will no longer be offered for new purchases, deliveries or prefinances. Existing records are kept, and you can reactivate them from All partners. | <bold>{{name}}</bold> ne sera plus proposé pour les nouveaux achats, livraisons ou préfinancements. Les enregistrements existants sont conservés ; vous pourrez le réactiver depuis Tous les partenaires. |
| `partners.reactivateDescription` | <bold>{{name}}</bold> will be available again for new purchases, deliveries and prefinances. | <bold>{{name}}</bold> sera de nouveau disponible pour les achats, livraisons et préfinancements. |
| `partners.sections.all.title` | All partners | Tous les partenaires |
| `partners.sections.all.description` | Every partner of every type, including deactivated ones. | Tous les partenaires, de tous types, y compris les désactivés. |
| `partners.sections.all.add` | Add partner | Ajouter un partenaire |
| `partners.sections.all.createTitle` | Add partner | Ajouter un partenaire |
| `partners.sections.all.editTitle` | Edit partner | Modifier le partenaire |
| `partners.sections.all.formDescription` | Choose the partner type, then fill in their details. | Choisissez le type de partenaire, puis renseignez ses informations. |
| `partners.sections.all.emptyTitle` | No partners yet | Aucun partenaire |
| `partners.sections.all.emptyDescription` | Partners you add will appear here. | Les partenaires ajoutés apparaîtront ici. |
| `partners.sections.buyer.title` | Buyers | Acheteurs |
| `partners.sections.buyer.description` | Field buyers you purchase from and may prefinance. | Acheteurs terrain auprès desquels vous achetez et que vous pouvez préfinancer. |
| `partners.sections.buyer.add` | Add buyer | Ajouter un acheteur |
| `partners.sections.buyer.createTitle` | Add buyer | Ajouter un acheteur |
| `partners.sections.buyer.editTitle` | Edit buyer | Modifier l'acheteur |
| `partners.sections.buyer.formDescription` | Trust status decides whether the buyer can be prefinanced. | Le statut de confiance détermine si l'acheteur peut être préfinancé. |
| `partners.sections.buyer.emptyTitle` | No buyers yet | Aucun acheteur |
| `partners.sections.buyer.emptyDescription` | Buyers you add will appear here. | Les acheteurs ajoutés apparaîtront ici. |
| `partners.sections.farmer.title` | Farmers | Producteurs |
| `partners.sections.farmer.description` | Farmers you buy cocoa from directly. | Producteurs auprès desquels vous achetez directement le cacao. |
| `partners.sections.farmer.add` | Add farmer | Ajouter un producteur |
| `partners.sections.farmer.createTitle` | Add farmer | Ajouter un producteur |
| `partners.sections.farmer.editTitle` | Edit farmer | Modifier le producteur |
| `partners.sections.farmer.formDescription` | Farmers can be selected when recording a purchase. | Les producteurs peuvent être choisis lors d'un achat. |
| `partners.sections.farmer.emptyTitle` | No farmers yet | Aucun producteur |
| `partners.sections.farmer.emptyDescription` | Farmers you add will appear here. | Les producteurs ajoutés apparaîtront ici. |
| `partners.sections.commercial.title` | Commercial partners | Partenaires commerciaux |
| `partners.sections.commercial.description` | Companies your trucks deliver cocoa to. | Entreprises auxquelles vos camions livrent le cacao. |
| `partners.sections.commercial.add` | Add commercial partner | Ajouter un partenaire commercial |
| `partners.sections.commercial.createTitle` | Add commercial partner | Ajouter un partenaire commercial |
| `partners.sections.commercial.editTitle` | Edit commercial partner | Modifier le partenaire commercial |
| `partners.sections.commercial.formDescription` | Commercial partners can receive deliveries. | Les partenaires commerciaux peuvent recevoir des livraisons. |
| `partners.sections.commercial.emptyTitle` | No commercial partners yet | Aucun partenaire commercial |
| `partners.sections.commercial.emptyDescription` | Commercial partners you add will appear here. | Les partenaires commerciaux ajoutés apparaîtront ici. |
| `partners.sections.logistics.title` | Logistics partners | Partenaires logistiques |
| `partners.sections.logistics.description` | Transporters and other logistics providers. | Transporteurs et autres prestataires logistiques. |
| `partners.sections.logistics.add` | Add logistics partner | Ajouter un partenaire logistique |
| `partners.sections.logistics.createTitle` | Add logistics partner | Ajouter un partenaire logistique |
| `partners.sections.logistics.editTitle` | Edit logistics partner | Modifier le partenaire logistique |
| `partners.sections.logistics.formDescription` | Record the transporter's contact details. | Renseignez les coordonnées du transporteur. |
| `partners.sections.logistics.emptyTitle` | No logistics partners yet | Aucun partenaire logistique |
| `partners.sections.logistics.emptyDescription` | Logistics partners you add will appear here. | Les partenaires logistiques ajoutés apparaîtront ici. |
| `partners.sections.other.title` | Other partners | Autres partenaires |
| `partners.sections.other.description` | Partners that fit no other type. | Partenaires n'entrant dans aucun autre type. |
| `partners.sections.other.add` | Add partner | Ajouter un partenaire |
| `partners.sections.other.createTitle` | Add partner | Ajouter un partenaire |
| `partners.sections.other.editTitle` | Edit partner | Modifier le partenaire |
| `partners.sections.other.formDescription` | Record the partner's contact details. | Renseignez les coordonnées du partenaire. |
| `partners.sections.other.emptyTitle` | No other partners yet | Aucun autre partenaire |
| `partners.sections.other.emptyDescription` | Partners you add will appear here. | Les partenaires ajoutés apparaîtront ici. |
| `partners.kinds.INDIVIDUAL` | Individual | Personne physique |
| `partners.kinds.COMPANY` | Company | Personne morale |

### C.7 `logistics`

| Key | English | Français |
|---|---|---|
| `logistics.title` | Logistics | Logistique |
| `logistics.description` | Deliveries moving cocoa between the warehouse and buyers. | Livraisons de cacao entre l'entrepôt et les acheteurs. |
| `logistics.inTransit` | In transit | En transit |
| `logistics.delivered` | Delivered | Livrées |
| `logistics.planned` | Planned | Planifiées |
| `logistics.deliveryRegister` | Delivery register | Registre des livraisons |
| `logistics.filterStatus` | Filter by status | Filtrer par statut |
| `logistics.allStatuses` | All statuses | Tous les statuts |
| `logistics.columnVehicle` | Vehicle | Véhicule |
| `logistics.columnDriver` | Driver | Chauffeur |
| `logistics.columnDestination` | Destination | Destination |
| `logistics.columnDeparted` | Departed | Départ |
| `logistics.columnStatus` | Status | Statut |
| `logistics.declaredNetWeight` | Declared net weight | Poids net déclaré |
| `logistics.emptyTitle` | No deliveries yet | Aucune livraison pour le moment |
| `logistics.emptyDescription` | Deliveries you schedule will show up here. | Les livraisons que vous planifiez apparaîtront ici. |
| `logistics.newDelivery` | New delivery | Nouvelle livraison |
| `logistics.form.title` | Record a truck loading | Enregistrer un chargement |
| `logistics.form.description` | Capture the trip and the weights declared at loading. Declared weights cannot be changed afterwards. | Saisissez le trajet et les poids déclarés au chargement. Les poids déclarés ne peuvent plus être modifiés ensuite. |
| `logistics.form.partner` | Commercial partner | Partenaire commercial |
| `logistics.form.selectPartner` | Select a partner | Choisir un partenaire |
| `logistics.form.loadingPartners` | Loading partners… | Chargement des partenaires… |
| `logistics.form.noPartners` | No active commercial partner yet. Add one before recording a delivery. | Aucun partenaire commercial actif. Ajoutez-en un avant d'enregistrer une livraison. |
| `logistics.form.destinationPlaceholder` | e.g. Douala port warehouse | ex. Entrepôt du port de Douala |
| `logistics.form.vehicleNumber` | Plate number | Immatriculation |
| `logistics.form.vehicleNumberPlaceholder` | e.g. LT 123 AB | ex. LT 123 AB |
| `logistics.form.vehicleType` | Vehicle type | Type de véhicule |
| `logistics.form.vehicleTypePlaceholder` | e.g. 10-tonne truck | ex. Camion 10 tonnes |
| `logistics.form.driverName` | Driver name | Nom du chauffeur |
| `logistics.form.driverLicense` | Driver licence number | Numéro de permis |
| `logistics.form.driverPhone` | Driver phone | Téléphone du chauffeur |
| `logistics.form.grossWeight` | Declared gross weight | Poids brut déclaré |
| `logistics.form.netWeightHint` | Cannot exceed the gross weight. | Ne peut pas dépasser le poids brut. |
| `logistics.form.departureDate` | Departure date | Date de départ |
| `logistics.form.selectDate` | Select date | Choisir une date |
| `logistics.form.notes` | Notes | Remarques |
| `logistics.form.submit` | Record loading | Enregistrer le chargement |
| `logistics.form.required` | This field is required. | Ce champ est obligatoire. |
| `logistics.form.tooLong` | Use at most {{max}} characters. | {{max}} caractères au maximum. |
| `logistics.form.mustBePositive` | Enter a weight greater than zero. | Saisissez un poids supérieur à zéro. |
| `logistics.form.netExceedsGross` | Net weight cannot exceed gross weight. | Le poids net ne peut pas dépasser le poids brut. |
| `logistics.form.escort` | Escort | Convoyeur |
| `logistics.form.escortHint` | An employee travelling with the load (optional). | Un employé qui accompagne le chargement (facultatif). |
| `logistics.form.escortUnavailable` | You cannot see the staff list: no escort can be chosen. | Vous ne voyez pas la liste du personnel : aucun convoyeur ne peut être choisi. |
| `logistics.form.noEscort` | No escort | Pas de convoyeur |
| `logistics.form.bags` | Number of bags | Nombre de sacs |
| `logistics.form.bagsInvalid` | Enter a whole number of bags, at least 1. | Saisissez un nombre entier de sacs, au moins 1. |
| `logistics.form.grossWeightHint` | Net weight + {{kg}} kg per bag, calculated. | Poids net + {{kg}} kg par sac, calculé. |
| `logistics.form.inStock` | In stock: {{weight}} | En stock : {{weight}} |
| `logistics.form.exceedsStock` | Only {{weight}} in stock. | Seulement {{weight}} en stock. |
| `logistics.details.title` | Delivery details | Détails de la livraison |
| `logistics.details.description` | The trip as recorded at loading. | Le trajet tel qu'enregistré au chargement. |
| `logistics.details.trip` | Trip | Trajet |
| `logistics.details.driver` | Driver | Chauffeur |
| `logistics.details.weights` | Declared weights | Poids déclarés |
| `logistics.details.recordedAt` | Recorded | Enregistré le |
| `logistics.details.markDelivered` | Mark as delivered | Marquer comme livrée |

### C.8 `inventory`

| Key | English | Français |
|---|---|---|
| `inventory.title` | Inventory | Stock |
| `inventory.description` | {{weight}} of cocoa across {{count}} batches. | {{weight}} de cacao répartis sur {{count}} lots. |
| `inventory.totalStock` | Total stock | Stock total |
| `inventory.columnQuantity` | Quantity | Quantité |
| `inventory.movementType` | Movement | Mouvement |
| `inventory.movedAt` | Date | Date |
| `inventory.movementNotes` | Notes | Notes |
| `inventory.emptyTitle` | No stock recorded | Aucun stock enregistré |
| `inventory.emptyDescription` | Batches created from purchases will appear here. | Les lots créés à partir des achats apparaîtront ici. |
| `inventory.adjustmentReason` | Reason for adjustment | Raison de l'ajustement |
| `inventory.adjustmentReasonHint` | Business reason for the adjustment; stored for audit. | Ceci est sauvegardé pour des raisons d'audit |
| `inventory.quantityHint` | Quantity of stock to be saved | La quantité du stock à enregistrer |
| `inventory.adjustmentDelta` | {{direction}} of {{delta}} — a reason is required. | {{direction}} of {{delta}} — a reason is required. |
| `inventory.adjustmentIn` | Increase | Increase |
| `inventory.adjustmentOut` | Decrease | Decrease |
| `inventory.noReason` | No adjustment reason recorded | No adjustment reason recorded |

### C.9 `pricing`

| Key | English | Français |
|---|---|---|
| `pricing.title` | Cocoa price | Prix du cacao |
| `pricing.description` | This is the price Cashiers and the Financial Secretary see when recording a purchase. | C'est le prix que voient les Caissiers et la Secrétaire Financière lors de l'enregistrement d'un achat. |
| `pricing.currentPriceCard` | Current price | Prix actuel |
| `pricing.effectiveFrom` | Effective from {{date}} | En vigueur depuis le {{date}} |
| `pricing.priceChange` | Change from previous | Écart avec le précédent |
| `pricing.vsPrevious` | Compared with the previous price | Comparaison avec le prix précédent |
| `pricing.historyEntries` | Price records | Enregistrements de prix |
| `pricing.historyEntriesHelper` | Historical prices preserved | Prix historiques conservés |
| `pricing.historyProtection` | Past purchases keep the price that applied when they were recorded. | Les achats passés conservent le prix en vigueur lors de leur enregistrement. |
| `pricing.setTodaysPrice` | Set today's price | Fixer le prix du jour |
| `pricing.currentPrice` | Current price: {{price}}/kg | Prix actuel : {{price}}/kg |
| `pricing.newPriceLabel` | New price per kg (XAF) | Nouveau prix par kg (XAF) |
| `pricing.newPriceHint` | This applies to purchases from now on. Past purchases keep the price they were recorded at. | Ceci s'applique aux achats à partir de maintenant. Les achats passés gardent le prix auquel ils ont été enregistrés. |
| `pricing.newPricePlaceholder` | e.g. 1500 | ex. 1500 |
| `pricing.updatePrice` | Update price | Mettre à jour le prix |
| `pricing.publishPriceAction` | New price | Nouveau prix |
| `pricing.publishTitle` | Publish a new price | Publier un nouveau prix |
| `pricing.publishDescription` | This becomes the price for every purchase recorded from now on. | Ce prix s'appliquera à chaque achat enregistré à partir de maintenant. |
| `pricing.publishPrice` | Publish price | Publier le prix |
| `pricing.effectiveFromLabel` | Effective from | En vigueur à partir du |
| `pricing.effectiveFromHint` | Leave empty to start today. A price cannot be back-dated. | Laissez vide pour commencer aujourd'hui. Un prix ne peut pas être antidaté. |
| `pricing.effectiveFromToday` | Today | Aujourd'hui |
| `pricing.effectiveFromClear` | Clear the date | Effacer la date |
| `pricing.changeUp` | Up {{amount}} on the current price | En hausse de {{amount}} par rapport au prix actuel |
| `pricing.changeDown` | Down {{amount}} on the current price | En baisse de {{amount}} par rapport au prix actuel |
| `pricing.changeSame` | Same as the current price | Identique au prix actuel |
| `pricing.priceHistory` | Price history | Historique des prix |
| `pricing.columnEffectiveFrom` | Effective from | En vigueur depuis |
| `pricing.columnPricePerKg` | Price per kg | Prix par kg |
| `pricing.columnSetBy` | Set by | Fixé par |
| `pricing.columnStatus` | Status | Statut |
| `pricing.emptyTitle` | No price set yet | Aucun prix fixé pour le moment |
| `pricing.emptyDescription` | Publish a price so Cashiers can record purchases. | Publiez un prix pour que les Caissiers puissent enregistrer des achats. |
| `pricing.confirmTitle` | Publish this price? | Publier ce prix ? |
| `pricing.confirmDescription` | The price becomes {{price}} per kg. Every purchase recorded from now on will use it, and it cannot be undone. | Le prix devient {{price}} par kg. Chaque achat enregistré à partir de maintenant l'utilisera, et cela est irréversible. |
| `pricing.confirmLabel` | Yes, publish it | Oui, publier |

### C.10 `payroll`

| Key | English | Français |
|---|---|---|
| `payroll.title` | Salaries | Salaires |
| `payroll.description` | Track what the company owes employees and signed cash collections. | Suivez les sommes dues aux employés et les paiements en espèces signés. |
| `payroll.totalDueOnPage` | Salary due on this page | Total dû sur cette page |
| `payroll.employeesOwed` | Employees with salary due | Employés avec un salaire dû |
| `payroll.employeeBalances` | Employee salary balances | Soldes de salaire des employés |
| `payroll.owed` | Due | Dû |
| `payroll.settled` | Settled | Réglé |
| `payroll.historyAction` | Collection history | Historique des paiements |
| `payroll.collectAction` | Collect salary | Enregistrer un paiement |
| `payroll.employeePayrollDescription` | Accruals record money owed. Collections record signed cash payouts. | Les charges constatent les sommes dues. Les retraits enregistrent les paiements signés. |
| `payroll.currentDue` | Currently owed | Somme actuellement due |
| `payroll.notes` | Notes | Notes |
| `payroll.collectionSaved` | Signed salary collection recorded. | Paiement de salaire signé enregistré. |
| `payroll.collectTitle` | Record signed collection | Enregistrer un retrait signé |
| `payroll.openTillRequired` | Open a cashier till before recording a cash salary collection. | Ouvrez une caisse avant d'enregistrer un paiement de salaire en espèces. |
| `payroll.tillAvailable` | Available in till: {{amount}} | Disponible en caisse : {{amount}} |
| `payroll.amountCollected` | Cash collected | Montant retiré en espèces |
| `payroll.collectionLimit` | Cannot exceed salary due ({{due}}) or available till balance ({{till}}). | Le montant ne peut dépasser le salaire dû ({{due}}) ni le solde disponible en caisse ({{till}}). |
| `payroll.signatureName` | Employee signature name | Nom signé par l'employé |
| `payroll.collectSubmit` | Record signed collection | Enregistrer le paiement signé |
| `payroll.payoutHistory` | Signed collection history | Historique des paiements signés |
| `payroll.noPayouts` | No salary collections recorded for this employee. | Aucun paiement de salaire enregistré pour cet employé. |
| `payroll.signedBy` | Signed by {{name}} | Signé par {{name}} |
| `payroll.totalPayroll` | Total payroll | Masse salariale totale |
| `payroll.paidPayroll` | Paid payroll | Salaires payés |
| `payroll.pendingPayroll` | Pending payroll | Salaires en attente |
| `payroll.payrollRegister` | Payroll register | Registre de paie |
| `payroll.filterStatus` | Filter by status | Filtrer par statut |
| `payroll.allStatuses` | All statuses | Tous les statuts |
| `payroll.columnEmployee` | Employee | Employé |
| `payroll.columnPeriod` | Period | Période |
| `payroll.columnAmount` | Amount | Montant |
| `payroll.columnStatus` | Status | Statut |
| `payroll.emptyTitle` | No payroll records yet | Aucun enregistrement de paie |
| `payroll.emptyDescription` | Salary payments will show up here once payroll periods are set up. | Les paiements de salaire apparaîtront ici une fois les périodes de paie configurées. |
| `payroll.modes.history.title` | History | Historique |
| `payroll.modes.history.description` | Signed salary collections, and the monthly payslip. | Les retraits de salaire signés et le bulletin mensuel. |
| `payroll.modes.collect.title` | Pay salary | Payer le salaire |
| `payroll.modes.collect.description` | Pay this employee cash from your till against their signature. | Payez cet employé en espèces depuis votre caisse, contre sa signature. |
| `payroll.advance.title` | Pay advance | Verser une avance |
| `payroll.advance.amount` | Advance amount | Montant de l'avance |
| `payroll.advance.submit` | Record signed advance | Enregistrer l'avance signée |
| `payroll.advance.badge` | Advance | Avance |
| `payroll.advance.limit` | Up to {{due}} left of the agreed salary; the till holds {{till}}. | Jusqu'à {{due}} restant sur le salaire convenu ; la caisse contient {{till}}. |
| `payroll.advance.outstanding` | Outstanding advances: {{amount}} (repaid by the next salary). | Avances en cours : {{amount}} (déduites du prochain salaire). |
| `payroll.advance.firstMonth` | First month: salary is due from {{date}}. Any payment before then is an advance on the agreed salary. | Premier mois : le salaire est dû à partir du {{date}}. Tout paiement avant cette date est une avance sur le salaire convenu. |
| `payroll.advance.hireDateRequired` | Record this employee's hire date before paying them. | Enregistrez la date d'embauche de cet employé avant de le payer. |
| `payroll.advance.agreedSalaryRequired` | Record this employee's agreed monthly salary before advancing them money. | Enregistrez le salaire mensuel convenu de cet employé avant de lui verser une avance. |
| `payroll.automatic.next` | Next month of salary ({{amount}}) is added on {{date}}. | Le prochain mois de salaire ({{amount}}) sera ajouté le {{date}}. |
| `payroll.automatic.agreedSalaryMissing` | No agreed monthly salary is recorded, so no salary is being added. Edit the employee to set it. | Aucun salaire mensuel convenu n’est enregistré : aucun salaire n’est ajouté. Modifiez l’employé pour le renseigner. |

### C.11 `personnel`

| Key | English | Français |
|---|---|---|
| `personnel.title` | Personnel | Personnel |
| `personnel.description` | {{count}} employees in the company register. | {{count}} employés dans le registre de l'entreprise. |
| `personnel.addEmployee` | Add employee | Ajouter un employé |
| `personnel.createTitle` | Add an employee | Ajouter un employé |
| `personnel.createDescription` | Record a person who works in the company. | Enregistrez une personne qui travaille dans l'entreprise. |
| `personnel.fullName` | Full name | Nom complet |
| `personnel.employeeType` | Work type | Type de travail |
| `personnel.phone` | Phone number | Numéro de téléphone |
| `personnel.saveEmployee` | Save employee | Enregistrer l'employé |
| `personnel.editTitle` | Edit employee | Modifier l'employé |
| `personnel.employeeDetails` | Employee details | Détails de l'employé |
| `personnel.actions` | Actions | Actions |
| `personnel.view` | View | Voir |
| `personnel.edit` | Edit | Modifier |
| `personnel.delete` | Delete | Supprimer |
| `personnel.deleteTitle` | Delete employee? | Supprimer l'employé ? |
| `personnel.deleteDescription` | This will remove <name>{{name}}</name> from the employee register. | Cette action retirera <name>{{name}}</name> du registre du personnel. |
| `personnel.totalEmployees` | Total employees | Total des employés |
| `personnel.activeEmployees` | Active employees | Employés actifs |
| `personnel.inactiveEmployees` | Inactive employees | Employés inactifs |
| `personnel.employeeRegister` | Employee register | Registre du personnel |
| `personnel.employeeRegisterDescription` | Employees are managed separately from application users. | Les employés sont gérés séparément des utilisateurs de l'application. |
| `personnel.searchEmployees` | Search employees | Rechercher des employés |
| `personnel.searchPlaceholder` | Name or phone | Nom ou téléphone |
| `personnel.filterStatus` | Filter by status | Filtrer par statut |
| `personnel.allStatuses` | All statuses | Tous les statuts |
| `personnel.columnEmployee` | Employee | Employé |
| `personnel.columnType` | Work type | Type de travail |
| `personnel.columnPhone` | Phone | Téléphone |
| `personnel.columnStatus` | Status | Statut |
| `personnel.noPhone` | Not provided | Non renseigné |
| `personnel.emptyTitle` | No employees found | Aucun employé trouvé |
| `personnel.emptyDescription` | Add an employee to start the personnel register. | Ajoutez un employé pour commencer le registre du personnel. |
| `personnel.status.active` | ACTIVE | ACTIF |
| `personnel.status.inactive` | INACTIVE | INACTIF |
| `personnel.types.LOADER` | Loader | Chargeur |
| `personnel.types.DRIVER` | Driver | Chauffeur |
| `personnel.types.MECHANIC` | Mechanic | Mécanicien |
| `personnel.types.CASHIER` | Cashier | Caissier |
| `personnel.types.FINANCIAL_SECRETARY` | Financial Secretary | Secrétaire financière |
| `personnel.types.WAREHOUSE_MANAGER` | Warehouse Manager | Magasinier |
| `personnel.types.OTHER` | Other | Autre |
| `personnel.hireDate` | Hire date | Date d'embauche |
| `personnel.hireDateHint` | Salary is due one month after this date. | Le salaire est dû un mois après cette date. |
| `personnel.monthlySalary` | Agreed monthly salary | Salaire mensuel convenu |
| `personnel.monthlySalaryHint` | Caps the advances paid in the first month. | Plafonne les avances versées le premier mois. |
| `personnel.active` | Active | Actif |
| `personnel.columnActions` | Actions | Actions |
| `personnel.email` | Email | E-mail |
| `personnel.idCardNumber` | ID card number | Numéro de CNI |
| `personnel.notes` | Notes | Notes |

### C.12 `users`

| Key | English | Français |
|---|---|---|
| `users.title` | User management | Gestion des utilisateurs |
| `users.description` | Manage login accounts, assigned roles, and account access. | Gérez les comptes de connexion, les rôles attribués et les accès. |
| `users.addUser` | Add user | Ajouter un utilisateur |
| `users.createTitle` | Create user | Créer un utilisateur |
| `users.createDescription` | Create a login account and assign one or more roles. | Créez un compte de connexion et attribuez un ou plusieurs rôles. |
| `users.editTitle` | Edit user | Modifier l'utilisateur |
| `users.editDescription` | Update the account's profile, employee link, and roles. | Modifiez le profil, le lien avec un employé et les rôles du compte. |
| `users.detailsTitle` | User details | Détails de l'utilisateur |
| `users.username` | Username | Nom d'utilisateur |
| `users.password` | Temporary password | Mot de passe temporaire |
| `users.fullName` | Full name | Nom complet |
| `users.email` | Email | Courriel |
| `users.employeeId` | Linked employee ID | ID de l'employé associé |
| `users.employeeIdHint` | Optional. When editing, leave blank to keep the existing employee link. | Facultatif. Lors d'une modification, laissez vide pour conserver le lien existant avec l'employé. |
| `users.roles` | Roles | Rôles |
| `users.rolesRequired` | Select at least one role. | Sélectionnez au moins un rôle. |
| `users.permissions` | Effective permissions | Autorisations effectives |
| `users.status` | Status | Statut |
| `users.active` | ACTIVE | ACTIF |
| `users.inactive` | INACTIVE | INACTIF |
| `users.lastLogin` | Last login | Dernière connexion |
| `users.emptyTitle` | No users found | Aucun utilisateur trouvé |
| `users.emptyDescription` | User accounts returned by the server will appear here. | Les comptes renvoyés par le serveur apparaîtront ici. |
| `users.view` | View details | Voir les détails |
| `users.edit` | Edit | Modifier |
| `users.delete` | Deactivate | Désactiver |
| `users.disable` | Disable account | Désactiver le compte |
| `users.enable` | Enable account | Activer le compte |
| `users.rowActions` | User actions | Actions utilisateur |
| `users.deleteTitle` | Deactivate this account? | Désactiver ce compte ? |
| `users.enableTitle` | Enable this account? | Activer ce compte? |
| `users.enableDescription` | <bold>{{name}}</bold> will be able to sign in again. | <bold>{{ name }}</bold> pourra se connecter à nouveau. |
| `users.deleteDescription` | <bold>{{name}}</bold> will no longer be able to sign in. The account record and its audit history will be retained. | <bold>{{name}}</bold> ne pourra plus se connecter. Le compte et son historique d'audit seront conservés. |
| `users.employee` | Employee | Employé |
| `users.employeePlaceholder` | Choose the employee | Choisissez l’employé |
| `users.employeeHint` | Their name, email and usual role are filled in for you. | Son nom, son e-mail et son rôle habituel sont remplis pour vous. |
| `users.noEmployeesAvailable` | Every active employee already has an account. Add the employee in Personnel first. | Tous les employés actifs ont déjà un compte. Ajoutez d’abord l’employé dans Personnel. |
| `users.usernameHint` | First name + warehouse code. You can change it. | Prénom + code de l’entrepôt. Vous pouvez le modifier. |
| `users.issued.title` | Account created | Compte créé |
| `users.issued.description` | Give these to {{name}}. At first sign-in they will be asked to choose their own password. | Remettez ces informations à {{name}}. À la première connexion, il lui sera demandé de choisir son propre mot de passe. |
| `users.issued.password` | One-time password | Mot de passe à usage unique |
| `users.issued.onceOnly` | This password is shown only now. If it is lost, reset the password from the user’s page. | Ce mot de passe n’est affiché que maintenant. S’il est perdu, réinitialisez le mot de passe depuis la fiche de l’utilisateur. |
| `users.issued.copy` | Copy | Copier |
| `users.issued.copied` | Copied | Copié |
| `users.issued.done` | Done | Terminé |
| `users.invitationPending` | Invitation sent | Invitation envoyée |
| `users.resendInvitation` | Resend invitation | Renvoyer l’invitation |
| `users.invitationNotice` | The employee receives an email to confirm their address and choose their own password. Nobody else ever sees it. | L’employé reçoit un e-mail pour confirmer son adresse et choisir son propre mot de passe. Personne d’autre ne le voit. |
| `users.company` | Company | Entreprise |
| `users.allCompanies` | All companies | Toutes les entreprises |
| `users.platformAccount` | Platform | Plateforme |
| `users.permissionGranted` | granted | accordée |
| `users.permissionNotGranted` | not granted | non accordée |
| `users.permissionsSummary_one` | {{count}} permission across {{modules}} module(s) | {{count}} permission dans {{modules}} module(s) |
| `users.permissionsSummary_other` | {{count}} permissions across {{modules}} module(s) | {{count}} permissions dans {{modules}} module(s) |
| `users.viewAllPermissions` | View all permissions | Voir toutes les permissions |
| `users.temporaryPassword` | Temporary password | Mot de passe temporaire |
| `users.temporaryPasswordHint` | Optional. If the invitation email does not arrive: the person signs in with this password, then chooses a new one. | Facultatif. Si l'e-mail d'invitation n'arrive pas : la personne se connecte avec ce mot de passe, puis en choisit un nouveau. |
| `users.temporaryPasswordEditHint` | Optional. Replaces the current password; the person must choose a new one at their next sign-in. | Facultatif. Remplace le mot de passe actuel ; la personne devra en choisir un nouveau à sa prochaine connexion. |
| `users.temporaryPasswordInvalid` | The password does not meet the rules below. | Le mot de passe ne respecte pas les règles ci-dessous. |
| `users.temporaryPasswordNotice` | No email will be sent: give this password to the person. They must change it at their first sign-in. | Aucun e-mail ne sera envoyé : communiquez ce mot de passe à la personne. Elle devra le changer à sa première connexion. |

### C.13 `enterprises`

| Key | English | Français |
|---|---|---|
| `enterprises.title` | Enterprises & warehouses | Entreprises & entrepôts |
| `enterprises.description` | Every company on this server, and the warehouses each one runs. | Toutes les sociétés de ce serveur, et les entrepôts de chacune. |
| `enterprises.emptyTitle` | No enterprises found | Aucune entreprise trouvée |
| `enterprises.emptyDescription` | Companies returned by the server will appear here. | Les sociétés renvoyées par le serveur apparaîtront ici. |
| `enterprises.rowActions` | Enterprise actions | Actions sur l'entreprise |
| `enterprises.viewWarehouses` | View its warehouses | Voir ses entrepôts |
| `enterprises.warehousesHeading` | Warehouses | Entrepôts |
| `enterprises.warehousesFor` | Warehouses in {{name}} | Entrepôts de {{name}} |
| `enterprises.warehousesDescription` | Select an enterprise above to see the warehouses it operates. The warehouse is the unit everything underneath it is scoped to — the till, the stock and the staff. | Sélectionnez une entreprise ci-dessus pour voir les entrepôts qu'elle exploite. L'entrepôt est l'unité à laquelle tout ce qui se trouve en dessous est rattaché : la caisse, le stock et le personnel. |
| `enterprises.selectHint` | Select an enterprise above to see its warehouses. | Sélectionnez une entreprise ci-dessus pour voir ses entrepôts. |
| `enterprises.scopeNotice` | This session is signed in against a different company code, and the warehouse endpoint has no per-enterprise filter. Listing warehouses here could show another company's records, so the list is withheld. | Cette session est connectée avec un autre code société et le point d'accès des entrepôts n'offre pas de filtre par entreprise. Afficher la liste ici risquerait de montrer les données d'une autre société ; elle est donc masquée. |
| `enterprises.myTitle` | My enterprise | Mon entreprise |
| `enterprises.myDescription` | Your company's details, and the warehouses it operates. | Les informations de votre société et les entrepôts qu'elle exploite. |
| `enterprises.identityHeading` | Company details | Informations de la société |
| `enterprises.identityDescription` | These come from your company's own record on the server. Contact the system administrator to change the company name or plan. | Ces informations proviennent du dossier de votre société sur le serveur. Contactez l'administrateur système pour modifier le nom ou le forfait. |
| `enterprises.noOperationalAccess` | This company's access is currently suspended, so new records cannot be saved. Contact the system administrator. | L'accès de cette société est actuellement suspendu : aucun nouvel enregistrement ne peut être sauvegardé. Contactez l'administrateur système. |
| `enterprises.myWarehousesHeading` | Warehouses | Entrepôts |
| `enterprises.myWarehousesDescription` | A warehouse sets the scope of the till, the stock and the staff working in it. Add one for each site your company runs. | L'entrepôt détermine le périmètre de la caisse, du stock et du personnel qui y travaille. Ajoutez-en un pour chaque site exploité par votre société. |
| `enterprises.myWarehousesEmpty` | Add a warehouse, then record purchases, stock and till movements against it. | Ajoutez un entrepôt, puis enregistrez-y les achats, le stock et les mouvements de caisse. |
| `enterprises.contact.heading` | Contact details | Coordonnées |
| `enterprises.contact.description` | Printed on the letterhead of your receipts and payslips. | Imprimées en en-tête de vos reçus et bulletins de paie. |
| `enterprises.contact.edit` | Edit company details | Modifier les informations |
| `enterprises.contact.editTitle` | Company details | Informations de l'entreprise |
| `enterprises.contact.editDescription` | Your company's names and the contact details shown at the top of every document you print. Leave an optional field empty to leave it off. | Les noms de votre entreprise et les coordonnées affichées en haut de chaque document imprimé. Laissez un champ facultatif vide pour ne pas l'afficher. |
| `enterprises.contact.address` | Address | Adresse |
| `enterprises.contact.addressPlaceholder` | e.g. Douala, Bonabéri industrial zone | ex. Douala, zone industrielle de Bonabéri |
| `enterprises.contact.phone` | Phone | Téléphone |
| `enterprises.contact.email` | Email | E-mail |
| `enterprises.contact.emailInvalid` | Enter a valid email address. | Saisissez une adresse e-mail valide. |
| `enterprises.contact.displayName` | Company name | Nom de l'entreprise |
| `enterprises.contact.displayNameHint` | Shown in the app and on your documents. | Affiché dans l'application et sur vos documents. |
| `enterprises.contact.legalName` | Legal name | Raison sociale |
| `enterprises.contact.legalNameHint` | The registered name, if different. Optional. | Le nom enregistré, s'il est différent. Facultatif. |

### C.14 `retention`

| Key | English | Français |
|---|---|---|
| `retention.title` | Data retention | Conservation des données |
| `retention.description` | Deactivated records are deleted for good on the date shown, unless you keep them. | Les enregistrements désactivés sont supprimés définitivement à la date indiquée, sauf si vous les conservez. |
| `retention.record` | Record | Enregistrement |
| `retention.type` | Type | Type |
| `retention.deactivatedAt` | Deactivated | Désactivé le |
| `retention.purgeAt` | Deleted on | Suppression le |
| `retention.inDays_zero` | Today | Aujourd'hui |
| `retention.inDays_one` | In {{count}} day | Dans {{count}} jour |
| `retention.inDays_other` | In {{count}} days | Dans {{count}} jours |
| `retention.status` | Status | État |
| `retention.statuses.WATCHING` | Scheduled | Programmé |
| `retention.statuses.NOTIFIED` | Notified | Prévenu |
| `retention.statuses.CANCELLED` | Kept | Conservé |
| `retention.statuses.PURGED` | Deleted | Supprimé |
| `retention.types.UserAccount` | User account | Compte utilisateur |
| `retention.types.BusinessPartner` | Partner | Partenaire |
| `retention.types.Employee` | Employee | Employé |
| `retention.types.Warehouse` | Warehouse | Entrepôt |
| `retention.actions` | Actions | Actions |
| `retention.keep` | Keep | Conserver |
| `retention.keepTitle` | Keep this record? | Conserver cet enregistrement ? |
| `retention.keepDescription` | "{{label}}" will not be deleted. It stays deactivated. | « {{label}} » ne sera pas supprimé. Il reste désactivé. |
| `retention.purgeNow` | Delete now | Supprimer maintenant |
| `retention.purgeTitle` | Delete for good? | Supprimer définitivement ? |
| `retention.purgeDescription` | "{{label}}" will be erased right away. This cannot be undone. | « {{label}} » sera effacé tout de suite. Cette action est irréversible. |
| `retention.emptyTitle` | No deletions scheduled | Aucune suppression programmée |
| `retention.emptyDescription` | Deactivated records will show up here before they are deleted. | Les enregistrements désactivés apparaîtront ici avant d'être supprimés. |

### C.15 `audit`

| Key | English | Français |
|---|---|---|
| `audit.title` | Audit log | Journal d'audit |
| `audit.description` | A record of every important action taken in the system. | Un enregistrement de chaque action importante effectuée dans le système. |
| `audit.columnWhat` | What happened | Ce qui s'est passé |
| `audit.columnWho` | Who | Qui |
| `audit.columnWhen` | When | Quand |
| `audit.columnEventType` | Event type | Type d'événement |
| `audit.emptyTitle` | Nothing recorded yet | Rien d'enregistré pour le moment |
| `audit.emptyDescription` | Actions like price changes and permission changes will appear here. | Les actions comme les changements de prix et de permissions apparaîtront ici. |
| `audit.searchPlaceholder` | Search: action, user, record… | Rechercher : action, utilisateur, élément… |
| `audit.searchLabel` | Search the audit log | Rechercher dans le journal d’audit |
| `audit.clearSearch` | Clear the search | Effacer la recherche |
| `audit.noMatchTitle` | Nothing found | Aucun résultat |
| `audit.noMatchDescription` | No event matches “{{term}}”. Try a user name, an action such as PURCHASE, or a record id. | Aucun événement ne correspond à « {{term}} ». Essayez un nom d’utilisateur, une action comme PURCHASE, ou l’identifiant d’un élément. |

### C.16 `auth`

| Key | English | Français |
|---|---|---|
| `login.title` | Cocoa Management | Gestion Cacao |
| `login.subtitle` | Sign in to continue | Connectez-vous pour continuer |
| `login.username` | Username | Nom d'utilisateur |
| `login.password` | Password | Mot de passe |
| `login.signIn` | Sign in | Se connecter |
| `login.signingIn` | Signing in… | Connexion en cours… |
| `login.errorNetwork` | Cannot reach the server. Check the office network connection. | Impossible de joindre le serveur. Vérifiez la connexion réseau du bureau. |
| `login.errorUnauthorized` | Incorrect username or password. | Nom d'utilisateur ou mot de passe incorrect. |
| `login.errorGeneric` | Something went wrong. Please try again. | Une erreur s'est produite. Veuillez réessayer. |
| `login.errorDisabled` | This account has been deactivated by an administrator. Contact the system administrator to restore access. | Ce compte a été désactivé par un administrateur. Contactez l'administrateur système pour rétablir l'accès. |
| `login.errorForbidden` | This account is not allowed to sign in. Contact the system administrator. | Ce compte n'est pas autorisé à se connecter. Contactez l'administrateur système. |
| `login.errorNoEnterprise` | This account is not linked to a company yet. Contact the system administrator. | Ce compte n'est encore lié à aucune entreprise. Contactez l'administrateur système. |
| `login.errorNoWarehouse` | No warehouse is set up for this company yet. Contact the system administrator. | Aucun entrepôt n'est encore configuré pour cette entreprise. Contactez l'administrateur système. |
| `login.errorTenantSuspended` | Your company's access is suspended. Contact the system administrator. | L'accès de votre entreprise est suspendu. Contactez l'administrateur système. |
| `login.usernamePlaceholder` | e.g. john.doe | ex. jean.dupont |
| `changePassword.title` | Change password | Changer le mot de passe |
| `changePassword.description` | Choose a new password for your account. | Choisissez un nouveau mot de passe pour votre compte. |
| `changePassword.currentPassword` | Current password | Mot de passe actuel |
| `changePassword.newPassword` | New password | Nouveau mot de passe |
| `changePassword.confirmPassword` | Confirm new password | Confirmer le nouveau mot de passe |
| `changePassword.newPasswordHint` | Use at least 8 characters. | Utilisez au moins 8 caractères. |
| `changePassword.mismatchError` | The two new passwords don't match. | Les deux nouveaux mots de passe ne correspondent pas. |
| `changePassword.requirementsLabel` | Your new password must have: | Votre nouveau mot de passe doit contenir : |
| `changePassword.submit` | Update password | Mettre à jour le mot de passe |
| `changePassword.submitting` | Updating… | Mise à jour… |
| `changePassword.successTitle` | Password updated | Mot de passe mis à jour |
| `changePassword.successDescription` | You'll use your new password next time you sign in. | Vous utiliserez votre nouveau mot de passe à la prochaine connexion. |
| `changePassword.mustChangeNotice` | Your account was created with a one-time password. Choose your own password to continue. | Votre compte a été créé avec un mot de passe à usage unique. Choisissez votre propre mot de passe pour continuer. |
| `password.rules.minLength` | At least 8 characters | Au moins 8 caractères |
| `password.rules.uppercase` | One uppercase letter | Une lettre majuscule |
| `password.rules.special` | One special character (such as ! or @) | Un caractère spécial (tel que ! ou @) |
| `password.rules.met` | met | remplie |
| `password.rules.unmet` | not met | non remplie |
| `password.hide` | Hide password | Masquer le mot de passe |
| `password.show` | Show password | Afficher le mot de passe |
| `sessionExpired.title` | Your session has ended | Votre session a pris fin |
| `sessionExpired.description` | For your security, you've been signed out. Sign in again to continue. | Pour votre sécurité, vous avez été déconnecté. Reconnectez-vous pour continuer. |
| `sessionExpired.signInAgain` | Sign in again | Se reconnecter |
| `forbidden.title` | You don't have access to this page | Vous n'avez pas accès à cette page |
| `forbidden.description` | This page is only available to certain roles. If you think this is a mistake, ask the Boss. | Cette page n'est disponible que pour certains rôles. Si vous pensez qu'il s'agit d'une erreur, contactez le Patron. |
| `forbidden.backToDashboard` | Back to dashboard | Retour au tableau de bord |
| `notFound.title` | Page not found | Page introuvable |
| `notFound.description` | The page you requested could not be found. | La page demandée est introuvable. |
| `notFound.backHome` | Go to home | Aller à l'accueil |
| `errors.unexpectedTitle` | Something went wrong | Une erreur s'est produite |
| `errors.unexpectedDescription` | An unexpected error occurred. Please return to the dashboard and try again. | Une erreur inattendue s'est produite. Retournez au tableau de bord et réessayez. |
| `errors.code` | Error {{status}} | Erreur {{status}} |
| `errors.goBack` | Previous page | Page précédente |
| `invite.eyebrow` | Invitation | Invitation |
| `invite.title` | Set up your {{company}} account | Configurez votre compte {{company}} |
| `invite.intro` | Choose the password you will sign in with. This also confirms that this email address is yours. | Choisissez le mot de passe avec lequel vous vous connecterez. Cela confirme aussi que cette adresse e-mail est bien la vôtre. |
| `invite.name` | Name | Nom |
| `invite.username` | Username | Nom d’utilisateur |
| `invite.email` | Email | E-mail |
| `invite.password` | Choose a password | Choisissez un mot de passe |
| `invite.confirm` | Type it again | Saisissez-le à nouveau |
| `invite.mismatch` | The two passwords are different. | Les deux mots de passe sont différents. |
| `invite.submit` | Save my password | Enregistrer mon mot de passe |
| `invite.expires` | This link works once and expires on {{date}}. | Ce lien ne sert qu’une fois et expire le {{date}}. |
| `invite.doneTitle` | Your account is ready | Votre compte est prêt |
| `invite.doneText` | Sign in with your username {{username}} and the password you just chose. | Connectez-vous avec votre nom d’utilisateur {{username}} et le mot de passe que vous venez de choisir. |
| `invite.signIn` | Sign in | Se connecter |
| `invite.expiredTitle` | This link no longer works | Ce lien ne fonctionne plus |
| `invite.expiredText` | It was already used, a newer invitation replaced it, or it expired. Ask the person who created your account to send the invitation again. | Il a déjà été utilisé, une invitation plus récente l’a remplacé, ou il a expiré. Demandez à la personne qui a créé votre compte de renvoyer l’invitation. |
| `invite.toLogin` | Go to sign in | Aller à la connexion |

### C.17 `validation`

| Key | English | Français |
|---|---|---|
| `validation.required` | This field is required. | Ce champ est obligatoire. |
| `validation.nameTooShort_one` | Enter at least {{count}} character. | Saisissez au moins {{count}} caractère. |
| `validation.nameTooShort_other` | Enter at least {{count}} characters. | Saisissez au moins {{count}} caractères. |
| `validation.emailInvalid` | Enter a valid email address, e.g. name@example.com. | Saisissez une adresse e-mail valide, par ex. nom@exemple.com. |
| `validation.phoneInvalid` | Enter a 9-digit Cameroonian number starting with 6 or 2, e.g. 677 099 845. | Saisissez un numéro camerounais de 9 chiffres commençant par 6 ou 2, par ex. 677 099 845. |
| `validation.idCardInvalid` | Enter a valid ID card number: 9 digits (2016 card) or A + a letter or digit + 8 digits (new card), e.g. AB12345678. | Saisissez un numéro de CNI valide : 9 chiffres (carte 2016) ou A + une lettre ou un chiffre + 8 chiffres (nouvelle carte), par ex. AB12345678. |
| `validation.emailPlaceholder` | e.g. name@example.com | ex. nom@exemple.com |

### C.18 `analysis`

| Key | English | Français |
|---|---|---|
| `analysis.title` | Business analysis | Analyse de l’activité |
| `analysis.description` | Your figures, and a written analysis of them by the AI. | Vos chiffres, et leur analyse rédigée par l’IA. |
| `analysis.period` | Period | Période |
| `analysis.lastDays_one` | Last {{count}} day | {{count}} dernier jour |
| `analysis.lastDays_other` | Last {{count}} days | {{count}} derniers jours |
| `analysis.periodRange` | From {{from}} to {{to}}, compared with the same number of days before. | Du {{from}} au {{to}}, comparé au même nombre de jours précédents. |
| `analysis.figures.bought` | Cocoa bought | Cacao acheté |
| `analysis.figures.vsPrevious` | {{change}} vs. the previous period | {{change}} par rapport à la période précédente |
| `analysis.figures.purchaseCount_one` | {{count}} purchase | {{count}} achat |
| `analysis.figures.purchaseCount_other` | {{count}} purchases | {{count}} achats |
| `analysis.figures.spent` | Spent on cocoa | Dépensé en cacao |
| `analysis.figures.averagePrice` | Average {{price}} per kg | En moyenne {{price}} le kg |
| `analysis.figures.stock` | Stock on hand | Stock disponible |
| `analysis.figures.stockFlow` | In {{received}} · out {{issued}} | Entrées {{received}} · sorties {{issued}} |
| `analysis.figures.price` | Current price per kg | Prix actuel au kg |
| `analysis.figures.priceChanges_one` | {{count}} change in the period | {{count}} changement sur la période |
| `analysis.figures.priceChanges_other` | {{count}} changes in the period | {{count}} changements sur la période |
| `analysis.figures.owedSuppliers` | Owed to suppliers | Dû aux fournisseurs |
| `analysis.figures.overdue_one` | {{count}} overdue · {{amount}} | {{count}} en retard · {{amount}} |
| `analysis.figures.overdue_other` | {{count}} overdue · {{amount}} | {{count}} en retard · {{amount}} |
| `analysis.figures.openPayables_one` | {{count}} unpaid purchase | {{count}} achat non soldé |
| `analysis.figures.openPayables_other` | {{count}} unpaid purchases | {{count}} achats non soldés |
| `analysis.figures.prefinance` | Prefinance not yet covered | Préfinancement non couvert |
| `analysis.figures.openPrefinance_one` | {{count}} open prefinance | {{count}} préfinancement ouvert |
| `analysis.figures.openPrefinance_other` | {{count}} open prefinances | {{count}} préfinancements ouverts |
| `analysis.figures.till` | Till difference | Écart de caisse |
| `analysis.figures.shortfalls_one` | {{count}} shortfall · largest {{largest}} | {{count}} manquant · le plus gros {{largest}} |
| `analysis.figures.shortfalls_other` | {{count}} shortfalls · largest {{largest}} | {{count}} manquants · le plus gros {{largest}} |
| `analysis.figures.tillsClosed_one` | {{count}} till closed, no shortfall | {{count}} caisse clôturée, sans manquant |
| `analysis.figures.tillsClosed_other` | {{count}} tills closed, no shortfall | {{count}} caisses clôturées, sans manquant |
| `analysis.figures.salaries` | Salaries owed | Salaires dus |
| `analysis.figures.employees_one` | {{count}} active employee | {{count}} employé actif |
| `analysis.figures.employees_other` | {{count}} active employees | {{count}} employés actifs |
| `analysis.topSuppliers` | Who you bought the most from | Vos plus gros fournisseurs |
| `analysis.noPurchases` | No purchases in this period. | Aucun achat sur cette période. |
| `analysis.prefinanceExposure` | Largest prefinance not yet covered | Plus gros préfinancements non couverts |
| `analysis.noPrefinance` | No open prefinance. | Aucun préfinancement ouvert. |
| `analysis.report.title` | AI analysis | Analyse de l’IA |
| `analysis.report.write` | Write the analysis | Rédiger l’analyse |
| `analysis.report.refresh` | Write a new analysis | Rédiger une nouvelle analyse |
| `analysis.report.writing` | The AI is reading your figures and writing. This can take a minute or two… | L’IA lit vos chiffres et rédige. Cela peut prendre une à deux minutes… |
| `analysis.report.emptyTitle` | No analysis yet | Pas encore d’analyse |
| `analysis.report.emptyDescription` | Click the ✨ button at the bottom right and the AI will explain the figures above: what went well, what to watch, what to do. | Cliquez sur le bouton ✨ en bas à droite et l’IA expliquera les chiffres ci-dessus : ce qui va bien, ce qu’il faut surveiller, ce qu’il faut faire. |
| `analysis.report.meta` | Written by {{model}} on {{date}}, about {{from}} to {{to}}. | Rédigée par {{model}} le {{date}}, sur la période du {{from}} au {{to}}. |
| `analysis.report.disclaimer` | Written by an AI from the figures of that day. Check any number against the figures above before acting on it. | Rédigée par une IA à partir des chiffres de ce jour-là. Vérifiez tout chiffre avec ceux ci-dessus avant d’agir. |
| `analysis.report.fabTooltip_one` | The AI reads the figures of the last {{count}} day and writes what went well, what to watch and what to do. Takes a minute or two. | L’IA lit les chiffres du dernier jour et rédige ce qui va bien, ce qu’il faut surveiller et ce qu’il faut faire. Compter une à deux minutes. |
| `analysis.report.fabTooltip_other` | The AI reads the figures of the last {{count}} days and writes what went well, what to watch and what to do. Takes a minute or two. | L’IA lit les chiffres des {{count}} derniers jours et rédige ce qui va bien, ce qu’il faut surveiller et ce qu’il faut faire. Compter une à deux minutes. |
| `ai.suggestNote` | Suggest | Suggérer |
| `ai.suggesting` | Writing… | Rédaction… |
| `ai.suggestNoteHint` | Let the AI propose a short note from this form. You can edit it before saving. | L’IA propose une courte note à partir de ce formulaire. Vous pouvez la modifier avant d’enregistrer. |

### C.19 `dashboard`

| Key | English | Français |
|---|---|---|
| `dashboard.welcome` | Welcome, {{name}} | Bienvenue, {{name}} |
| `dashboard.roleSummary` | Access based on: {{roles}} | Accès selon : {{roles}} |
| `dashboard.operationalOverview` | Operational overview | Vue opérationnelle |
| `dashboard.currentPrice` | Current cocoa price | Prix actuel du cacao |
| `dashboard.stockOnHand` | Stock on hand | Stock disponible |
| `dashboard.openCashSessions` | Open cash sessions | Sessions de caisse ouvertes |
| `dashboard.purchaseRecords` | Purchase records | Achats enregistrés |
| `dashboard.employeeRecords` | Employee records | Employés enregistrés |
| `dashboard.purchases` | Purchases | Achats |
| `dashboard.prefinances` | Buyer prefinances | Préfinancements acheteurs |
| `dashboard.deliveries` | Deliveries | Livraisons |
| `dashboard.salaryDue` | Salary due | Salaires dus |
| `dashboard.auditEvents` | Audit activity | Activité d'audit |
| `dashboard.purchaseDate` | Date | Date |
| `dashboard.partner` | Partner ID | ID du partenaire |
| `dashboard.weight` | Net weight | Poids net |
| `dashboard.amount` | Amount | Montant |
| `dashboard.status` | Status | Statut |
| `dashboard.outstanding` | Outstanding | Solde dû |
| `dashboard.vehicle` | Vehicle | Véhicule |
| `dashboard.destination` | Destination | Destination |
| `dashboard.employee` | Employee | Employé |
| `dashboard.companyCode` | Company code | Code entreprise |
| `dashboard.company` | Enterprise | Entreprise |
| `dashboard.action` | Action | Action |
| `dashboard.actor` | Actor | Auteur |
| `dashboard.date` | Date | Date |
| `dashboard.openRegister` | Open purchase register | Ouvrir le registre des achats |
| `dashboard.openBuyers` | Open buyers | Ouvrir les acheteurs |
| `dashboard.openLogistics` | Open logistics | Ouvrir la logistique |
| `dashboard.openPayroll` | Open payroll | Ouvrir la paie |
| `dashboard.openAudit` | Open audit log | Ouvrir le journal d'audit |
| `dashboard.noEnterprises` | No enterprises found | Aucune entreprise trouvée |
| `dashboard.noEnterprisesDescription` | Create an enterprise to onboard a client. | Créez une entreprise pour ajouter un client. |
| `dashboard.noWarehouses` | No warehouses found | Aucun entrepôt trouvé |
| `dashboard.noWarehousesDescription` | Create a warehouse for this enterprise. | Créez un entrepôt pour cette entreprise. |
| `dashboard.client.noAccessTitle` | No operational data for your role | Aucune donnée opérationnelle pour votre rôle |
| `dashboard.client.noAccessDescription` | Your account has no read access to purchases, stock, cash or prefinancing. Ask an administrator if you expected to see figures here. | Votre compte n'a pas d'accès en lecture aux achats, au stock, à la caisse ni aux préfinancements. Contactez un administrateur si vous attendiez des chiffres ici. |
| `dashboard.client.purchaseTrend` | Purchase value by day | Valeur des achats par jour |
| `dashboard.client.cocoaPriceHistory` | Cocoa price history | Historique du prix du cacao |
| `dashboard.client.logisticsStatus` | Deliveries by status | Livraisons par statut |
| `dashboard.client.buyerBalances` | Buyer prefinance balances | Soldes de préfinancement des acheteurs |
| `dashboard.client.stockOnHand` | Stock on hand | Stock disponible |
| `dashboard.client.purchasesWaitingOnPayment` | Purchases waiting on payment | Achats en attente de paiement |
| `dashboard.client.needsAttention` | Needs your attention | Nécessite votre attention |
| `dashboard.client.allSettled` | All settled | Tout est réglé |
| `dashboard.client.todaysPurchases` | Today's purchases | Achats d'aujourd'hui |
| `dashboard.client.buyersStillOwing` | Buyers still owing | Acheteurs qui doivent encore |
| `dashboard.client.recentPurchases` | Recent purchases | Achats récents |
| `dashboard.client.noRecentPurchases` | No purchases recorded yet. | Aucun achat enregistré pour le moment. |
| `dashboard.client.buyerPrefinance` | Buyer prefinance | Préfinancement des acheteurs |
| `dashboard.client.noBuyers` | No prefinances recorded yet. | Aucun préfinancement enregistré pour le moment. |
| `dashboard.client.advanced` | Advanced {{amount}} | Avancé {{amount}} |
| `dashboard.client.recentMovements` | Recent stock movements | Mouvements de stock récents |
| `dashboard.client.noMovements` | No stock movements recorded yet. | Aucun mouvement de stock enregistré pour le moment. |
| `dashboard.client.movement.RECEIPT` | Receipt | Entrée |
| `dashboard.client.movement.ISSUE` | Issue | Sortie |
| `dashboard.client.movement.ADJUSTMENT` | Adjustment | Ajustement |
| `dashboard.client.buyersInDebt_one` | {{count}} buyer, over all cash sessions | {{count}} acheteur, toutes caisses confondues |
| `dashboard.client.buyersInDebt_other` | {{count}} buyers, over all cash sessions | {{count}} acheteurs, toutes caisses confondues |
| `dashboard.client.companyOwesBuyers` | Owed to buyers | Dû aux acheteurs |
| `dashboard.client.companyOwesBuyersHint` | Cocoa delivered, not yet paid | Cacao livré, pas encore payé |
| `dashboard.greetingBoss` | Here's how the business is doing. | Voici comment se porte l'entreprise. |
| `dashboard.greetingFinSec` | Here's what needs attention today. | Voici ce qui demande votre attention aujourd'hui. |
| `dashboard.greetingCashier` | Ready to record purchases and payments. | Prêt à enregistrer des achats et des paiements. |
| `dashboard.cashier.recordAPurchase` | Record a purchase | Enregistrer un achat |
| `dashboard.cashier.recordAPurchaseHint` | Enter a farmer's cocoa delivery | Saisir une livraison de cacao d'un producteur |
| `dashboard.cashier.recordAPayment` | Record a payment | Enregistrer un paiement |
| `dashboard.cashier.recordAPaymentHint` | Pay a farmer for a purchase | Payer un producteur pour un achat |
| `dashboard.cashier.sessionSoFar` | Today's session so far | Session d'aujourd'hui jusqu'à présent |
| `dashboard.cashier.purchasesRecordedToday` | {{count}} purchases recorded today | {{count}} achats enregistrés aujourd'hui |
| `dashboard.cashier.purchaseActivity` | Purchase activity | Activité des achats |
| `dashboard.quickActions.goToTill` | Go to the till | Aller à la caisse |
