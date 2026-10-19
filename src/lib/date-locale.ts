import type { Locale } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";

export function useDateLocale(): Locale {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language ?? "en";
  return language.startsWith("fr") ? fr : enUS;
}