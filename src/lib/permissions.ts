
export const STANDARD_ACTIONS = ["CREATE", "READ", "UPDATE", "DELETE"] as const;

export interface PermissionGroup {
  /** e.g. "CASH_SESSION" */
  module: string;
  /** Actions that exist (or are granted), e.g. ["CREATE", "READ"]. Standard ones first. */
  actions: string[];
  /** Maps each action back to its full permission string, e.g. READ -> "CASH_SESSION_READ". */
  permissionByAction: Record<string, string>;
}

/**
 * Splits "CASH_SESSION_DELETE" into { module: "CASH_SESSION", action: "DELETE" }.
 * The action is whatever follows the LAST underscore, so modules may contain
 * underscores themselves.
 */
export function splitPermission(permission: string) {
  const index = permission.lastIndexOf("_");
  if (index === -1) return { module: permission, action: "ACCESS" };
  return {
    module: permission.slice(0, index),
    action: permission.slice(index + 1),
  };
}

function actionRank(action: string) {
  const rank = (STANDARD_ACTIONS as readonly string[]).indexOf(action);
  return rank === -1 ? STANDARD_ACTIONS.length : rank;
}

/**
 * Groups a flat permission list by module. The result is deduplicated and
 * sorted (modules A to Z, actions in CRUD order), so it is stable no matter
 * what order the API returns.
 */
export function groupPermissions(
  permissions: readonly string[],
): PermissionGroup[] {
  const byModule = new Map<string, Map<string, string>>();

  for (const permission of permissions) {
    const { module, action } = splitPermission(permission);
    if (!byModule.has(module)) byModule.set(module, new Map());
    byModule.get(module)!.set(action, permission);
  }

  return [...byModule.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([module, entries]) => {
      const actions = [...entries.keys()].sort(
        (a, b) => actionRank(a) - actionRank(b) || a.localeCompare(b),
      );
      return {
        module,
        actions,
        permissionByAction: Object.fromEntries(entries),
      };
    });
}


export function humanize(value: string) {
  const text = value.toLowerCase().replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}