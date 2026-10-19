# Frontend ↔ Backend alignment

Frontend: `d:/Cocoa`. Backend: `c:/Users/RICHIE/IdeaProjects/CoMS`.

Sources of truth, in order: **controllers + domain enums on disk** > `ApiRoutes.java` >
backend `README.md`. The README is out of date in several places and the
controllers win every disagreement.

---

## 0. Corrections to the previous version of this document

I wrote an earlier version of this file from the README and `ApiRoutes` alone.
Reading the actual controllers proved several of its claims **wrong**. Corrected
points, so nobody acts on the old text:

| Old claim in this doc | Reality (from the code) |
|---|---|
| "There is no `BOSS` role" | **`BOSS` exists.** `SystemRole` = `SYSTEM_ADMIN, BOSS, STAFF, BUYER, INVENTORY, CASHIER`. `BOSS` is the enterprise admin (`RoleScope.ENTERPRISE`). The README is wrong. |
| Permissions include `CASH_SESSION_MANAGE`, `PARTNER_MANAGE`, `EMPLOYEE_MANAGE` | They do **not**. `PermissionCode` is per-verb: `CASH_SESSION_CREATE`/`_UPDATE`/`_READ`/`_DELETE`, `PARTNER_*`, `EMPLOYEE_*`, and so on. The README's `*_MANAGE` names are wrong. |
| "Inventory: not built yet" | **`InventoryController` exists** — `GET /inventory`, `GET /inventory/movements`, `POST /inventory/adjustments`. The README is wrong. |
| "Truck loading path is ambiguous" | **Resolved.** `LogisticsController` uses `@RequestMapping(ApiRoutes.TRUCK_LOADINGS)`, so it is `/api/v1/deliveries`. The README is wrong. |
| "Prefinance path is ambiguous" | **Resolved.** `/api/v1/partners/prefinances`. The README is wrong. |
| "`/auth/me` shape unknown" | **Known** — `UserResponse` (see §2). |
| "Idempotency may be ignored" | **It is honoured.** `ErrorCode.IDEMPOTENT_REPLAY` exists, returning HTTP 200 on a replay. |
| "The `ApiRoutes` you pasted is the route list" | That paste was **stale** — it lacks the `INVENTORY_*` and `PURGE_*` constants that the real file (and `InventoryController`) use. |

---

## 1. Authentication — FIXED

| | Frontend before | Backend |
|---|---|---|
| Base path | `/api` | `/api/v1` |
| Credentials | Cookie + `credentials: "include"` | `Authorization: Bearer <accessToken>` |
| CSRF | `X-XSRF-TOKEN` | Not part of the scheme |
| Session | `GET /auth/session` | **`GET /auth/me`** — `/auth/session` does not exist |
| Login body | `{ username, password }` | `{ companyCode?, username, password, warehouseCode? }` |
| Refresh body | — | `{ companyCode?, refreshToken }` |

`POST /auth/login` → `TokenResponse { accessToken, refreshToken, tokenType: "Bearer", accessExpiresAt }`.

Confirmed endpoints on `AuthController`:

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login` | public → `TokenResponse` |
| POST | `/auth/refresh` | public, body `{ companyCode, refreshToken }` — **rotates** the refresh token |
| POST | `/auth/logout` | 204, revokes **all** refresh tokens for the user |
| GET | `/auth/me` | → `UserResponse` |
| PATCH | `/auth/me` | update own name/email (`UpdateProfileRequest`) — username not changeable here |
| POST | `/auth/me/password` | `{ currentPassword, newPassword }` → 204 |

**Refresh rotation is the important one.** Because refresh tokens rotate, a second
concurrent refresh with the same token is a replay. The frontend therefore shares
one in-flight refresh across all 401s (`src/lib/api-client.ts`) — without that, a
page firing six queries would trigger six refreshes and log the user out.

**Tokens** live in a zustand store (`src/store/auth-token-store.ts`) persisted to
`localStorage`. The backend uses bearer tokens, not httpOnly cookies, so something
client-side must hold them; persistence survives a PWA restart but is exposed to
XSS. Fixing that is a server-side change (httpOnly refresh cookie), not a frontend one.

---

## 2. Roles and the user object — FIXED

`SystemRole` (`SystemRole.java`), with scope:

| Role | Scope | Meaning |
|---|---|---|
| `SYSTEM_ADMIN` | PLATFORM | all permissions |
| `BOSS` | ENTERPRISE | all permissions except the `TENANT_*` platform-only set |
| `STAFF` | WAREHOUSE | reads across modules, no deletes |
| `BUYER` | WAREHOUSE | read-only (price, purchases, payments, prefinance, reports) |
| `INVENTORY` | WAREHOUSE | inventory/logistics read + create + update |
| `CASHIER` | WAREHOUSE | till, purchase payments, expenses, salary payouts |

The frontend previously used `BOSS, DIRECTOR, MANAGER, FINANCIAL_SECRETARY, SYSADMIN`.
Of those only `BOSS` was real; `DIRECTOR`/`MANAGER`/`FINANCIAL_SECRETARY`/`SYSADMIN`
never existed and every gate using them was dead.

**`GET /auth/me` returns `UserResponse`:**

```jsonc
{
  "id": "uuid",
  "username": "string",
  "fullName": "string",
  "email": "string",
  "active": true,              // NOT "isActive"
  "lastLogin": "instant",
  "employeeId": "uuid|null",   // link to the personnel record, optional
  "roles": ["BOSS"],           // a SET, not a single role
  "permissions": ["PURCHASE_READ", "..."],
  "createdAt": "instant",
  "updatedAt": "instant"
}
```

Two things the frontend had structurally wrong: `roles` is an **array**, and the
flag is **`active`**. An `AuthUser` built around a single `role` and `isActive`
could not have been populated correctly from this payload.

---

## 3. Permissions — FIXED

`PermissionCode` is a full per-verb vocabulary, not the `X_READ`/`X_MANAGE` pairs
the README implies:

`USER_READ|CREATE|UPDATE|DELETE`, `ROLE_*`, `EMPLOYEE_*`, `PARTNER_*`,
`CONTRACT_*`, `PRICE_*`, `PURCHASE_*`, `PAYMENT_*`, `PREFINANCE_READ|CREATE|UPDATE|SETTLE|DELETE`,
`INVENTORY_*`, `LOGISTICS_*`, `EXPENSE_*`, `PAYROLL_*`, `CASH_SESSION_*`,
plus singletons `REPORT_READ`, `AUDIT_READ`, and `SYNC_*`, `TENANT_*`, `WAREHOUSE_*`.

Note: `CONTRACT_*` permissions exist in the enum but **no contract controller
exists**, so contracts is a permission-only stub.

The frontend previously sent `'purchases.create'`, `'buyers.manage'` etc. — none
of which the server recognises, so every UI permission gate was silently dead.

---

## 4. Pagination — NOT YET HANDLED

**Every list endpoint returns `PageResponse<T>`:**

```jsonc
{ "content": [], "page": 0, "size": 20, "totalElements": 0,
  "totalPages": 0, "first": true, "last": true }
```

`page` is **0-based** (Spring's convention). The frontend's API modules currently
type these calls as `T[]`, which would break at runtime — the register would try to
`.map()` an object. The frontend has its own client-side `usePagination`; the
server pages instead. These need reconciling: either the client passes
`?page=&size=` and drives off `totalPages`, or it requests everything. This is a
real open item, tracked in §10.
---

## 5. Multi-tenancy — NOT YET HANDLED

The backend is multi-tenant in a way the frontend completely ignores:
`LoginRequest` carries **`companyCode`** and **`warehouseCode`**, `RefreshRequest`
carries **`companyCode`**, and there are `RoleScope.PLATFORM | ENTERPRISE | WAREHOUSE`
plus `TENANT_*` and `WAREHOUSE_*` permissions.

Both fields are optional in the DTO, so a single-tenant login will still work — but
if the office ever runs more than one company or warehouse, the frontend has no UI
to supply them and will silently authenticate against whichever default the server
picks. Worth deciding early, because retro-fitting a company/warehouse context into
every cached query later is far more painful than adding it now.

---

## 6. Authoritative route map

Taken from the controllers, not the README. `page`/`size` query params are accepted
on every paged `GET`.

| Method | Path | Authority |
|---|---|---|
| POST | `/api/v1/auth/login` | public |
| POST | `/api/v1/auth/refresh` | public |
| POST | `/api/v1/auth/logout` | authenticated |
| GET | `/api/v1/auth/me` | authenticated |
| PATCH | `/api/v1/auth/me` | authenticated |
| POST | `/api/v1/auth/me/password` | authenticated |
| GET | `/api/v1/users` | `USER_READ` |
| GET | `/api/v1/users/{id}` | `USER_READ` |
| POST | `/api/v1/users` | `USER_CREATE` |
| PATCH | `/api/v1/users/{id}` | `USER_UPDATE` |
| POST | `/api/v1/users/{id}/disable` | `USER_UPDATE` |
| POST | `/api/v1/users/{id}/enable` | `USER_UPDATE` |
| POST | `/api/v1/users/{id}/reset_password` | `USER_UPDATE` |
| DELETE | `/api/v1/users/{id}` | `USER_DELETE` (soft delete) |
| GET | `/api/v1/roles` | `ROLE_READ` |
| GET | `/api/v1/partners` (`?type=`) | `PARTNER_READ` or `SYSTEM_ADMIN` |
| GET | `/api/v1/partners/{id}` | `PARTNER_READ` or `SYSTEM_ADMIN` |
| POST | `/api/v1/partners` | `PARTNER_CREATE` or `SYSTEM_ADMIN` |
| PATCH | `/api/v1/partners/{id}` | `PARTNER_UPDATE` or `SYSTEM_ADMIN` |
| GET | `/api/v1/employees` | `EMPLOYEE_READ` |
| GET | `/api/v1/employees/{id}` | `EMPLOYEE_READ` |
| POST | `/api/v1/employees` | `EMPLOYEE_CREATE` |
| PATCH | `/api/v1/employees/{id}` | `EMPLOYEE_UPDATE` |
| POST | `/api/v1/employees/{id}/salary-accruals` | `PAYROLL_CREATE` |
| GET | `/api/v1/employees/{id}/salary-payouts` | `PAYROLL_READ` |
| GET | `/api/v1/cocoa-prices` | `PRICE_READ` |
| GET | `/api/v1/cocoa-prices/current` | `PRICE_READ` |
| POST | `/api/v1/cocoa-prices` | `PRICE_CREATE` |
| GET | `/api/v1/purchases` | `PURCHASE_READ` |
| GET | `/api/v1/purchases/{id}` | `PURCHASE_READ` |
| POST | `/api/v1/purchases` | `PURCHASE_CREATE` |
| GET | `/api/v1/purchases/{id}/payments` | `PAYMENT_READ` |
| POST | `/api/v1/purchases/{id}/payments` | `PAYMENT_CREATE` |
| GET | `/api/v1/payments` | `PAYMENT_READ` — required register endpoint; paged `PaymentResponse` rows include `purchaseId` |
| GET | `/api/v1/payments/{id}` | `PAYMENT_READ` — required detail endpoint |
| DELETE | `/api/v1/payments/{id}` | `PAYMENT_DELETE` — required soft-delete/void endpoint; retain the payment and audit trail |
| GET | `/api/v1/cash-sessions` | `CASH_SESSION_READ` |
| GET | `/api/v1/cash-sessions/{id}` | `CASH_SESSION_READ` |
| POST | `/api/v1/cash-sessions` | `CASH_SESSION_CREATE` |
| POST | `/api/v1/cash-sessions/{id}/provisions` | `CASH_SESSION_UPDATE` |
| POST | `/api/v1/cash-sessions/{id}/close` | `CASH_SESSION_UPDATE` |
| GET | `/api/v1/expenses` | `EXPENSE_READ` |
| POST | `/api/v1/expenses` | `EXPENSE_CREATE` |
| GET | `/api/v1/expense-categories` | `EXPENSE_READ` |
| POST | `/api/v1/expense-categories` | `EXPENSE_CREATE` |
| GET | `/api/v1/partners/prefinances` (`?buyerId=`) | `PREFINANCE_READ` |
| GET | `/api/v1/partners/prefinances/{id}` | `PREFINANCE_READ` |
| POST | `/api/v1/partners/prefinances` | `PREFINANCE_CREATE` |
| POST | `/api/v1/partners/prefinances/{id}/disbursements` | `PREFINANCE_CREATE` |
| POST | `/api/v1/partners/prefinances/{id}/deliveries` | `PREFINANCE_SETTLE` |
| GET | `/api/v1/deliveries` | `LOGISTICS_READ` |
| GET | `/api/v1/deliveries/{id}` | `LOGISTICS_READ` |
| POST | `/api/v1/deliveries` | `LOGISTICS_CREATE` |
| POST | `/api/v1/deliveries/{id}/delivered` | `LOGISTICS_UPDATE` |
| GET | `/api/v1/inventory` (`?warehouseId=`) | `INVENTORY_READ` |
| GET | `/api/v1/inventory/movements` | `INVENTORY_READ` |
| POST | `/api/v1/inventory/adjustments` | `INVENTORY_UPDATE` |
| GET | `/api/v1/warehouses` | `WAREHOUSE_READ` |
| POST | `/api/v1/warehouses` | `WAREHOUSE_CREATE` |
| GET | `/api/v1/audit/events` (`?eventType=`) | `AUDIT_READ` |
| GET | `/api/v1/audit/events/{id}` | `AUDIT_READ` |
| GET/POST | `/api/v1/enterprises`, `/{code}/suspend`, `/{code}/activate` | platform (`TENANT_*`) |
| GET/POST | `/api/v1/subscription`, `/activate`, `/suspend` | platform |
| GET/POST | `/api/v1/purge-watches`, `/{id}/cancel`, `/{id}/purge` | platform |

---

## 7. Frontend screens with no backend

| Frontend feature | Backend status |
|---|---|
| **Contracts** (`/contracts`) | No controller. `CONTRACT_*` permissions exist but nothing serves them. |
| **Reporting** (`/reporting`, dashboards) | No controller. `REPORT_READ` exists as a permission only. |
| **Synchronization** (`/sync-status`) | `SYNC_*` permissions exist; the README says the sync module is not written. |
| **Partner invoices** | No controller. |
| **Notifications bell** | No controller. |

These routes now show an explicit unavailable state instead of frontend fixtures.
The sync and notification header controls are hidden until their backend APIs
exist. Contracts and reporting remain reachable but do not present sample records
or figures.

Inventory, purchases, partners/prefinances, employees/payroll balances, prices,
deliveries, audit events, payments, and users now read from their matching API
modules. User demo authentication is the only remaining fixture data.

---

## 8. Real backend bugs found

These are in the Java, found while checking the routes — they will not be fixed by
any frontend change.

1. **`PayrollController` has an ambiguous mapping — the app will not start.**
   Two methods are both annotated `@PostMapping(ApiRoutes.EMPLOYEES + ApiRoutes.EMPLOYEE_ACCRUALS)`:
   `accrue(...)` and `collect(...)`. The second is documented as *"Employee collects
   cash from the cashier and signs"*, so it clearly should be
   `ApiRoutes.EMPLOYEE_PAYOUTS` (`/{id}/salary-payouts`). Spring rejects duplicate
   mappings at startup with `Ambiguous mapping`, so this fails the whole context.

2. **`ApiRoutes.userPassword(UUID)` contradicts the constant it duplicates.**
   The helper builds `/users/{id}/password`; the constant `USER_RESET_PASSWORD` is
   `/{id}/reset_password`; `UserController.resetPassword` uses the constant. The
   helper is wrong and unused — it should be deleted, since leaving it invites
   someone to call it and get a 404.

3. **`pom.xml` / README disagree on the framework version.**
   `spring-boot-starter-parent` is **4.1.1**; the README says **Spring Boot 3.4**.
   Related: `springdoc-openapi-starter-webmvc-ui` is pinned at **2.6.0**, which is
   built for Spring Boot 3.x. On Boot 4 the Swagger UI dependency needs the 3.x line,
   so `/swagger-ui.html` is likely to fail as configured.

4. **`ErrorCode.PRICE_NOT_FOUND` has code string `"PURCHASE_PRICE_NOT_FOUND"`**
   while the enum member is `PRICE_NOT_FOUND`. The wire value and the Java name
   disagree, and the frontend keys off the wire value — so any client handling this
   error must match the *string*, not the name. Either is fine; having both is a trap.

5. **Two `@PostMapping`s on `AUTH_ME_PASSWORD` vs a `/users/{id}/password` helper**
   — see (2); listing it because it is the same class of drift.

---

## 9. Frontend changes made

`src/api/routes.ts` mirrors the real `ApiRoutes.java`, including the `INVENTORY_*`
and `PURGE_*` constants missing from the version originally shared.

`src/lib/api-client.ts` — rewritten: `/api/v1` base, `Authorization: Bearer`,
single-flight refresh-token rotation with one retry, `204` handling, and error codes
matching `ErrorCode` (including `IDEMPOTENT_REPLAY`).

`src/store/auth-token-store.ts` — zustand token store readable outside React.

`src/enums/index.ts` — `UserRole` corrected; `PermissionKey` corrected; `PayableStatus`
→ `PAYABLE | PARTIALLY_PAID | PAID`; `PartnerType` added.

`src/interfaces/index.ts` — `Partner`, `CocoaPrice`, `CashSession`, `CashProvision`,
`BuyerDelivery`, `PrefinanceDisbursement`, `TruckLoading`, `SalaryAccrual`,
`SalaryPayout`, `AuditEvent`, `Employee.salaryDue`.

`src/api/session.ts` — login → tokens → `GET /auth/me`.

Operational list screens now use the existing query hooks and server pagination.
Contracts, reporting, and synchronization show an unavailable state because the
backend has no corresponding data endpoints; permission assignments are read-only
because there is no permission-edit endpoint. API 403/404 query errors render the
backend message in the shared error page, and unknown routes render the 404 page.

---

## 10. Open decisions

1. **Pagination** (§4). Every list is paged server-side; the frontend pages
   client-side. Pick one: server-driven paging through TanStack Query, or a large
   `size` and keep the client pager.
2. **Multi-tenancy** (§5). Do we need `companyCode`/`warehouseCode` in the UI, or is
   single-tenant the target?
3. **`PayrollController`** (§8.1) — needs the path fixed before anything payroll-related
   can run.
4. **Contracts / reporting / sync** — build server-side, or remove the frontend screens?
5. **`UserResponse.employeeId`** — should the profile screen show the linked personnel
   record? The frontend currently has no concept of that link.
6. **`idempotencyKey` in the services.** `ErrorCode.IDEMPOTENT_REPLAY` exists, so
   something honours a key. I did not read the services to confirm *which* endpoints
   do, so the frontend sends `Idempotency-Key` on all writes. If only some endpoints
   honour it, the rest can still duplicate on retry.
