import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import en from "./locales/en.json";
import it from "./locales/it.json";

export type Locale = "en" | "it";

export const LOCALES: Locale[] = ["en", "it"];

const catalogs: Record<Locale, Record<string, string>> = { en, it };

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Translate a key; interpolates `{name}` placeholders. Falls back to English, then the key. */
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

/** Language follows the browser: Italian → it, anything else → English. */
function detectLocale(): Locale {
  const fromHtml = document.documentElement.getAttribute("lang");
  if (fromHtml === "it" || fromHtml === "en") return fromHtml;
  return (navigator.language || "en").toLowerCase().startsWith("it") ? "it" : "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  useEffect(() => {
    document.documentElement.setAttribute("lang", locale);
  }, [locale]);

  const t: I18nContextValue["t"] = (key, vars) => {
    let s = catalogs[locale][key] ?? catalogs.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replaceAll(`{${k}}`, String(v));
      }
    }
    return s;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: setLocaleState, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}
