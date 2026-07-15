import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import en from "./locales/en.json";
import it from "./locales/it.json";

export type Locale = "en" | "it";

export const LOCALES: Locale[] = ["en", "it"];

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "it";
}

/**
 * Language follows the browser's preference order: the first supported language
 * in `navigator.languages` wins; English if none is supported.
 */
export function detectLocale(): Locale {
  const preferences = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const pref of preferences) {
    const lower = (pref || "").toLowerCase();
    if (lower.startsWith("it")) return "it";
    if (lower.startsWith("en")) return "en";
  }
  return "en";
}

const catalogs: Record<Locale, Record<string, string>> = { en, it };

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Translate a key; interpolates `{name}` placeholders. Falls back to English, then the key. */
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

/** Locale comes from the route (`/it`, `/en`); switching navigates to the other route. */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute("lang", locale);
  }, [locale]);

  const t: I18nContextValue["t"] = (key, vars) => {
    let s = catalogs[locale][key] ?? catalogs.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    }
    return s;
  };

  const setLocale = (l: Locale) => navigate(`/${l}`);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}
