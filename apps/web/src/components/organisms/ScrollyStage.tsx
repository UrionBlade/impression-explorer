import { Reveal } from "../atoms/Reveal";
import { CountUp } from "../atoms/CountUp";
import { UsChoropleth } from "./UsChoropleth";
import { HourChart } from "./HourChart";
import { DeviceChart } from "./DeviceChart";
import { BlackFridayChart } from "./BlackFridayChart";
import { useI18n } from "../../i18n";
import { formatNumber } from "../../format";
import { useImpressionsByState } from "../../api/impressions";
import { useTopDevices, useBlackFriday } from "../../api/metrics";

export function ScrollyStage() {
  const { t, locale } = useI18n();
  const byState = useImpressionsByState();
  const byDevice = useTopDevices();
  const byBlackFriday = useBlackFriday();

  // Intro figures are derived from the same (cached) metric endpoints the charts
  // read — never hard-coded, so they track whatever dataset is actually loaded.
  const impressions = byState.data?.total ?? 0;
  const stats = [
    { value: impressions, label: t("stats.impressions") },
    { value: byState.data?.states.length ?? 0, label: t("stats.states") },
    { value: byDevice.data?.totalDevices ?? 0, label: t("stats.devices") },
    { value: byBlackFriday.data?.length ?? 0, label: t("stats.years") },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-6 sm:px-10 2xl:max-w-[110rem] min-[2560px]:max-w-[150rem]">
      {/* Intro */}
      <Reveal>
        <div className="pt-16 sm:pt-24">
          <h1 className="max-w-4xl font-serif font-semibold leading-[1.0] tracking-tight text-ink text-[clamp(2.75rem,7vw,9rem)]">
            {t("hero.title")}
          </h1>
          <p className="mt-8 max-w-xl text-muted text-[clamp(1.1rem,1.4vw,1.7rem)]">
            {t("hero.lead", { count: formatNumber(impressions, locale) })}
          </p>
          <div className="mt-12 flex flex-wrap gap-x-14 gap-y-6 border-t border-line pt-8">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-serif font-semibold tabular-nums text-ink text-[clamp(2rem,3vw,3.75rem)]">
                  <CountUp value={s.value} />
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Sticky map + the metrics revealing one by one alongside it. */}
      <div className="mt-16 md:grid md:grid-cols-[1.25fr_0.9fr] md:items-start md:gap-14">
        <div className="md:sticky md:top-0 md:flex md:h-dvh md:items-center">
          <div className="w-full">
            <Reveal>
              <h2 className="mb-4 font-serif font-semibold tracking-tight text-ink text-[clamp(1.6rem,2.4vw,3rem)]">
                {t("section.map.title")}
              </h2>
            </Reveal>
            <UsChoropleth />
          </div>
        </div>

        <div className="mt-16 space-y-[14vh] md:mt-0 md:space-y-[22vh] md:py-[24vh]">
          <Reveal>
            <HourChart />
          </Reveal>
          <Reveal>
            <DeviceChart />
          </Reveal>
          <Reveal>
            <BlackFridayChart />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
