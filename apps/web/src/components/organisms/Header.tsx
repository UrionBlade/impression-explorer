import { LogoMark } from "../atoms/LogoMark";
import { ThemeToggle } from "../molecules/ThemeToggle";
import { LanguageSwitcher } from "../molecules/LanguageSwitcher";
import { useI18n } from "../../i18n";

export function Header() {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-canvas/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 sm:px-10 2xl:max-w-[100rem] min-[2560px]:max-w-[132rem]">
        <div className="flex items-center gap-2.5">
          <LogoMark className="size-7" />
          <span className="font-serif text-lg font-semibold text-ink">{t("app.title")}</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
