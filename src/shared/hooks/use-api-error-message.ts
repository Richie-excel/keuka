import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { apiErrorMessage } from "@/lib/api-error-message";


export function useApiErrorMessage(error: unknown): string | undefined {
  const { i18n } = useTranslation();

  return useMemo(
    () => (error === null || error === undefined ? undefined : apiErrorMessage(error)),
    [error, i18n.language],
  );
}
