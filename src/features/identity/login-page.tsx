import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, useWatch } from "react-hook-form";
import { Lock, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { notifyError } from "@/lib/toast";
import { loginFailureKey } from "@/features/identity/login-error";
import { useAuth } from "@/shared/hooks/useAuth";
import { AppLogo } from "@/shared/layout/app-logo";
import Loader from "@/components/loader";
import { useUiFlag } from "@/store/ui-store";
import { SessionExpiredNotice } from "@/features/identity/session-expired-notice";
import { useCameFromSessionExpiry } from "@/features/identity/use-came-from-session-expiry";
import { meetsPasswordPolicy } from "@/constants";
import { PasswordRequirements } from "@/components/password-requirements";
import { PasswordToggleButton } from "@/components/password-toggle-button";

type LoginFormValues = {
  username: string;
  password: string;
};

const SHOW_PASSWORD_KEY = "login.showPassword";
const PASSWORD_RULES_ID = "password-rules";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  // Arriving from an accepted invitation: the username is already known.
  const [params] = useSearchParams();

  const sessionExpired = useCameFromSessionExpiry();

  const {
    value: showPassword,
    toggle: togglePassword,
    set: setShowPassword,
  } = useUiFlag(SHOW_PASSWORD_KEY, {
    resetOnUnmount: true,
  });

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    clearErrors,
    setFocus,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LoginFormValues>({
    mode: "onChange",
    defaultValues: { username: params.get("username") ?? "", password: "" },
  });

  const password = useWatch({ control, name: "password" });
  const showPasswordRules =
    password.length > 0 && !meetsPasswordPolicy(password);

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root.serverError");
    try {
      await login(values);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = t(loginFailureKey(error));
      notifyError(message);
      reset();
      setShowPassword(false);
      setError("root.serverError", { type: "server", message });
      setFocus("username");
    }
  });

  const serverError = errors.root?.serverError?.message;

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-cocoa-100 bg-white p-6 shadow-sm sm:p-8"
        >
          <AppLogo className="mb-6 py-2" showName={false} />

          {sessionExpired && <SessionExpiredNotice />}

          <p className="mb-6 text-center text-sm text-cocoa-500">
            {t("login.subtitle")}
          </p>

          <Field label={t("login.username")} htmlFor="username" required>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <UserRound className="text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                id="username"
                placeholder="e.g. john.doe"
                autoComplete="username"
                required
                {...register("username", {
                  required: true,
                  validate: (value) => value.trim().length > 0,
                })}
                className="ml-1 rounded-sm"
              />
            </InputGroup>
          </Field>

          <Field label={t("login.password")} htmlFor="password" required>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <Lock className="text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="*  *  *  *  *  *  *  *  *"
                autoComplete="current-password"
                required
                aria-invalid={showPasswordRules}
                aria-describedby={
                  showPasswordRules ? PASSWORD_RULES_ID : undefined
                }
                {...register("password", {
                  required: true,
                  validate: meetsPasswordPolicy,
                })}
                className="rounded-sm"
              />
              <InputGroupAddon align="inline-end">
                <PasswordToggleButton
                  visible={showPassword}
                  onToggle={togglePassword}
                  controls="password"
                />
              </InputGroupAddon>
            </InputGroup>
          </Field>

          {showPasswordRules && (
            <PasswordRequirements id={PASSWORD_RULES_ID} value={password} />
          )}

          {serverError && (
            <p
              role="alert"
              className="mb-4 rounded-md bg-rust-100 px-3 py-2 text-sm text-rust-700"
            >
              { serverError }
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !isValid}
          >
            {isSubmitting ? (
              <span className="flex gap-x-3">
                <Loader />
                {t("login.signingIn")}
              </span>
            ) : (
              t("login.signIn")
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
