import { NavLink } from "react-router-dom";
import { LOCALES, useI18n } from "../../i18n";

/** Route-based language switch — each option links to its `/:lang` route. */
export function LanguageSwitcher() {
  const { t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t("nav.language")}
      className="flex items-center rounded-full border border-line p-0.5 text-xs font-medium"
    >
      {LOCALES.map((l) => (
        <NavLink
          key={l}
          to={`/${l}`}
          className={({ isActive }) =>
            "rounded-full px-2.5 py-1 uppercase tracking-wide transition-colors " +
            (isActive ? "bg-accent text-canvas" : "text-muted hover:text-ink")
          }
        >
          {l}
        </NavLink>
      ))}
    </div>
  );
}
