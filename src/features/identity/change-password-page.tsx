import { useAuth } from "@/shared/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { KeyRound, Lock } from "lucide-react";
import { PageHeader } from "@/shared/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { PasswordRequirements } from "@/components/password-requirements";
import { ChangePasswordSuccess } from "@/features/identity/change-password-success";
import { useChangePassword } from "@/shared/hooks/use-session";
import { meetsPasswordPolicy } from "@/constants";
import { ApiError } from "@/lib/api-client";
import { useForm, useWatch } from "react-hook-form";
import { useUiFlag } from "@/store/ui-store";
import { PasswordToggleButton } from "@/components/password-toggle-button";
import Loader from "@/components/loader";

type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmation: string;
};

const REQUIREMENTS_ID = "new-password-requirements";
const SHOW_CURRENT_KEY = "changePassword.showCurrent";
const SHOW_NEW_KEY = "changePassword.showNew";
const SHOW_CONFIRM_KEY = "changePassword.showConfirm";

export function ChangePasswordPage() {
  const { t } = useTranslation();
  const changePassword = useChangePassword();
  const { user } = useAuth();

  const showCurrent = useUiFlag(SHOW_CURRENT_KEY, { resetOnUnmount: true });
  const showNew = useUiFlag(SHOW_NEW_KEY, { resetOnUnmount: true });
  const showConfirm = useUiFlag(SHOW_CONFIRM_KEY, { resetOnUnmount: true });

  const {
    register,
    setError,
    control,
    clearErrors,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    mode: "onChange",
    defaultValues: { currentPassword: "", newPassword: "", confirmation: "" },
  });

  const newPassword = useWatch({ control, name: "newPassword" });

  const mismatch = errors.confirmation?.type === "validate";
  const serverError = errors.root?.serverError?.message;

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root.serverError");
    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
    } catch (cause) {
      setError("root.serverError", {
        type: "server",
        message:
          cause instanceof ApiError && cause.message
            ? cause.message
            : t("errors.unexpectedDescription"),
      });
    }
  });

  if (changePassword.isSuccess) return <ChangePasswordSuccess />;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={t("changePassword.title")}
        description={t("changePassword.description")}
        icon={KeyRound}
      />

      {user?.mustChangePassword && (
        <p role="alert" className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t("changePassword.mustChangeNotice")}
        </p>
      )}

      <Card>
        <CardContent>
          <form onSubmit={onSubmit} noValidate>
            <Field
              label={t("changePassword.currentPassword")}
              htmlFor="current-password"
              required
            >
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <KeyRound className="text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  id="current-password"
                  type={showCurrent.value ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  {...register("currentPassword", { required: true })}
                />
                <InputGroupAddon align="inline-end">
                  <PasswordToggleButton
                    visible={showCurrent.value}
                    onToggle={showCurrent.toggle}
                    controls="current-password"
                  />
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <div className="grid sm:grid-cols-2 gap-x-3">
              <Field
                label={t("changePassword.newPassword")}
                htmlFor="new-password"
                required
              >
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Lock className="text-muted-foreground" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="new-password"
                    type={showNew.value ? "text" : "password"}
                    autoComplete="new-password"
                    aria-describedby={REQUIREMENTS_ID}
                    required
                    {...register("newPassword", {
                      required: true,
                      validate: meetsPasswordPolicy,
                      deps: ["confirmation"],
                    })}
                  />
                  <InputGroupAddon align="inline-end">
                    <PasswordToggleButton
                      visible={showNew.value}
                      onToggle={showNew.toggle}
                      controls="new-password"
                    />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <Field
                label={t("changePassword.confirmPassword")}
                htmlFor="confirm-password"
                required
                error={mismatch ? t("changePassword.mismatchError") : undefined}
              >
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Lock className="text-muted-foreground" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="confirm-password"
                    type={showConfirm.value ? "text" : "password"}
                    autoComplete="new-password"
                    aria-invalid={mismatch}
                    required
                    {...register("confirmation", {
                      required: true,
                      validate: (value, values) => value === values.newPassword,
                    })}
                  />
                  <InputGroupAddon align="inline-end">
                    <PasswordToggleButton
                      visible={showConfirm.value}
                      onToggle={showConfirm.toggle}
                      controls="confirm-password"
                    />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </div>

            <p className="mb-2 text-xs font-medium text-cocoa-700">
              {t("changePassword.requirementsLabel")}
            </p>
            <PasswordRequirements value={newPassword} id={REQUIREMENTS_ID} />

            {serverError && (
              <p
                role="alert"
                className="mb-4 rounded-md bg-rust-100 px-3 py-2 text-sm text-rust-700"
              >
                {serverError}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex gap-x-3">
                  <Loader />
                  {t("changePassword.submitting")}
                </div>
              ) : (
                t("changePassword.submit")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
