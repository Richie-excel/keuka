import { PermissionKey, SystemRole } from "@/enums";
import type { UserResponse } from "@/interfaces";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  Layers,
  Building2,
  Package,
  Receipt,
  ReceiptText,
  Settings,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserRoundCog,
  Handshake,
  WalletCards,
  Wallet,
  CreditCard,
  LayoutGrid,
} from "lucide-react";
import {
  ALL_PARTNERS_SECTION,
  PARTNER_SECTIONS,
  PARTNERS_ROOT,
  partnerSectionPath,
} from "@/features/partners/partner-types";

export interface NavItem {
  labelKey: string;
  path: string;
  icon: LucideIcon;
  permissions?: PermissionKey[];
  requireAny?: boolean;
  roles?: SystemRole[];
  /**
   * A company's own business data. Hidden from the platform operator, who belongs
   * to no company (see `AuthContextValue.isPlatform`).
   */
  enterpriseOnly?: boolean;
  /**
   * Renders the item as a collapsible sub-menu. The parent's own `path` is only
   * used to mark it active (any child path starts with it); the parent is shown
   * when at least one child is visible to the user.
   */
  children?: NavItem[];
}

export interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "nav.group.workspace",
    items: [
      { labelKey: "nav.dashboard", path: "/dashboard", icon: LayoutGrid },
    ],
  },
  {
    labelKey: "nav.group.operations",
    items: [
      { labelKey: "nav.purchases", path: "/procurement/purchases", icon: ShoppingCart, permissions: [PermissionKey.PURCHASE_READ], enterpriseOnly: true },
      { labelKey: "nav.inventory", path: "/inventory", icon: Package, permissions: [PermissionKey.INVENTORY_READ], enterpriseOnly: true },
      { labelKey: "nav.logistics", path: "/logistics", icon: Truck, permissions: [PermissionKey.LOGISTICS_READ], enterpriseOnly: true },
      {
        labelKey: "nav.partners",
        path: PARTNERS_ROOT,
        icon: Handshake,
        permissions: [PermissionKey.PARTNER_READ],
        enterpriseOnly: true,
        children: [ALL_PARTNERS_SECTION, ...PARTNER_SECTIONS].map((section) => ({
          labelKey: `nav.partnerSections.${section.key}`,
          path: partnerSectionPath(section),
          icon: section.icon,
          permissions: [PermissionKey.PARTNER_READ],
          enterpriseOnly: true,
        })),
      },
      // { labelKey: "nav.contracts", path: "/contracts", icon: FileText, permissions: [PermissionKey.CONTRACT_READ], enterpriseOnly: true },
      { labelKey: "nav.pricing", path: "/pricing", icon: Receipt, permissions: [PermissionKey.PRICE_READ], enterpriseOnly: true },
    ],
  },
  {
    labelKey: "nav.group.finance",
    items: [
      { labelKey: "nav.till", path: "/finance/till", icon: Wallet, permissions: [PermissionKey.CASH_SESSION_READ], enterpriseOnly: true },
      { labelKey: "nav.expenses", path: "/finance/expenses", icon: ReceiptText, permissions: [PermissionKey.EXPENSE_READ], enterpriseOnly: true },
      { labelKey: "nav.payments", path: "/finance/payments", icon: WalletCards, permissions: [PermissionKey.PAYMENT_READ], enterpriseOnly: true },
      { labelKey: "nav.payroll", path: "/payroll", icon: ClipboardList, permissions: [PermissionKey.EMPLOYEE_READ, PermissionKey.PAYROLL_READ], enterpriseOnly: true },
    ],
  },
  {
    labelKey: "nav.group.admin",
    items: [
      { labelKey: "nav.personnel", path: "/personnel", icon: BriefcaseBusiness, permissions: [PermissionKey.EMPLOYEE_READ], enterpriseOnly: true },
      { labelKey: "nav.users", path: "/access/users", icon: UserRoundCog, permissions: [PermissionKey.USER_READ] },
      { labelKey: "nav.permissions", path: "/access/permissions", icon: Settings2, permissions: [PermissionKey.USER_READ, PermissionKey.ROLE_READ, PermissionKey.USER_UPDATE] },
      { labelKey: "nav.roles", path: "/access/roles", icon: ShieldCheck, permissions: [PermissionKey.ROLE_READ] },
      { labelKey: "nav.enterprises", path: "/enterprises", icon: Building2, permissions: [PermissionKey.TENANT_READ, PermissionKey.WAREHOUSE_READ], requireAny: true },
      { labelKey: "nav.plans", path: "/plans", icon: Layers, permissions: [PermissionKey.TENANT_READ] },
      { labelKey: "nav.audit", path: "/audit", icon: FileText, permissions: [PermissionKey.AUDIT_READ] },
      { labelKey: "nav.analysis", path: "/analysis", icon: BrainCircuit, roles: [SystemRole.BOSS], enterpriseOnly: true },
      { labelKey: "nav.reporting", path: "/reporting", icon: BarChart3, permissions: [PermissionKey.REPORT_READ], enterpriseOnly: true },
    ],
  },
  {
    labelKey: "nav.group.account",
    items: [
      { labelKey: "nav.profile", path: "/access/profile", icon: Settings },
      { labelKey: "nav.subscription", path: "/subscriptions", icon: CreditCard, permissions: [] },
    ],
  },
];

function isVisible(
  item: NavItem,
  user: Pick<UserResponse, "permissions" | "roles">,
): boolean {
  const isPlatform = user.roles.includes(SystemRole.SYSADMIN);
  if (item.enterpriseOnly && isPlatform) return false;

  if (item.roles && item.roles.length > 0) {
    const holdsRole = item.roles.some((role) => user.roles.includes(role));
    if (!holdsRole) return false;
  }

  if (!item.permissions || item.permissions.length === 0) return true;

  return item.requireAny
    ? item.permissions.some((p) => user.permissions.includes(p))
    : item.permissions.every((p) => user.permissions.includes(p));
}

export function navGroupsForUser(
  user: Pick<UserResponse, "permissions" | "roles">,
): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.flatMap((item): NavItem[] => {
      if (!isVisible(item, user)) return [];
      if (!item.children) return [item];
      const children = item.children.filter((child) => isVisible(child, user));
      return children.length > 0 ? [{ ...item, children }] : [];
    }),
  })).filter((group) => group.items.length > 0);
}

export function navItemsForUser(
  user: Pick<UserResponse, "permissions" | "roles">,
): NavItem[] {
  return navGroupsForUser(user).flatMap((group) =>
    group.items.flatMap((item) => item.children ?? [item]),
  );
}
