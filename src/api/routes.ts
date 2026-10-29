export const API = "/v1";

export const ApiRoutes = {
  ai: {
    status: `${API}/ai/status`,
    noteSuggestions: `${API}/ai/note-suggestions`,
  },

  analysis: {
    snapshot: (days: number) => `${API}/analysis/snapshot?days=${days}`,
    latest: (language: string) => `${API}/analysis/latest?language=${language}`,
    generate: (days: number, language: string) =>
      `${API}/analysis?days=${days}&language=${language}`,
  },

  auth: {
    login: `${API}/auth/login`,
    refresh: `${API}/auth/refresh`,
    logout: `${API}/auth/logout`,
    me: `${API}/auth/me`,
    changePassword: `${API}/auth/me/password`,
  },

  users: {
    all: `${API}/users`,
    byId: (id: string) => `${API}/users/${id}`,
    disable: (id: string) => `${API}/users/${id}/disable`,
    enable: (id: string) => `${API}/users/${id}/enable`,
    resetPassword: (id: string) => `${API}/users/${id}/reset_password`,
    invitation: (id: string) => `${API}/users/${id}/invitation`,
    availableEmployees: `${API}/users/available-employees`,
    suggestedUsername: (fullName: string) =>
      `${API}/users/suggested-username?fullName=${encodeURIComponent(fullName)}`,
  },

  /** No sign-in: the page an invitation email links to. */
  invitations: {
    byToken: (token: string) => `${API}/public/invitations/${encodeURIComponent(token)}`,
    accept: (token: string) => `${API}/public/invitations/${encodeURIComponent(token)}/accept`,
  },

  roles: {
    all: `${API}/roles`,
    byId:(id: string) => `${API}/roles/${id}`,
  },

  partners: {
    all: `${API}/partners`,
    byId: (id: string) => `${API}/partners/${id}`,
  },

  employees: {
    all: `${API}/employees`,
    byId: (id: string) => `${API}/employees/${id}`,
    salaryPayouts: (id: string) => `${API}/employees/${id}/salary-payouts`,
  },

  cocoaPrices: {
    all: `${API}/cocoa-prices`,
    current: `${API}/cocoa-prices/current`,
  },

  purchases: {
    all: `${API}/purchases`,
    byId: (id: string) => `${API}/purchases/${id}`,
    payments: (id: string) => `${API}/purchases/${id}/payments`,
    deliveries: `${API}/purchases/deliveries`,
  },

  payments: {
    all: `${API}/payments`,
    byId: (id: string) => `${API}/payments/${id}`,
  },

  prefinances: {
    all: `${API}/partners/prefinances`,
    byId: (id: string) => `${API}/partners/prefinances/${id}`,
    disbursements: (id: string) =>
      `${API}/partners/prefinances/${id}/disbursements`,
    summary: `${API}/partners/prefinances/summary`,
    buyerBalance: (buyerId: string) =>
      `${API}/partners/prefinances/buyers/${buyerId}/balance`,
  },

  cashSessions: {
    all: `${API}/cash-sessions`,
    current: `${API}/cash-sessions/current`,
    byId: (id: string) => `${API}/cash-sessions/${id}`,
    provisions: (id: string) => `${API}/cash-sessions/${id}/provisions`,
    close: (id: string) => `${API}/cash-sessions/${id}/close`,
  },

  expenses: {
    all: `${API}/expenses`,
    categories: `${API}/expense-categories`,
    cancel: (id: string) => `${API}/expenses/${id}/cancel`,
  },

  truckLoadings: {
    all: `${API}/deliveries`,
    byId: (id: string) => `${API}/deliveries/${id}`,
    delivered: (id: string) => `${API}/deliveries/${id}/delivered`,
  },

  audit: {
    events: `${API}/audit/events`,
    event: (id: string) => `${API}/audit/events/${id}`,
  },

  inventory: {
    balance: `${API}/inventory`,
    movements: `${API}/inventory/movements`,
    adjustments: `${API}/inventory/adjustments`,
  },

  warehouses: {
    all: `${API}/warehouses`,
    byId: (id: string) => `${API}/warehouses/${id}`,
  },

  purge: {
    all: `${API}/purge-watches`,
    cancel: (id: string) => `${API}/purge-watches/${id}/cancel`,
    purge: (id: string) => `${API}/purge-watches/${id}/purge`,
  },

  enterprises: {
    all: `${API}/enterprises`,
    byCode: (companyCode: string) => `${API}/enterprises/${encodeURIComponent(companyCode)}`,
    suspend: (companyCode: string) =>
      `${API}/enterprises/${companyCode}/suspend`,
    activate: (companyCode: string) =>
      `${API}/enterprises/${companyCode}/activate`,
    /** Moves the company onto a plan (once it has paid); the period starts today. */
    plan: (companyCode: string) => `${API}/enterprises/${encodeURIComponent(companyCode)}/plan`,
    /** Platform health for the operator's dashboard. */
    stats: `${API}/enterprises/stats`,
    listWarehouses: (id: string) => `${API}/warehouses/enterprise/${id}/warehouses`,
  },

  subscription: {
    base: `${API}/subscription`,
    activate: `${API}/subscription/activate`,
    suspend: `${API}/subscription/suspend`,
    contact: `${API}/subscription/contact`,
  },

  plans: {
    all: `${API}/plans`,
    /** No sign-in: the public price list. */
    public: `${API}/public/plans`,
    byCode: (code: string) => `${API}/plans/${encodeURIComponent(code)}`,
  },
} as const;
