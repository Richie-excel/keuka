import { getTenantScope } from "@/shared/tenant-scope";

/**
 * Every key except the session's starts with the tenant scope (see
 * `shared/tenant-scope.ts`): the cache can then never serve one user's or one
 * enterprise's data to another. The roots are getters so the scope is read when a
 * key is built, not once at import time, and call sites stay `qk.partners.all`.
 * The session is the one unscoped key, because it is what the scope comes from.
 */
const scoped = <T extends string>(name: T) => [getTenantScope(), name] as const;


const listKey = <T extends string>(scope: readonly T[], input?: object) =>
  [...scope, "list", input ?? {}] as const;

export const qk = {
  session: {
    all: ["session"] as const,
    me: () => [...qk.session.all, "me"] as const,
  },

  users: {
    get all() {
      return scoped("users");
    },
    lists: () => [...qk.users.all, "list"] as const,
    list: (input?: object) => listKey(qk.users.lists(), input),
    details: () => [...qk.users.all, "detail"] as const,
    detail: (id: string) => [...qk.users.details(), id] as const,
    availableEmployees: () => [...qk.users.all, "available-employees"] as const,
  },

  roles: {
    get all() {
      return scoped("roles");
    },
    list: () => [...qk.roles.all, "list"] as const,
  },

  partners: {
    get all() {
      return scoped("partners");
    },
    lists: () => [...qk.partners.all, "list"] as const,
    list: (input?: object) => listKey(qk.partners.lists(), input),
    details: () => [...qk.partners.all, "detail"] as const,
    detail: (id: string) => [...qk.partners.details(), id] as const,
  },

  employees: {
    get all() {
      return scoped("employees");
    },
    lists: () => [...qk.employees.all, "list"] as const,
    list: (input?: object) => listKey(qk.employees.lists(), input),
    details: () => [...qk.employees.all, "detail"] as const,
    detail: (id: string) => [...qk.employees.details(), id] as const,
    salaryPayouts: (id: string) =>
      [...qk.employees.details(), id, "salary-payouts"] as const,
  },

  ai: {
    get all() {
      return scoped("ai");
    },
    status: () => [...qk.ai.all, "status"] as const,
  },

  analysis: {
    get all() {
      return scoped("analysis");
    },
    snapshot: (days: number) => [...qk.analysis.all, "snapshot", days] as const,
    latest: (language: string) => [...qk.analysis.all, "latest", language] as const,
  },

  cocoaPrices: {
    get all() {
      return scoped("cocoa-prices");
    },
    lists: () => [...qk.cocoaPrices.all, "list"] as const,
    list: (input?: object) => listKey(qk.cocoaPrices.lists(), input),
    current: () => [...qk.cocoaPrices.all, "current"] as const,
  },

  purchases: {
    get all() {
      return scoped("purchases");
    },
    lists: () => [...qk.purchases.all, "list"] as const,
    list: (input?: object) => listKey(qk.purchases.lists(), input),
    details: () => [...qk.purchases.all, "detail"] as const,
    detail: (id: string) => [...qk.purchases.details(), id] as const,
    payments: (id: string) => [...qk.purchases.details(), id, "payments"] as const,
    deliveries: (input?: object) => listKey([...qk.purchases.all, "deliveries"], input),
  },

  payments: {
    get all() {
      return scoped("payments");
    },
    lists: () => [...qk.payments.all, "list"] as const,
    list: (input?: object) => listKey(qk.payments.lists(), input),
    details: () => [...qk.payments.all, "detail"] as const,
    detail: (id: string) => [...qk.payments.details(), id] as const,
  },

  prefinances: {
    get all() {
      return scoped("prefinances");
    },
    lists: () => [...qk.prefinances.all, "list"] as const,
    list: (input?: object) => listKey(qk.prefinances.lists(), input),
    details: () => [...qk.prefinances.all, "detail"] as const,
    detail: (id: string) => [...qk.prefinances.details(), id] as const,
    summary: () => [...qk.prefinances.all, "summary"] as const,
    buyerBalance: (buyerId: string) => [...qk.prefinances.all, "balance", buyerId] as const,
  },

  deliveries: {
    get all() {
      return scoped("deliveries");
    },
    lists: () => [...qk.deliveries.all, "list"] as const,
    list: (input?: object) => listKey(qk.deliveries.lists(), input),
    details: () => [...qk.deliveries.all, "detail"] as const,
    detail: (id: string) => [...qk.deliveries.details(), id] as const,
  },

  inventory: {
    get all() {
      return scoped("inventory");
    },
    balances: () => [...qk.inventory.all, "balance"] as const,
    balance: (warehouseId?: string) =>
      [...qk.inventory.balances(), warehouseId ?? "default"] as const,
    movements: (input?: object) =>
      listKey([...qk.inventory.all, "movements"] as const, input),
  },

  cashSessions: {
    get all() {
      return scoped("cash-sessions");
    },
    lists: () => [...qk.cashSessions.all, "list"] as const,
    list: (input?: object) => listKey(qk.cashSessions.lists(), input),
    details: () => [...qk.cashSessions.all, "detail"] as const,
    detail: (id: string) => [...qk.cashSessions.details(), id] as const,
    /** The caller's currently open till, if any. */
    open: () => [...qk.cashSessions.all, "open"] as const,
  },

  expenses: {
    get all() {
      return scoped("expenses");
    },
    lists: () => [...qk.expenses.all, "list"] as const,
    list: (input?: object) => listKey(qk.expenses.lists(), input),
    categories: (input?: object) =>
      listKey([...qk.expenses.all, "categories"] as const, input),
  },

  payroll: {
    get all() {
      return scoped("payroll");
    },
    lists: () => [...qk.payroll.all, "list"] as const,
    list: (employeeId: string, input?: object) =>
      listKey([...qk.payroll.all, employeeId] as const, input),
  },

  audit: {
    get all() {
      return scoped("audit");
    },
    lists: () => [...qk.audit.all, "list"] as const,
    list: (input?: object) => listKey(qk.audit.lists(), input),
  },

  warehouses: {
    get all() {
      return scoped("warehouses");
    },
    lists: () => [...qk.warehouses.all, "list"] as const,
    list: (input?: object) => listKey(qk.warehouses.lists(), input),
  },

  enterprises: {
    get all() {
      return scoped("enterprises");
    },
    lists: () => [...qk.enterprises.all, "list"] as const,
    list: (input?: object) => listKey(qk.enterprises.lists(), input),
    warehouses: (id: string) => [...qk.enterprises.all, "warehouses", id] as const,
  },

  subscription: {
    get all() {
      return scoped("subscription");
    },
    current: () => [...qk.subscription.all, "current"] as const,
  },

  plans: {
    get all() {
      return scoped("plans");
    },
    lists: () => [...qk.plans.all, "list"] as const,
    list: (input?: object) => listKey(qk.plans.lists(), input),
    /** Not scoped to a session: visitors see it too. */
    public: () => ["public-plans"] as const,
    details: () => [...qk.plans.all, "detail"] as const,
    detail: (code: string) => [...qk.plans.details(), code] as const,
  },
} as const;
