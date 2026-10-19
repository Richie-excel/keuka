# Subscription plans — proposed API contract

Status: **proposed**. Nothing on the server implements this yet. The frontend in
this repo is written against exactly what is described here, so the Java needs to
match these names, paths and shapes for any of it to work.

Why a catalogue is needed at all: today a plan is only ever a bare `planCode`
string echoed back on `SubscriptionResponse` and `EnterpriseResponse`. Nothing
says what the code costs or what it includes, so a company being asked to pay
cannot be told what for. This contract adds the missing half.

---

## 1. Model

A plan is a **platform-level catalogue row**, not a per-tenant record. It is
created once by a `SYSTEM_ADMIN` and referenced by many subscriptions, exactly as
`CocoaPrice` is referenced by many purchases — with the same consequence: **a plan
is never rewritten in a way that changes what an existing subscription already
agreed to.**

Two rules follow, and they are the reason this contract has no `DELETE`:

1. **Deactivate, never delete.** `active: false` retires a plan from the catalogue
   (it can no longer be picked for a new subscription) while every existing
   subscription that references its `code` keeps resolving. A hard delete would
   orphan live subscriptions whose `planCode` no longer resolves to anything.
2. **`code` is immutable.** It is the join key `SubscriptionResponse.planCode`
   already stores. Renaming it would break the link for every tenant on that
   plan; the cosmetic rename is `name`.

---

## 2. Routes

Base path is `/api/v1` (see `ApiRoutes.API`).

| Method | Path | Authority | Body / Result |
|---|---|---|---|
| GET | `/plans` | any authenticated user | `PageResponse<PlanResponse>` |
| GET | `/plans/{code}` | any authenticated user | `PlanResponse` |
| POST | `/plans` | `TENANT_CREATE` | `CreatePlanRequest` to `PlanResponse` |
| PATCH | `/plans/{code}` | `TENANT_UPDATE` | `UpdatePlanRequest` to `PlanResponse` |

**Why `GET` needs no special authority.** A price list is not a secret from the
people being asked to pay. The comparison screen in this repo is shown to an
enterprise's own staff so they can see what their money buys; requiring the
platform-only `TENANT_READ` would hide the price list from precisely the audience
it exists for. This mirrors `GET /subscription`, already "visible to any
authenticated user".

**Why writes reuse `TENANT_*` instead of new `PLAN_*` codes.** The plan catalogue
is platform administration — the same scope, audience and blast radius as creating
tenants, and enough that the existing platform-only `TENANT_CREATE`/`TENANT_UPDATE`
already express it. Adding `PLAN_*` to `PermissionCode` means touching the enum,
the role seeds and every authority check for no gain. A dedicated code later is a
rename, not a redesign.
---

## 3. DTOs

### `PlanResponse`

```json
{
  "id": "uuid",
  "code": "STANDARD",
  "name": "Standard",
  "description": "For a single site getting started.",
  "priceAmount": 25000,
  "currency": "XAF",
  "billingPeriod": "MONTHLY",
  "features": [
    { "label": "Warehouses", "value": "Up to 2", "included": true },
    { "label": "Support", "value": "Email", "included": true },
    { "label": "API access", "value": "Not included", "included": false }
  ],
  "benefits": [
    "Unlimited purchases and payments",
    "One cashier till per warehouse"
  ],
  "active": true,
  "displayOrder": 10,
  "createdAt": "2026-01-31T09:00:00+01:00",
  "updatedAt": "2026-01-31T09:00:00+01:00"
}
```

Field notes:

- **`features` are structured, `benefits` are free text — deliberately.** A
  feature is a *comparable* fact, so it needs `label`/`value` pairs and an
  `included` flag; that is what lets the comparison screen put plans side by side
  and tick or cross each row. A benefit is a *statement* ("Unlimited purchases"),
  which has nothing to compare against a number, so it is a plain string.
- **`value` is a string, not a number.** Half the useful values are not numeric —
  "Unlimited", "Email", "24 h". Typing it as a number would force the catalogue to
  lie about what a plan includes.
- **`billingPeriod` is an enum, not a free-text interval.** "per month" as text
  cannot be sorted, compared, or later used to compute a renewal date.
- **`displayOrder` exists so the catalogue has an intended sequence** (cheapest
  first, say) without the client inferring one from `priceAmount` — a premium plan
  may legitimately be cheaper per month on a yearly commitment.
- **`priceAmount` + `currency` are separate**, matching `CocoaPriceResponse`
  which already separates them.

### `CreatePlanRequest`

```json
{
  "code": "STANDARD",
  "name": "Standard",
  "description": "For a single site getting started.",
  "priceAmount": 25000,
  "currency": "XAF",
  "billingPeriod": "MONTHLY",
  "features": [],
  "benefits": ["Unlimited purchases and payments"],
  "active": true,
  "displayOrder": 10
}
```

`currency` is optional and defaults to the platform currency server-side. `active`
defaults to `true`; `displayOrder` defaults to `0`.

### `UpdatePlanRequest`

Every field of `CreatePlanRequest` except `code`, all optional. `features` and
`benefits`, when present, **replace** the stored lists wholesale — the form always
sends the full list, so a diff protocol would add failure modes for nothing.

### Validation the server must enforce

The client checks the same rules, but the client is not the boundary:

- `code` — required on create, non-blank, `[A-Z0-9_]+`, unique.
- `name` — required, non-blank, 120 characters or fewer.
- `priceAmount` — required, zero or greater. Zero is legitimate (a free tier).
- `billingPeriod` — required, one of the enum members.
- `features[].label` and `benefits[]` — non-blank entries only; the server should
  reject or drop blanks rather than storing empty rows.

---

## 4. What does NOT change

`SubscriptionResponse` and `EnterpriseResponse` keep their `planCode: string`.
Nothing is denormalised onto them: the price and the features stay in the catalogue
and the client joins on `code`. That is what keeps a catalogue edit from silently
rewriting the terms of a subscription that already exists — and it is why the only
write this contract adds is to the catalogue itself.

Attaching a plan to a subscription (choosing one at onboarding, or switching an
existing tenant) is a **separate, later** operation on the tenancy side. It is out
of scope here so that a plan can be defined and reviewed before any tenant can move
onto it.
