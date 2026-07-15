import { useState } from "react";
import { useImpressionsByHour } from "../../api/metrics";
import { ChartCard } from "../molecules/ChartCard";
import { RadialHours, type HourDatum } from "../atoms/RadialHours";
import { useI18n } from "../../i18n";
import { formatNumber } from "../../format";

type Mode = "local" | "utc";

export function HourChart() {
  const { t, locale } = useI18n();
  const query = useImpressionsByHour();
  const [mode, setMode] = useState<Mode>("local");

  const state = query.isError ? "error" : query.isPending ? "pending" : "ready";
  const series = mode === "local" ? query.data?.local : query.data?.utc;
  const data: HourDatum[] = (series ?? []).map((h) => ({ hour: h.hour, count: h.count }));

  const fmtHour = (h: number) => `${String(h).padStart(2, "0")}:00`;
  const fmt = (n: number) => formatNumber(n, locale);
  const peak = data.length ? data.reduce((a, b) => (b.count > a.count ? b : a)) : null;
  const quiet = data.length ? data.reduce((a, b) => (b.count < a.count ? b : a)) : null;

  const toggle = (
    <div
      role="group"
      aria-label={t("chart.hour.mode")}
      className="flex items-center rounded-full border border-line p-0.5 text-xs font-medium"
    >
      {(["local", "utc"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          aria-pressed={mode === m}
          className={
            "rounded-full px-3 py-1 uppercase tracking-wide transition-colors " +
            (mode === m ? "bg-accent text-canvas" : "text-muted hover:text-ink")
          }
        >
          {t(`chart.hour.${m}`)}
        </button>
      ))}
    </div>
  );

  const reading = (label: string, point: HourDatum) => (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 font-serif text-4xl font-semibold tabular-nums text-ink">{fmtHour(point.hour)}</div>
      <div className="text-sm text-muted">{fmt(point.count)}</div>
    </div>
  );

  return (
    <ChartCard
      title={t("chart.hour.title")}
      subtitle={t(mode === "local" ? "chart.hour.localNote" : "chart.hour.utcNote")}
      actions={toggle}
      state={state}
      onRetry={() => void query.refetch()}
    >
      <div className="flex flex-col items-center gap-8">
        <RadialHours data={data} format={fmt} ariaLabel={t("chart.hour.title")} readoutLabel={fmtHour} />
        <div className="flex gap-12">
          {peak && reading(t("chart.hour.peak"), peak)}
          {quiet && reading(t("chart.hour.quiet"), quiet)}
        </div>
      </div>
    </ChartCard>
  );
}
