import { useI18n } from "../../i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-5xl px-6 py-8 text-xs text-muted">{t("footer.note")}</div>
    </footer>
  );
}
