import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PASSWORD_RULES } from "@/constants";

export function PasswordRequirements({
  value,
  id,
}: {
  value: string;
  id?: string;
}) {
  const { t } = useTranslation();

  return (
    <ul id={id} className="mb-4 space-y-1 text-xs">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value);
        return (
          <li
            key={rule.key}
            className={`flex items-center gap-1.5 ${
              met ? "text-pod-700" : "text-rust-700"
            }`}
          >
            {met ? (
              <Check className="size-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <X className="size-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>{t(rule.labelKey, { defaultValue: rule.defaultLabel })}</span>
            <span className="sr-only">
              {met
                ? t("password.rules.met", { defaultValue: "met" })
                : t("password.rules.unmet", { defaultValue: "not met" })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}