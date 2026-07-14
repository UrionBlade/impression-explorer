import { Switch } from "@ark-ui/react/switch";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "../../theme";
import { useI18n } from "../../i18n";

/** Light/dark switch built on Ark UI's headless Switch. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const dark = theme === "dark";
  return (
    <Switch.Root
      checked={dark}
      onCheckedChange={(details) => setTheme(details.checked ? "dark" : "light")}
      aria-label={t("nav.theme")}
      className="inline-flex items-center"
    >
      <Switch.Control className="flex h-8 w-14 items-center rounded-full border border-line bg-surface px-1">
        <Switch.Thumb className="grid size-6 place-items-center rounded-full bg-accent text-canvas transition-transform duration-300 data-[state=checked]:translate-x-6">
          {dark ? <MoonIcon size={14} weight="fill" /> : <SunIcon size={14} weight="fill" />}
        </Switch.Thumb>
      </Switch.Control>
      <Switch.HiddenInput />
    </Switch.Root>
  );
}
