import { Reveal } from "../atoms/Reveal";
import { StatCard } from "../molecules/StatCard";
import { useI18n } from "../../i18n";
import { formatNumber } from "../../format";

const IMPRESSIONS = 200000;
const STATES = 51;
const DEVICES = 7968;
const YEARS = 7;

export function Hero() {
  const { t, locale } = useI18n();
  return (
    <section className="mx-auto max-w-5xl px-6 pb-12 pt-16 sm:pt-24">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-4 max-w-2xl font-serif text-4xl font-semibold leading-tight text-ink sm:text-6xl">
          {t("hero.title")}
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
          {t("hero.lead", { count: formatNumber(IMPRESSIONS, locale) })}
        </p>
      </Reveal>

      <Reveal delay={0.15} className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard value={IMPRESSIONS} label={t("stats.impressions")} />
        <StatCard value={STATES} label={t("stats.states")} />
        <StatCard value={DEVICES} label={t("stats.devices")} />
        <StatCard value={YEARS} label={t("stats.years")} />
      </Reveal>
    </section>
  );
}
