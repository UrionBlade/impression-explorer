import type { Locale } from "./i18n";

/** Locale-aware number formatting (e.g. 1,234 vs 1.234). Never renders NaN. */
export function formatNumber(n: number, locale: Locale): string {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(locale).format(n);
}

/** Locale-aware date formatting. */
export function formatDate(
  date: Date | number,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}
