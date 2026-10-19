import { SystemRole } from "@/enums";
import type { RoleResponse, UserResponse } from "@/interfaces";

/**
 * Which roles the signed-in actor may hand out — computed before the checkbox
 * is drawn, not discovered by a 403 in the middle of a form.
 *
 * WHY THIS EXISTS. The backend refuses exactly two things
 * (`UserAdminService.requireActorMayAssign`): a non-platform actor assigning a
 * PLATFORM role, and anyone assigning a role that grants a permission they do
 * not hold themselves. Those refusals arrive as an error on save — after the
 * user has been offered, and has ticked, something the UI let them see. The
 * role checkboxes in this app listed EVERY system role for EVERY actor, so a
 * boss was invited to grant himself or anyone else the system administrator
 * role and only found out when the server said no. The offer and the authority
 * must be the same list; this module is where that list is built.
 *
 * WHY IT MIRRORS THE SERVER RATHER THAN INVENTING A RULE. `SystemRole` in Java
 * also carries `canBeAssignedBy`, which says a BOSS role is assignable only by
 * a SYSTEM_ADMIN. That method is NOT what the endpoint enforces (it uses the
 * permission-subset rule above), so following it here would hide roles the
 * server would have accepted — a boss may legitimately assign the BOSS role,
 * because it grants nothing a boss lacks. Only the enforced rule is copied.
 */

type Actor = Pick<UserResponse, "roles" | "permissions">;

/** An actor we could not read (no session yet) may grant nothing. */
const NO_ACTOR: Actor = { roles: [], permissions: [] };

/** What the picker needs to know about one role. */
export interface RoleOption {
  name: string;
  description?: string;
  /**
   * The account ALREADY holds this role, but the actor is not allowed to grant
   * it, so the box is ticked and cannot be changed.
   *
   * WHY shown rather than hidden: the form submits the ticked roles as the
   * account's complete role set, so a role omitted from the list would be
   * silently REMOVED on save. Locking it keeps the account exactly as it was.
   */
  locked: boolean;
}

/** `SYSTEM_ADMIN` is the only role with PLATFORM scope (`SystemRole.isPlatform`). */
export function isPlatformRole(
  role: Pick<RoleResponse, "name" | "builtIn">,
): boolean {
  return role.builtIn && role.name === SystemRole.SYSADMIN;
}

export function isPlatformActor(actor: Actor | null | undefined): boolean {
  return Boolean(actor?.roles.includes(SystemRole.SYSADMIN));
}

/**
 * The roles the actor may grant — the same answer `requireActorMayAssign`
 * computes: everything, if the actor is a platform administrator; otherwise
 * every role that is not a platform role and that grants nothing the actor
 * does not hold.
 */
export function assignableRoles(
  roles: readonly RoleResponse[],
  actor: Actor | null | undefined,
): RoleResponse[] {
  const effective = actor ?? NO_ACTOR;
  if (isPlatformActor(effective)) return [...roles];

  const held = new Set<string>(effective.permissions);
  return roles.filter(
    (role) => !isPlatformRole(role) && role.permissions.every((code) => held.has(code)),
  );
}

/**
 * The full checkbox list: what the actor may grant (unlocked), plus anything the
 * account already holds that they may not (locked), plus a role the account
 * holds that the catalogue no longer lists (locked, so it survives a save).
 */
export function roleOptions(
  roles: readonly RoleResponse[],
  actor: Actor | null | undefined,
  currentRoleNames: readonly string[] = [],
): RoleOption[] {
  const grantable = new Set(assignableRoles(roles, actor).map((role) => role.name));
  const current = new Set(currentRoleNames);

  const options: RoleOption[] = [];
  for (const role of roles) {
    const locked = !grantable.has(role.name);
    if (!locked || current.has(role.name)) {
      options.push({
        name: role.name,
        description: role.description,
        locked,
      });
    }
  }

  const known = new Set(roles.map((role) => role.name));
  for (const name of currentRoleNames) {
    if (!known.has(name)) options.push({ name, locked: true });
  }

  return options;
}

/**
 * The picker before `GET /roles` has answered, or if it was refused.
 *
 * Only the name rule can be applied here: the permission-subset rule needs each
 * role's permissions, which is exactly what the catalogue carries. It still
 * removes the one offer that matters — the system administrator role, to
 * someone who is not one. A lesser role that the actor cannot actually grant
 * may still appear and will be refused by the server, which is the behaviour
 * this app already had.
 */
export function fallbackRoleOptions(
  actor: Actor | null | undefined,
  currentRoleNames: readonly string[] = [],
): RoleOption[] {
  const platform = isPlatformActor(actor);
  const current = new Set(currentRoleNames);

  return Object.values(SystemRole)
    .filter(
      (name) =>
        platform || name !== SystemRole.SYSADMIN || current.has(name),
    )
    .map((name) => ({ name, locked: false }));
}
