import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

export function PasswordToggleButton({
  visible,
  onToggle,
  controls,
}: {
  visible: boolean;
  onToggle: () => void;
  controls?: string;
}) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={
        visible
          ? t("password.hide", { defaultValue: "Hide password" })
          : t("password.show", { defaultValue: "Show password" })
      }
      aria-pressed={visible}
      aria-controls={controls}
      className="mr-1 hover:cursor-pointer"
    >
      {visible ? (
        <EyeOff className="size-4" aria-hidden="true" />
      ) : (
        <Eye className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}