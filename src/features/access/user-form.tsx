import { useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { EmployeeTypeBadge, RoleBadge } from "@/components/role-badge";
import type { AvailableEmployee, CreateUserRequest } from "@/interfaces";
import { PermissionKey } from "@/enums";
import { hasChanged } from "@/lib/utils";
import { usersApi } from "@/api/users";
import { useAuth } from "@/shared/hooks/useAuth";
import { useFieldRules } from "@/shared/hooks/use-field-rules";
import { useRoles } from "@/shared/hooks/use-roles";
import { useAvailableEmployees } from "@/shared/hooks/use-users";
import {
  fallbackRoleOptions,
  isPlatformActor,
  roleOptions,
} from "@/features/access/assignable-roles";
import { meetsPasswordPolicy } from "@/constants";
import { PasswordRequirements } from "@/components/password-requirements";
import { PasswordToggleButton } from "@/components/password-toggle-button";
import { Field } from "@/components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { useDialogBusy } from "@/components/ui/dialog-busy";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { KeyRound, Lock, Mail, MailCheck, User, UserRound } from "lucide-react";

interface UserFormProps {
  user: CreateUserRequest | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (values: CreateUserRequest) => Promise<void>;
}

interface UserFormValues {
  username: string;
  fullName: string;
  email: string;
  employeeId: string;
  roles: string[];
  /** Platform admin only; empty: no password is set (an invitation is emailed on create). */
  temporaryPassword: string;
}

const TEMP_PASSWORD_RULES_ID = "user-temporary-password-rules";

const notBlank = (value: string) => value.trim().length > 0;

function toggleRole(current: string[], role: string, checked: boolean) {
  if (checked) return current.includes(role) ? current : [...current, role];
  return current.filter((currentRole) => currentRole !== role);
}

/**
 * Creates or edits a sign-in.
 *
 * A company's accounts are its employees' sign-ins: on create, the boss picks
 * the employee, and their name, email, the role their job suggests and a
 * username (first name + warehouse code) are filled in, all still editable.
 * Normally there is no password: the server emails the person an invitation to
 * choose their own, which also proves the email address is theirs. The platform
 * admin may instead set a temporary password (when the email does not reach the
 * person), on create or later; the person must replace it at their first sign-in.
 */
export function UserForm({ user, saving, onCancel, onSave }: UserFormProps) {
  const { t } = useTranslation();
  const { user: actor } = useAuth();
  const rolesQuery = useRoles({
    enabled: Boolean(actor?.permissions.includes(PermissionKey.ROLE_READ)),
  });
  const isEdit = Boolean(user);
  // The platform operator has no company and so no employees to pick from.
  const picksEmployee = !isEdit && Boolean(actor?.enterpriseId);
  const employeesQuery = useAvailableEmployees(picksEmployee);
  const setsPassword = isPlatformActor(actor);
  const [showPassword, setShowPassword] = useState(false);
  const rules = useFieldRules();
  const currentRoles = user?.roles ?? [];
  const catalogue = rolesQuery.data ?? [];
  const options = catalogue.length
    ? roleOptions(catalogue, actor, currentRoles)
    : fallbackRoleOptions(actor, currentRoles);
  // The username last filled in for an employee: replaced when another one is
  // picked, but never once the boss typed their own.
  const proposedUsername = useRef("");

  const {
    register,
    control,
    handleSubmit,
    clearErrors,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isValid },
  } = useForm<UserFormValues>({
    mode: "onChange",
    defaultValues: {
      username: user?.username ?? "",
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
      employeeId: user?.employeeId ?? "",
      roles: user?.roles ?? [],
      temporaryPassword: "",
    },
  });

  const [fullName, email, roles, temporaryPassword] = useWatch({
    control,
    name: ["fullName", "email", "roles", "temporaryPassword"],
  });

  const hasChanges =
    !user || hasChanged(user, { fullName, email, roles }) || temporaryPassword !== "";

  // While saving: loader on the submit button, Cancel disabled, dialog locked.
  const pending = saving || isSubmitting;
  useDialogBusy(pending);

  async function pickEmployee(employee: AvailableEmployee) {
    const fill = { shouldValidate: true, shouldDirty: true };
    setValue("fullName", employee.fullName, fill);
    if (employee.email) setValue("email", employee.email, fill);
    const role = employee.suggestedRole;
    if (role && options.some((option) => option.name === role && !option.locked)) {
      setValue("roles", [role], fill);
    }
    try {
      const username = await usersApi.suggestUsername(employee.fullName);
      const typed = getValues("username");
      if (typed === "" || typed === proposedUsername.current) {
        proposedUsername.current = username;
        setValue("username", username, fill);
      }
    } catch {
      // No suggestion: the boss types one.
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root.serverError");
    try {
      await onSave({
        username: (user?.username ?? values.username).trim(),
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        roles: values.roles,
        employeeId: values.employeeId || undefined,
        ...(values.temporaryPassword
          ? { password: values.temporaryPassword, temporaryPassword: true }
          : {}),
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

  const serverError = errors.root?.serverError?.message;
  const employees = employeesQuery.data ?? [];

  return (
    <form onSubmit={onSubmit} className="grid gap-1 hide-scrollbar">
      {picksEmployee && (
        <Field
          label={t("users.employee")}
          htmlFor="user-employee"
          required
          hint={
            employeesQuery.isSuccess && employees.length === 0
              ? t("users.noEmployeesAvailable")
              : t("users.employeeHint")
          }
        >
          <Controller
            name="employeeId"
            control={control}
            rules={{ required: picksEmployee }}
            render={({ field }) => (
              <Select
                value={field.value}
                disabled={employeesQuery.isPending || employees.length === 0}
                onValueChange={(id) => {
                  field.onChange(id);
                  const employee = employees.find((candidate) => candidate.id === id);
                  if (employee) void pickEmployee(employee);
                }}
              >
                <SelectTrigger id="user-employee" className="w-full">
                  <SelectValue placeholder={t("users.employeePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <span className="flex items-center gap-2">
                        {employee.fullName}
                        <EmployeeTypeBadge type={employee.employeeType} />
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      )}

      <div className="grid sm:grid-cols-2 gap-x-3">
        <Field
          label={t("users.fullName")}
          htmlFor="user-full-name"
          required
          error={errors.fullName?.message}
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <User />
            </InputGroupAddon>
            <InputGroupInput
              id="user-full-name"
              maxLength={160}
              required
              aria-invalid={Boolean(errors.fullName)}
              {...register("fullName", rules.name())}
            />
          </InputGroup>
        </Field>
        <Field
          label={t("users.username")}
          htmlFor="user-username"
          required
          hint={picksEmployee ? t("users.usernameHint") : undefined}
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <UserRound />
            </InputGroupAddon>
            <InputGroupInput
              id="user-username"
              autoComplete="off"
              maxLength={80}
              required
              {...register("username", {
                required: true,
                validate: notBlank,
                disabled: isEdit,
              })}
            />
          </InputGroup>
        </Field>
      </div>

      <Field
        label={t("users.email")}
        htmlFor="user-email"
        required
        error={errors.email?.message}
      >
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <Mail />
          </InputGroupAddon>
          <InputGroupInput
            id="user-email"
            type="email"
            placeholder={t("validation.emailPlaceholder")}
            autoComplete="off"
            maxLength={254}
            required
            aria-invalid={Boolean(errors.email)}
            {...register("email", rules.email())}
          />
        </InputGroup>
      </Field>

      {setsPassword && (
        <Field
          label={t("users.temporaryPassword")}
          htmlFor="user-temporary-password"
          hint={t(isEdit ? "users.temporaryPasswordEditHint" : "users.temporaryPasswordHint")}
          error={
            errors.temporaryPassword ? t("users.temporaryPasswordInvalid") : undefined
          }
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Lock />
            </InputGroupAddon>
            <InputGroupInput
              id="user-temporary-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              maxLength={72}
              aria-describedby={temporaryPassword ? TEMP_PASSWORD_RULES_ID : undefined}
              aria-invalid={Boolean(errors.temporaryPassword)}
              {...register("temporaryPassword", {
                validate: (value) => value === "" || meetsPasswordPolicy(value),
              })}
            />
            <InputGroupAddon align="inline-end">
              <PasswordToggleButton
                visible={showPassword}
                onToggle={() => setShowPassword((shown) => !shown)}
                controls="user-temporary-password"
              />
            </InputGroupAddon>
          </InputGroup>
          {temporaryPassword && (
            <PasswordRequirements id={TEMP_PASSWORD_RULES_ID} value={temporaryPassword} />
          )}
        </Field>
      )}

      {temporaryPassword ? (
        <p className="mb-3 flex items-start gap-2 rounded-md bg-cocoa-50 px-3 py-2 text-xs text-cocoa-700">
          <KeyRound className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {t("users.temporaryPasswordNotice")}
        </p>
      ) : (
        !isEdit && (
          <p className="mb-3 flex items-start gap-2 rounded-md bg-cocoa-50 px-3 py-2 text-xs text-cocoa-700">
            <MailCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {t("users.invitationNotice")}
          </p>
        )
      )}

      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-medium text-cocoa-700">
          {t("users.roles")} *
        </legend>
        <Controller
          name="roles"
          control={control}
          rules={{ validate: (value) => value.length > 0 }}
          render={({ field }) => (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                {options.map((option) => (
                  <Label
                    key={option.name}
                    className={
                      option.locked
                        ? "flex items-center gap-2 font-normal opacity-70"
                        : "flex items-center gap-2 font-normal hover:cursor-pointer"
                    }
                  >
                    <Checkbox
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
                      className="hover:cursor-pointer"
                    />
                    <RoleBadge role={option.name} />
                  </Label>
                ))}
              </div>
              {field.value.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("users.rolesRequired")}
                </p>
              )}
            </>
          )}
        />
      </fieldset>
      {serverError && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {serverError}
        </p>
      )}
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={pending}
          className="order-2"
        >
          {t("common.cancel")}
        </Button>
        <SubmitButton
          pending={pending}
          disabled={!isValid || !hasChanges}
          className="order-1 px-8"
        >
          {isEdit ? t("common.save") : t("common.actions.create")}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}
