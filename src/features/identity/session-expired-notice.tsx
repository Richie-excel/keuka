import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";

/**
 * Explains why the sign-in form is suddenly in front of the user.
 *
 * Amber, not rust: this project reserves rust for errors and discrepancies and
 * keeps amber for states that are pending or outstanding. A dropped session is
 * an action item — "sign in again" — not a fault the user caused, and the
 * palette should say so.
 *
 * The copy is the existing `sessionExpired.*` strings, the same ones
 * `session-expired-page.tsx` uses, so a user who is signed out sees identical
 * wording no matter which screen they land on. Styling follows the inline
 * error block already on this form (`rounded-md px-3 py-2`), so the notice does
 * not look bolted on.
 */
export function SessionExpiredNotice() {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      className="mb-5 flex items-start gap-2.5 rounded-md bg-amber-100 px-3 py-2.5"
    >
      <Clock
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-amber-700">
          {t("sessionExpired.title")}
        </p>
        <p className="mt-0.5 text-xs leading-5 text-amber-700">
          {t("sessionExpired.description")}
        </p>
      </div>
    </div>
  );
}
