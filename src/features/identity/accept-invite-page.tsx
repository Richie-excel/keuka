import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, useWatch } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CircleCheck, Lock, MailX } from "lucide-react";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { PasswordRequirements } from "@/components/password-requirements";
import { PasswordToggleButton } from "@/components/password-toggle-button";
import { SubmitButton } from "@/components/submit-button";
import Loader from "@/components/loader";
import { AppLogo } from "@/shared/layout/app-logo";
import { meetsPasswordPolicy } from "@/constants";
import { ApiError } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error-message";
import { formatDateTime } from "@/lib/utils";
import { invitationsApi } from "@/api/invitations";

interface AcceptFieldValues {
  password: string;
  confirm: string;
}

const RULES_ID = "invite-password-rules";

/**
 * Where an invitation email lands: the person sees whose account it is,
 * chooses a password, and can sign in. No sign-in needed to get here; the
 * token in the link is the proof, and it works once.
 */
export function AcceptInvitePage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [showPassword, setShowPassword] = useState(false);

  const invitation = useQuery({
    queryKey: ["public", "invitation", token],
    queryFn: () => invitationsApi.view(token),
    enabled: token.length > 0,
    retry: false,
    // The link is single-use: never refetch behind the person's back.
    staleTime: Infinity,
  });
  const accept = useMutation({
    mutationFn: (password: string) => invitationsApi.accept(token, password),
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<AcceptFieldValues>({
    mode: "onChange",
    defaultValues: { password: "", confirm: "" },
  });
  const password = useWatch({ control, name: "password" });
  const showRules = password.length > 0 && !meetsPasswordPolicy(password);

  const onSubmit = handleSubmit((values) => accept.mutate(values.password));

  // A used, replaced or expired link: say so plainly, and who can help.
  const expired =
    !token ||
    (invitation.error instanceof ApiError && invitation.error.status === 410) ||
    (accept.error instanceof ApiError && accept.error.status === 410);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-cocoa-100 bg-white p-6 shadow-sm sm:p-8">
        <AppLogo className="mb-6 py-2" showName={false} />

        {expired ? (
          <div className="text-center">
            <MailX className="mx-auto mb-3 size-10 text-rust-500" aria-hidden="true" />
            <h1 className="text-lg font-semibold text-cocoa-900">{t("invite.expiredTitle")}</h1>
            <p className="mt-2 text-sm text-cocoa-600">{t("invite.expiredText")}</p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/login">{t("invite.toLogin")}</Link>
            </Button>
          </div>
        ) : invitation.isPending ? (
          <div className="flex justify-center py-10">
            <Loader className="size-8" />
          </div>
        ) : invitation.isError ? (
          <p role="alert" className="rounded-md bg-rust-100 px-3 py-2 text-sm text-rust-700">
            {apiErrorMessage(invitation.error)}
          </p>
        ) : accept.isSuccess ? (
          <div className="text-center">
            <CircleCheck className="mx-auto mb-3 size-10 text-pod-500" aria-hidden="true" />
            <h1 className="text-lg font-semibold text-cocoa-900">{t("invite.doneTitle")}</h1>
            <p className="mt-2 text-sm text-cocoa-600">
              {t("invite.doneText", { username: accept.data.username })}
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to={`/login?username=${encodeURIComponent(accept.data.username)}`}>
                {t("invite.signIn")}
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-pod-500">
              {t("invite.eyebrow")}
            </p>
            <h1 className="text-xl font-semibold text-balance text-cocoa-900">
              {t("invite.title", { company: invitation.data.companyName })}
            </h1>
            <p className="mb-4 text-sm text-cocoa-600">{t("invite.intro")}</p>

            <dl className="mb-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-lg bg-cocoa-50 px-4 py-3 text-sm">
              <dt className="text-cocoa-500">{t("invite.name")}</dt>
              <dd className="min-w-0 font-medium text-cocoa-900">{invitation.data.fullName}</dd>
              <dt className="text-cocoa-500">{t("invite.username")}</dt>
              <dd className="min-w-0 font-mono text-cocoa-900">{invitation.data.username}</dd>
              <dt className="text-cocoa-500">{t("invite.email")}</dt>
              <dd className="min-w-0 break-all text-cocoa-900">{invitation.data.email}</dd>
            </dl>

            <Field label={t("invite.password")} htmlFor="invite-password" required>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Lock className="text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  id="invite-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  maxLength={72}
                  aria-invalid={showRules}
                  aria-describedby={showRules ? RULES_ID : undefined}
                  {...register("password", { required: true, validate: meetsPasswordPolicy })}
                />
                <InputGroupAddon align="inline-end">
                  <PasswordToggleButton
                    visible={showPassword}
                    onToggle={() => setShowPassword((value) => !value)}
                    controls="invite-password"
                  />
                </InputGroupAddon>
              </InputGroup>
            </Field>
            {showRules && <PasswordRequirements id={RULES_ID} value={password} />}

            <Field
              label={t("invite.confirm")}
              htmlFor="invite-confirm"
              required
              error={errors.confirm?.message}
            >
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Lock className="text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  id="invite-confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  maxLength={72}
                  aria-invalid={Boolean(errors.confirm)}
                  {...register("confirm", {
                    required: true,
                    validate: (value, values) => value === values.password || t("invite.mismatch"),
                    deps: ["password"],
                  })}
                />
              </InputGroup>
            </Field>

            {accept.isError && (
              <p role="alert" className="mb-3 rounded-md bg-rust-100 px-3 py-2 text-sm text-rust-700">
                {apiErrorMessage(accept.error)}
              </p>
            )}

            <SubmitButton pending={accept.isPending} disabled={!isValid} className="mt-2 w-full">
              {t("invite.submit")}
            </SubmitButton>
            <p className="mt-3 text-center text-xs text-cocoa-500">
              {t("invite.expires", { date: formatDateTime(invitation.data.expiresAt) })}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
