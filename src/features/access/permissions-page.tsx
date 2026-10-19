import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { RoleBadge } from "@/components/role-badge";
import { Settings2 } from "lucide-react";
import { Field } from "@/components/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Loader from "@/components/loader";
import { PageSkeleton } from "@/components/page-skeleton";
import { LOOKUP_PAGE_SIZE } from "@/constants";
import { PageHeader } from "@/shared/layout/page-header";
import { useAssignUserRoles, useUsers } from "@/shared/hooks/use-users";
import { useRoles } from "@/shared/hooks/use-roles";
import { useAuth } from "@/shared/hooks/useAuth";
import { hasChanged } from "@/lib/utils";
import { roleOptions } from "@/features/access/assignable-roles";
import { PermissionMatrix } from "@/features/identity/permission-matrix";
// import { apiErrorMessage } from "@/lib/api-error-message";
// import { useApiErrorMessage } from "@/shared/hooks/use-api-error-message";

interface AccessFormValues {
  userId: string;
  roles: string[];
}

function toggleRole(current: string[], role: string, checked: boolean) {
  if (checked) return current.includes(role) ? current : [...current, role];
  return current.filter((currentRole) => currentRole !== role);
}

export function PermissionsPage() {
  const { t } = useTranslation();
  // The dropdown needs every user, so ask for one large page.
  const usersQuery = useUsers({ page: 1, size: LOOKUP_PAGE_SIZE });
  const rolesQuery = useRoles();
  const assignRoles = useAssignUserRoles();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<AccessFormValues>({
    defaultValues: { userId: "", roles: [] },
  });

  const userId = useWatch({ control, name: "userId" });
  const roles = useWatch({ control, name: "roles" });

  const { user: actor } = useAuth();
  const users = usersQuery.data?.content ?? [];
  const allRoles = rolesQuery.data ?? [];
  const selectedUser = users.find((user) => user.id === userId);

  const options = roleOptions(allRoles, actor, selectedUser?.roles ?? []);

  const hasChanges = selectedUser ? hasChanged(selectedUser, { roles }) : false;

  const canSave = hasChanges && roles.length > 0;

  function handleUserChange(nextUserId: string) {
    if (
      hasChanges &&
      !window.confirm(
        t("permissions.discardChanges", {
          defaultValue: "Discard your unsaved changes?",
        }),
      )
    ) {
      return;
    }
    const next = users.find((user) => user.id === nextUserId);
    reset({ userId: nextUserId, roles: [...(next?.roles ?? [])] });
  }

  function handleReset() {
    reset({ userId, roles: [...(selectedUser?.roles ?? [])] });
  }

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root.serverError");
    try {
      await assignRoles.mutateAsync({ id: values.userId, roles: values.roles });
    } catch (cause) {
      setError("root.serverError", {
        type: "server",
        message:
          cause instanceof Error
            ? cause.message
            : t("errors.unexpectedDescription"),
      });
    }
  });

  const serverError = errors.root?.serverError?.message;

  return (
    <PageSkeleton loading={usersQuery.isPending || rolesQuery.isPending}>
    <div>
      <PageHeader
        title={t("permissions.title")}
        description={t("permissions.description")}
        icon={Settings2}
      />

      {usersQuery.isError || rolesQuery.isError ? (
        <p role="alert" className="py-8 text-center text-sm text-destructive">
          {(usersQuery.error ?? rolesQuery.error)?.message}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
          <Field label={t("permissions.user")} htmlFor="permissions-user">
            <Select
              value={userId === "" ? undefined : userId}
              onValueChange={handleUserChange}
            >
              <SelectTrigger id="permissions-user" className="w-fit">
                <SelectValue
                  placeholder={t("permissions.selectUser", {
                    defaultValue: "Select a user",
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.username} value={user.id}>
                    {user.fullName} ({user.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {!selectedUser ? (
            <p className="text-sm text-cocoa-500">
              {t("permissions.chooseUserHint", {
                defaultValue: "Choose a user to manage their access.",
              })}
            </p>
          ) : (
            <>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-cocoa-700">
                  {t("permissions.roles")}
                </legend>
                <Controller
                  name="roles"
                  control={control}
                  render={({ field }) => (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {options.map((option) => (
                        <Label
                          key={option.name}
                          className={
                            option.locked
                              ? "flex items-start gap-2 font-normal opacity-70"
                              : "flex cursor-pointer items-start gap-2 font-normal"
                          }
                        >
                          <Checkbox
                            className="mt-0.5"
                            checked={field.value.includes(option.name)}
                            disabled={option.locked}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                toggleRole(
                                  field.value,
                                  option.name,
                                  checked === true,
                                ),
                              )
                            }
                          />
                          <span>
                            <RoleBadge role={option.name} />
                            <span className="block text-xs text-cocoa-500">
                              {option.description}
                            </span>
                          </span>
                        </Label>
                      ))}
                    </div>
                  )}
                />
                {roles.length === 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("users.rolesRequired")}
                  </p>
                )}
              </fieldset>

              {serverError && (
                <p role="alert" className="text-sm text-destructive">
                  {serverError}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={!hasChanges || isSubmitting}
                  >
                    {t("common.reset", { defaultValue: "Reset" })}
                  </Button>
                  <Button type="submit" disabled={!canSave || isSubmitting}>
                    {isSubmitting && <Loader />}
                    {t("common.save")}
                  </Button>
                </div>
              </div>

              <section className="space-y-3 border-t border-cocoa-100 pt-6">
                <div>
                  <h2 className="text-sm font-semibold text-cocoa-900">
                    {t("permissions.permissions")}
                  </h2>
                  <p className="mt-1 text-xs text-cocoa-500">
                    {t("permissions.viaRolesNotice", {
                      defaultValue:
                        "Permissions come from roles, so they are read-only here. Change the roles above, or edit a role on the Roles page.",
                    })}
                  </p>
                </div>
                <PermissionMatrix selected={selectedUser.permissions} />
              </section>
            </>
          )}
        </form>
      )}
    </div>
    </PageSkeleton>
  );
}
