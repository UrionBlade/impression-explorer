import { useBlackFriday } from "../../api/metrics";
import { ChartCard } from "../molecules/ChartCard";
import { TrendLines, type TrendPoint } from "../atoms/TrendLines";
import { useI18n } from "../../i18n";
import { formatNumber } from "../../format";

export function BlackFridayChart() {
  const { t, locale } = useI18n();
  const query = useBlackFriday();

  const state = query.isError ? "error" : query.isPending ? "pending" : "ready";
  const fmt = (n: number) => formatNumber(n, locale);
  const data: TrendPoint[] = (query.data ?? []).map((y) => ({
    year: y.year,
    count: y.count,
    baseline: y.restOfYearDailyMean,
  }));

  return (
    <ChartCard title={t("chart.bf.title")} subtitle={t("chart.bf.subtitle")} state={state} onRetry={() => void query.refetch()}>
      <div className="mb-2 flex gap-4 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-accent" />
          {t("chart.bf.legendBf")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0 w-4 border-t border-dashed border-muted" />
          {t("chart.bf.legendBaseline")}
        </span>
      </div>
      <TrendLines
        data={data}
        format={fmt}
        ariaLabel={t("chart.bf.title")}
        readout={(p) =>
          t("chart.bf.detail", {
            year: p.year,
            count: fmt(p.count),
            mean: fmt(Math.round(p.baseline)),
            lift: p.baseline > 0 ? (p.count / p.baseline).toFixed(1) : "—",
          })
        }
      />
    </ChartCard>
  );
}
