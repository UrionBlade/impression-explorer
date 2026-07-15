import { Reveal } from "../atoms/Reveal";
import { UsChoropleth } from "./UsChoropleth";
import { useI18n } from "../../i18n";

export function MapSection() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <Reveal>
        <h2 className="font-serif text-2xl font-semibold text-ink">{t("section.map.title")}</h2>
        <p className="mt-1 max-w-md text-sm text-muted">{t("section.map.body")}</p>
      </Reveal>
      <div className="mt-6">
        <UsChoropleth />
      </div>
    </section>
  );
}
