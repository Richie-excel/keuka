import { useTranslation } from "react-i18next";
import {
  Briefcase,
  Calculator,
  Crown,
  Dumbbell,
  Package,
  ShieldCheck,
  ShoppingBasket,
  Tag,
  Truck,
  User,
  UserCog,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { EmployeeType, SystemRole } from "@/enums";
import { cn } from "@/lib/utils";

interface RoleStyle {
  icon: LucideIcon;
  className: string;
}

/**
 * One look per built-in role, kept here so "Cashier" is the same colour on
 * the users list, the profile and the sidebar, like StatusBadge does for
 * statuses. A role a company created itself is shown neutral, with a tag.
 */
const ROLE_STYLES: Record<string, RoleStyle> = {
  [SystemRole.SYSADMIN]: { icon: ShieldCheck, className: "bg-slate-100 text-slate-700 ring-slate-200" },
  [SystemRole.BOSS]: { icon: Crown, className: "bg-cocoa-100 text-cocoa-900 ring-cocoa-300" },
  [SystemRole.CASHIER]: { icon: Wallet, className: "bg-pod-100 text-pod-700 ring-pod-500/30" },
  [SystemRole.INVENTORY]: { icon: Package, className: "bg-amber-100 text-amber-700 ring-amber-500/30" },
  [SystemRole.STAFF]: { icon: UserCog, className: "bg-sky-100 text-sky-800 ring-sky-200" },
  [SystemRole.BUYER]: { icon: ShoppingBasket, className: "bg-violet-100 text-violet-800 ring-violet-200" },
};

const CUSTOM_ROLE: RoleStyle = {
  icon: Tag,
  className: "bg-muted text-muted-foreground ring-border",
};

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const { t } = useTranslation();
  const style = ROLE_STYLES[role] ?? CUSTOM_ROLE;
  const Icon = style.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        style.className,
        className,
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      {t(`roles.${role}`, role)}
    </span>
  );
}

/** A user's roles as badges, wrapping when there are several. */
export function RoleBadges({
  roles,
  className,
  empty = "—",
}: {
  roles: readonly string[];
  className?: string;
  empty?: string;
}) {
  if (roles.length === 0) return <span className="text-muted-foreground">{empty}</span>;
  return (
    <span className={cn("inline-flex flex-wrap gap-1", className)}>
      {roles.map((role) => (
        <RoleBadge key={role} role={role} />
      ))}
    </span>
  );
}

/**
 * An employee's job (personnel.EmployeeType), in the same shape as RoleBadge.
 * A job is not an access role, but where they meet the colours agree: a
 * cashier is green as a role and as a job, a warehouse clerk shares the
 * Inventory role's amber, office jobs the Staff role's blue.
 */
const EMPLOYEE_TYPE_STYLES: Record<EmployeeType, RoleStyle> = {
  [EmployeeType.CASHIER]: ROLE_STYLES[SystemRole.CASHIER],
  [EmployeeType.WAREHOUSE_CLERK]: ROLE_STYLES[SystemRole.INVENTORY],
  [EmployeeType.FINANCIAL_SECRETARY]: { icon: Calculator, className: "bg-sky-100 text-sky-800 ring-sky-200" },
  [EmployeeType.ADMINISTRATIVE]: { icon: Briefcase, className: "bg-sky-100 text-sky-800 ring-sky-200" },
  [EmployeeType.DRIVER]: { icon: Truck, className: "bg-indigo-100 text-indigo-800 ring-indigo-200" },
  [EmployeeType.MECHANIC]: { icon: Wrench, className: "bg-stone-200 text-stone-800 ring-stone-300" },
  [EmployeeType.LOADER]: { icon: Dumbbell, className: "bg-orange-100 text-orange-800 ring-orange-200" },
  [EmployeeType.OTHER]: { icon: User, className: "bg-muted text-muted-foreground ring-border" },
};

export function EmployeeTypeBadge({ type, className }: { type: EmployeeType | string; className?: string }) {
  const { t } = useTranslation();
  const style = EMPLOYEE_TYPE_STYLES[type as EmployeeType] ?? EMPLOYEE_TYPE_STYLES[EmployeeType.OTHER];
  const Icon = style.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        style.className,
        className,
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      {t(`personnel.types.${type}`, type)}
    </span>
  );
}
