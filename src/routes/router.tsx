import { BASE_PATH } from "@/constants";
import type { ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { RootLayout } from "@/shared/layout/root-layout";
import { DashboardLayout } from "@/shared/layout/dashboard-layout";
import { ProtectedRoute } from "@/routes/protected-route";
import { LoginPage } from "@/features/identity/login-page";
import { AcceptInvitePage } from "@/features/identity/accept-invite-page";
import { ChangePasswordPage } from "@/features/identity/change-password-page";
import { SessionExpiredPage } from "@/features/identity/session-expired-page";
import { ForbiddenPage } from "@/features/identity/forbidden-page";
import { ProfilePage } from "@/features/identity/profile-page";
import { HelpPage } from "@/shared/help-page";
import { DashboardHome } from "@/features/reporting/dashboard-home";
import { PermissionKey, SystemRole } from "@/enums";
import { ErrorPage } from "@/shared/errors/error-page";
import { RouteErrorPage } from "@/shared/errors/route-error-page";
import HomePage from "@/features/home/home";
import { PublicPlansPage } from "@/features/home/public-plans-page";
import { PurchasePage } from "@/features/procurement/purchase-page";
import { PurchaseDetailsPage } from "@/features/procurement/purchase-details";
import { InventoryPage } from "@/features/inventory/inventory-page";
import { LogisticsPage } from "@/features/logistics/logistics-page";
import { PricingPage } from "@/features/pricing/pricing-page";
import { PermissionsPage } from "@/features/access/permissions-page";
import { RolesPage } from "@/features/access/roles-page";
import { UsersPage } from "@/features/access/users-page";
import { AuditLogPage } from "@/features/audit/audit-log-page";
import { PersonnelPage } from "@/features/personnel/personnel-page";
import { ReportsPage } from "@/features/reporting/reporting-page";
import { PrefinanceDetailsPage } from "@/features/partners/buyers/prefinance-details";
import { BuyerDetailsPage } from "@/features/partners/buyers/buyer-details";
import { PartnersPage } from "@/features/partners/partners-page";
import {
  ALL_PARTNERS_SECTION,
  PARTNER_SECTIONS,
  PARTNERS_ROOT,
  partnerSectionPath,
} from "@/features/partners/partner-types";
import {
  LegacyBuyerRedirect,
  LegacyBuyersRedirect,
  LegacyPrefinanceRedirect,
} from "@/features/partners/buyers/legacy-redirects";
import { PayrollPage } from "@/features/payroll/payroll-page";
import { PaymentPage } from "@/features/finance/payment-page";
import { TillPage } from "@/features/finance/till-page";
import { ExpensesPage } from "@/features/finance/expenses-page";
import { AnalysisPage } from "@/features/analysis/analysis-page";
import { EnterpriseConsole } from "@/features/enterprises/enterprise-console";
import { SubscriptionPage } from "@/features/subscription/subscription-page";
import { PlansPage } from "@/features/subscription/plans-page";


function withPermissions(
  requiredPermissions: PermissionKey[] | undefined,
  page: ReactNode,
  requireAny?: boolean,
  requiredRoles?: SystemRole[],
) {
  return (
    <ProtectedRoute
      requiredPermissions={requiredPermissions}
      requireAny={requireAny}
      requiredRoles={requiredRoles}
    >
      {page}
    </ProtectedRoute>
  );
}

function forEnterprise(requiredPermissions: PermissionKey[], page: ReactNode) {
  return (
    <ProtectedRoute requiredPermissions={requiredPermissions} enterpriseOnly>
      {page}
    </ProtectedRoute>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/offers", element: <PublicPlansPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/accept-invite", element: <AcceptInvitePage /> },
      { path: "/session-expired", element: <SessionExpiredPage /> },
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "/auth/change-password",
            element: withPermissions(undefined, <ChangePasswordPage />),
          },
          {
            path: "/profile",
            element: withPermissions(undefined, <ProfilePage />),
          },
          { path: "/help", element: withPermissions(undefined, <HelpPage />) },
          {
            path: "/forbidden",
            element: withPermissions(undefined, <ForbiddenPage />),
          },
          {
            path: "/dashboard",
            element: withPermissions(undefined, <DashboardHome />),
          },
          {
            path: "/enterprises",
            element: withPermissions(
              [PermissionKey.TENANT_READ, PermissionKey.WAREHOUSE_READ],
              <EnterpriseConsole />,
              true,
            ),
          },
          {
            path: "/procurement/purchases",
            element: forEnterprise(
              [PermissionKey.PURCHASE_READ],
              <PurchasePage />,
            ),
          },
          {
            path: "/procurement/purchases/:id",
            element: forEnterprise(
              [PermissionKey.PURCHASE_READ],
              <PurchaseDetailsPage />,
            ),
          },
          {
            path: "/finance/payments",
            element: forEnterprise(
              [PermissionKey.PAYMENT_READ],
              <PaymentPage />,
            ),
          },
          {
            path: "/finance/till",
            element: forEnterprise(
              [PermissionKey.CASH_SESSION_READ],
              <TillPage />,
            ),
          },
          {
            path: "/finance/expenses",
            element: forEnterprise([PermissionKey.EXPENSE_READ], <ExpensesPage />),
          },
          {
            path: "/finance/new-payment",
            element: <Navigate to="/finance/payments" replace />,
          },
          {
            path: "/inventory",
            element: forEnterprise(
              [PermissionKey.INVENTORY_READ],
              <InventoryPage />,
            ),
          },
          {
            path: "/logistics",
            element: forEnterprise(
              [PermissionKey.LOGISTICS_READ],
              <LogisticsPage />,
            ),
          },
          {
            path: PARTNERS_ROOT,
            element: <Navigate to={partnerSectionPath(ALL_PARTNERS_SECTION)} replace />,
          },
          // One register per partner type, plus "all". `key` makes each section
          // a fresh page, so paging and dialogs never carry over between them.
          ...[ALL_PARTNERS_SECTION, ...PARTNER_SECTIONS].map((section) => ({
            path: partnerSectionPath(section),
            element: forEnterprise(
              [PermissionKey.PARTNER_READ],
              <PartnersPage key={section.slug} section={section} />,
            ),
          })),
          {
            path: `${PARTNERS_ROOT}/buyers/:id`,
            element: forEnterprise(
              [PermissionKey.PARTNER_READ, PermissionKey.PREFINANCE_READ],
              <BuyerDetailsPage />,
            ),
          },
          {
            path: `${PARTNERS_ROOT}/buyers/:buyerId/prefinance/:prefinanceId`,
            element: forEnterprise(
              [PermissionKey.PARTNER_READ, PermissionKey.PREFINANCE_READ],
              <PrefinanceDetailsPage />,
            ),
          },
          // Legacy URLs, kept so existing links and bookmarks still work.
          { path: "/buyers", element: <LegacyBuyersRedirect /> },
          { path: "/buyers/:id", element: <LegacyBuyerRedirect /> },
          { path: "/buyers/:buyerId/prefinance/:prefinanceId", element: <LegacyPrefinanceRedirect /> },
          // {
          //   path: "/contracts",
          //   element: forEnterprise(
          //     [PermissionKey.CONTRACT_READ],
          //     <ContractsPage />,
          //   ),
          // },
          {
            path: "/pricing",
            element: forEnterprise(
              [PermissionKey.PRICE_READ],
              <PricingPage />,
            ),
          },
          {
            path: "/payroll",
            element: forEnterprise(
              [PermissionKey.EMPLOYEE_READ, PermissionKey.PAYROLL_READ],
              <PayrollPage />,
            ),
          },
          {
            path: "/personnel",
            element: forEnterprise(
              [PermissionKey.EMPLOYEE_READ],
              <PersonnelPage />,
            ),
          },
          {
            // The whole business at once, with the AI analysis: the BOSS only.
            path: "/analysis",
            element: withPermissions(undefined, <AnalysisPage />, false, [SystemRole.BOSS]),
          },
          {
            path: "/reporting",
            element: forEnterprise(
              [PermissionKey.REPORT_READ],
              <ReportsPage />,
            ),
          },
          {
            path: "/access/permissions",
            element: withPermissions(
              [
                PermissionKey.USER_READ,
                PermissionKey.ROLE_READ,
                PermissionKey.USER_UPDATE,
              ],
              <PermissionsPage />,
            ),
          },
          {
            path: "/access/users",
            element: withPermissions([PermissionKey.USER_READ], <UsersPage />),
          },
          {
            path: "/access/roles",
            element: withPermissions([PermissionKey.ROLE_READ], <RolesPage />),
          },
          {
            path: "/access/profile",
            element: withPermissions(undefined, <ProfilePage />),
          },
          {
            path: "/subscriptions",
            element: withPermissions([], <SubscriptionPage />),
          },
          {
            path: "/plans",
            element: withPermissions([PermissionKey.TENANT_READ], <PlansPage />),
          },
          {
            path: "/audit",
            element: withPermissions(
              [PermissionKey.AUDIT_READ],
              <AuditLogPage />,
            ),
          },
        ],
      },
      { path: "*", element: <ErrorPage status={404} /> },
    ],
  },
], { basename: BASE_PATH });
