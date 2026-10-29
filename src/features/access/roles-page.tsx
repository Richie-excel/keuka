import { Controller, useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { describeRole } from "@/features/access/assignable-roles";
import { RoleBadge } from "@/components/role-badge";
import { ShieldCheck, FileText } from "lucide-react";
import { Field } from "@/components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Loader from "@/components/loader";
import { SubmitButton } from "@/components/submit-button";
import { useDialogBusy } from "@/components/ui/dialog-busy";
import { PageSkeleton } from "@/components/page-skeleton";
import { PageHeader } from "@/shared/layout/page-header";
import {
  useCreateRole,
  useDeleteRole,
  useRoles,
  useUpdateRole,
} from "@/shared/hooks/use-roles";
import { hasChanged } from "@/lib/utils";
import { PermissionMatrix } from "@/features/identity/permission-matrix";
import { PermissionKey } from "@/enums";
import { useAuth } from "@/shared/hooks/useAuth";
import { useFieldRules } from "@/shared/hooks/use-field-rules";
import type { RoleResponse } from "@/interfaces";
import { PERMISSION_TOTAL } from "@/constants";

interface RoleFormValues {
  roleId: string;
  description: string;
  permissions: string[];
}

const notBlank = (value: string) => value.trim().length > 0;

export function RolesPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const query = useRoles();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const [dialogOpen, setDialogOpen] = useState(false);
  const canCreate = hasPermission(PermissionKey.ROLE_CREATE);
  const canUpdate = hasPermission(PermissionKey.ROLE_UPDATE);
  const canDelete = hasPermission(PermissionKey.ROLE_DELETE);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormValues>({
    defaultValues: { roleId: "", description: "", permissions: [] },
  });

  const roleId = useWatch({ control, name: "roleId" });
  const description = useWatch({ control, name: "description" });
  const permissions = useWatch({ control, name: "permissions" });

  const roles = query.data ?? [];
  const builtIn = roles.filter((role) => role.builtIn);
  const custom = roles.filter((role) => !role.builtIn);
  const selectedRole = roles.find((role) => role.id === roleId);
  const isBuiltIn = selectedRole?.builtIn ?? false;

  const hasChanges =
    selectedRole && !isBuiltIn
      ? hasChanged(selectedRole, { description, permissions })
      : false;
  const canSave = canUpdate && hasChanges && notBlank(description);

  function load(role: RoleResponse | undefined) {
    reset({
      roleId: role?.id ?? "",
      // Built-in roles cannot be edited, so showing their description translated is safe.
      description: role ? describeRole(role, t) : "",
      permissions: [...(role?.permissions ?? [])],
    });
  }

  function handleRoleChange(nextRoleId: string) {
    if (
      hasChanges &&
      !window.confirm(
        t("roles.discardChanges", {
          defaultValue: "Discard your unsaved changes?",
        }),
      )
    ) {
      return;
    }
    load(roles.find((role) => role.id === nextRoleId));
  }

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root.serverError");
    try {
      await updateRole.mutateAsync({
        id: values.roleId,
        patch: {
          description: values.description.trim(),
          permissions: values.permissions,
        },
      });
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

  async function handleDelete() {
    if (!selectedRole) return;
    const confirmed = window.confirm(
      t("roles.confirmDelete", {
        name: selectedRole.name,
        defaultValue: "Delete the role “{{name}}”? This cannot be undone.",
      }),
    );
    if (!confirmed) return;
    try {
      await deleteRole.mutateAsync(selectedRole.id);
      load(undefined);
    } catch {
      // The error toast has already told the user what went wrong.
    }
  }

  const serverError = errors.root?.serverError?.message;

  return (
    <div>
      <PageSkeleton loading={query.isPending}>
      <div>
      <PageHeader
        title={t("roles.title", { defaultValue: "Roles" })}
        description={t("roles.description", {
          defaultValue:
            "Create roles with exactly the permissions a job needs, then assign them to users.",
        })}
        icon={ShieldCheck}
      />

      {query.isError ? (
        <p role="alert" className="py-8 text-center text-sm text-destructive">
          {query.error.message}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1">
              <Field
                label={t("roles.role", { defaultValue: "Role" })}
                htmlFor="role-select"
              >
                <Select value={roleId} onValueChange={handleRoleChange}>
                  <SelectTrigger id="role-select" className="w-full py-5">
                    <SelectValue
                      placeholder={t("roles.selectRole", {
                        defaultValue: "Select a role…",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>
                        {t("roles.builtIn", { defaultValue: "Built-in" })}
                      </SelectLabel>
                      {builtIn.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          <RoleBadge role={role.name} />
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    {custom.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>
                          {t("roles.custom", { defaultValue: "Custom" })}
                        </SelectLabel>
                        {custom.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <RoleBadge role={role.name} />
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            {canCreate && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(true)}
                className="py-5 rounded-sm mb-4"
              >
                {selectedRole
                  ? t("roles.duplicate", { defaultValue: "Duplicate" })
                  : t("roles.new", { defaultValue: "New role" })}
              </Button>
            )}
          </div>

          {!selectedRole ? (
            <p className="text-sm text-cocoa-500">
              {t("roles.chooseHint", {
                defaultValue: "Choose a role to view or edit its permissions.",
              })}
            </p>
          ) : (
            <>
              {isBuiltIn && (
                <p className="rounded-md bg-cocoa-50 px-3 py-2 text-sm text-cocoa-700">
                  {t("roles.builtInNotice", {
                    defaultValue:
                      "Built-in roles can’t be edited. Duplicate this role to make a version with different permissions.",
                  })}
                </p>
              )}

              <Field
                label={t("roles.descriptionLabel", {
                  defaultValue: "Description",
                })}
                htmlFor="role-description"
              >
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <FileText className="text-muted-foreground" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="role-description"
                    maxLength={255}
                    disabled={isBuiltIn || !canUpdate}
                    {...register("description")}
                  />
                </InputGroup>
              </Field>

              <Controller
                name="permissions"
                control={control}
                render={({ field }) => (
                  <PermissionMatrix
                    selected={field.value}
                    onChange={
                      isBuiltIn || !canUpdate ? undefined : field.onChange
                    }
                  />
                )}
              />

              {serverError && (
                <p role="alert" className="text-sm text-destructive">
                  {serverError}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cocoa-100 pt-4">
                <p className="text-sm text-cocoa-500">
                  {t("roles.selectedCount", {
                    selected: permissions.length,
                    total: PERMISSION_TOTAL,
                    defaultValue:
                      "{{selected}} of {{total}} permissions selected",
                  })}
                </p>
                {!isBuiltIn && (canUpdate || canDelete) && (
                  <div className="flex gap-2">
                    {canDelete && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDelete}
                        disabled={isSubmitting || deleteRole.isPending}
                      >
                        {t("common.delete", { defaultValue: "Delete" })}
                      </Button>
                    )}
                    {canUpdate && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => load(selectedRole)}
                          disabled={!hasChanges || isSubmitting}
                        >
                          {t("common.reset", { defaultValue: "Reset" })}
                        </Button>
                        <Button
                          type="submit"
                          disabled={!canSave || isSubmitting}
                        >
                          {isSubmitting && <Loader />}
                          {t("common.save")}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </form>
      )}
      </div>
      </PageSkeleton>

      <NewRoleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        source={selectedRole}
        onCreated={(role) => {
          load(role);
          setDialogOpen(false);
        }}
      />
    </div>
  );
}

interface NewRoleFormValues {
  name: string;
  description: string;
}

/**
 * Creates a role, optionally copying the permissions of `source` (Duplicate).
 * The form is mounted only while the dialog is open, so it starts fresh each time.
 */
function NewRoleDialog({
  open,
  onOpenChange,
  source,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: RoleResponse | undefined;
  onCreated: (role: RoleResponse) => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {source
              ? t("roles.duplicateTitle", { defaultValue: "Duplicate role" })
              : t("roles.newTitle", { defaultValue: "New role" })}
          </DialogTitle>
          <DialogDescription>
            {source
              ? t("roles.duplicateDescription", {
                  name: source.name,
                  defaultValue:
                    "Starts with the permissions of {{name}}. You can change them after creating it.",
                })
              : t("roles.newDescription", {
                  defaultValue:
                    "Starts with no permissions. Tick what the role needs after creating it.",
                })}
          </DialogDescription>
        </DialogHeader>
        <NewRoleForm
          source={source}
          onCancel={() => onOpenChange(false)}
          onCreated={onCreated}
        />
      </DialogContent>
    </Dialog>
  );
}

function NewRoleForm({
  source,
  onCancel,
  onCreated,
}: {
  source: RoleResponse | undefined;
  onCancel: () => void;
  onCreated: (role: RoleResponse) => void;
}) {
  const { t } = useTranslation();
  const rules = useFieldRules();
  const createRole = useCreateRole();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isValid, isSubmitting },
  } = useForm<NewRoleFormValues>({
    mode: "onChange",
    defaultValues: { name: "", description: source ? describeRole(source, t) : "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root.serverError");
    try {
      const created = await createRole.mutateAsync({
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        permissions: source?.permissions ?? [],
      });
      onCreated(created);
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
  // While saving: loader on the submit button, Cancel disabled, dialog locked.
  const pending = isSubmitting || createRole.isPending;
  useDialogBusy(pending);

  return (
    <form onSubmit={onSubmit} className="grid gap-1">
      <Field
        label={t("roles.name", { defaultValue: "Name" })}
        htmlFor="new-role-name"
        required
        error={errors.name?.message}
      >
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <ShieldCheck className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            id="new-role-name"
            maxLength={64}
            placeholder={t("roles.namePlaceholder", {
              defaultValue: "e.g. Admin – Finance",
            })}
            required
            aria-invalid={Boolean(errors.name)}
            {...register("name", rules.name())}
          />
        </InputGroup>
      </Field>
      <Field
        label={t("roles.descriptionLabel", { defaultValue: "Description" })}
        htmlFor="new-role-description"
      >
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <FileText className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            id="new-role-description"
            maxLength={255}
            {...register("description")}
          />
        </InputGroup>
      </Field>
      {serverError && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {serverError}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          {t("common.cancel")}
        </Button>
        <SubmitButton pending={pending} disabled={!isValid}>
          {t("common.actions.create")}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}
