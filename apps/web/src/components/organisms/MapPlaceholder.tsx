import { MapTrifoldIcon } from "@phosphor-icons/react";
import { Reveal } from "../atoms/Reveal";
import { useI18n } from "../../i18n";

export function MapPlaceholder() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <Reveal>
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-line bg-surface/40 px-6 py-20 text-center">
          <MapTrifoldIcon size={40} weight="duotone" className="text-accent" />
          <h2 className="font-serif text-2xl font-semibold text-ink">{t("section.map.title")}</h2>
          <p className="max-w-md text-sm text-muted">{t("section.map.body")}</p>
        </div>
      </Reveal>
    </section>
  );
}
