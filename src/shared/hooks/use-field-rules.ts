import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  MIN_NAME_LENGTH,
  isValidCameroonPhone,
  isValidEmail,
  isValidIdCardNumber,
  isValidName,
} from "@/lib/validation";

/**
 * react-hook-form rules for names, emails and phones, with translated
 * messages: spread them into `register(...)` and show `errors.x?.message`
 * as the Field's `error`.
 *
 *   register("fullName", rules.name())
 *   register("email", rules.email({ required: false }))
 */
export function useFieldRules() {
  const { t } = useTranslation();

  return useMemo(() => {
    const requiredMessage = t("validation.required");
    const blankOk = (value: string, required: boolean) => !required && value.trim() === "";

    return {
      name: ({ required = true }: { required?: boolean } = {}) => ({
        required: required ? requiredMessage : false,
        validate: (value: string | undefined) =>
          blankOk(value ?? "", required) ||
          isValidName(value ?? "") ||
          t("validation.nameTooShort", { count: MIN_NAME_LENGTH }),
      }),
      email: ({ required = true }: { required?: boolean } = {}) => ({
        required: required ? requiredMessage : false,
        validate: (value: string | undefined) =>
          blankOk(value ?? "", required) || isValidEmail(value ?? "") || t("validation.emailInvalid"),
      }),
      phone: ({ required = false }: { required?: boolean } = {}) => ({
        required: required ? requiredMessage : false,
        validate: (value: string | undefined) =>
          blankOk(value ?? "", required) ||
          isValidCameroonPhone(value ?? "") ||
          t("validation.phoneInvalid"),
      }),
      /** A Cameroonian CNI number; `accept` lets an unchanged older value through on edits. */
      idCard: ({ required = true, accept }: { required?: boolean; accept?: string | null } = {}) => ({
        required: required ? requiredMessage : false,
        validate: (value: string | undefined) =>
          blankOk(value ?? "", required) ||
          (accept != null && value === accept) ||
          isValidIdCardNumber(value ?? "") ||
          t("validation.idCardInvalid"),
      }),
    };
  }, [t]);
}
