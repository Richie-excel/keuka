import { PermissionKey } from "@/enums";
// export const PASSWORD_REGEX = "^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s]).{8,}$"
export const PASSWORD_REGEX = new RegExp("^(?=.*[A-Z])(?=.*[^A-Za-z0-9\\s]).{8,}$");
export interface PasswordRule {
  key: "minLength" | "uppercase" | "special";
  labelKey: string;
  defaultLabel: string;
  test: (value: string) => boolean;
}
 
export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    key: "minLength",
    labelKey: "password.rules.minLength",
    defaultLabel: "At least 8 characters",
    test: (value) => value.length >= 8,
  },
  {
    key: "uppercase",
    labelKey: "password.rules.uppercase",
    defaultLabel: "One uppercase letter",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    key: "special",
    labelKey: "password.rules.special",
    defaultLabel: "One special character (such as ! or @)",
    test: (value) => /[^A-Za-z0-9\s]/.test(value),
  },
];
 
export const meetsPasswordPolicy = (value: string) =>
  PASSWORD_RULES.every((rule) => rule.test(value));

export const ALL_PERMISSIONS: string[] = Object.values(PermissionKey);
export const PERMISSION_TOTAL = ALL_PERMISSIONS.length;

export * from "./env";