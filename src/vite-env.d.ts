/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  /** Demo-only — see USE_MOCK_AUTH note in auth-context.tsx */
  readonly VITE_USE_MOCK_AUTH?: string

  // Tunables — parsed, validated and defaulted in src/constants/env.ts.
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_FULL_NAME?: string
  readonly VITE_APP_VERSION?: string
  readonly VITE_DEFAULT_CURRENCY?: string
  readonly VITE_SKELETON_DURATION_MS?: string
  readonly VITE_PAGE_SIZE?: string
  readonly VITE_PAGE_SIZE_OPTIONS?: string
  readonly VITE_AUDIT_PAGE_SIZE?: string
  readonly VITE_LOOKUP_PAGE_SIZE?: string
  readonly VITE_WAREHOUSE_PAGE_SIZE?: string
  readonly VITE_PLATFORM_SUBSCRIPTIONS_PAGE_SIZE?: string
  readonly VITE_PAYROLL_HISTORY_PAGE_SIZE?: string
  readonly VITE_PAYSLIP_HISTORY_SIZE?: string
  readonly VITE_ADMIN_DASHBOARD_PAGE_SIZE?: string
  readonly VITE_DASHBOARD_LIST_SIZE?: string
  readonly VITE_DASHBOARD_MOVEMENT_SIZE?: string
  readonly VITE_DASHBOARD_PRICE_HISTORY_SIZE?: string
  readonly VITE_DASHBOARD_EMPLOYEE_SIZE?: string
  readonly VITE_DASHBOARD_CARD_PAGE_SIZE?: string
  readonly VITE_QUERY_STALE_MS?: string
  readonly VITE_QUERY_GC_MS?: string
  readonly VITE_QUERY_RETRY_COUNT?: string
  readonly VITE_SESSION_STALE_MS?: string
  readonly VITE_SUBSCRIPTION_STALE_MS?: string
  readonly VITE_PLANS_STALE_MS?: string
  readonly VITE_WAREHOUSES_STALE_MS?: string
  readonly VITE_EXPENSE_CATEGORIES_STALE_MS?: string
  readonly VITE_CURRENT_PRICE_STALE_MS?: string
  readonly VITE_TOAST_SUCCESS_DURATION_MS?: string
  readonly VITE_TOAST_ERROR_DURATION_MS?: string
  readonly VITE_TOKEN_EXPIRY_SKEW_MS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
