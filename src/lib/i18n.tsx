import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type Language = "en" | "fr";

/** Passthrough wrapper — i18n is initialized in `main.tsx` via `./i18n`. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** Bridge for legacy `t(key, fallback)` and `language` + inline `tr(en, fr)`. */
export function useLanguage() {
  const { t: i18nT, i18n } = useTranslation();
  const language: Language = i18n.language.startsWith("fr") ? "fr" : "en";
  const t = (key: string, fallback?: string) =>
    String(i18nT(key, { defaultValue: fallback !== undefined ? fallback : key }));
  return { language, t };
}
