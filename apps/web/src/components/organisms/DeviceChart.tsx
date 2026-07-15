import { useTopDevices } from "../../api/metrics";
import { ChartCard } from "../molecules/ChartCard";
import { DistributionBars, type DistributionBar } from "../atoms/DistributionBars";
import { useI18n } from "../../i18n";
import { formatNumber } from "../../format";

export function DeviceChart() {
  const { t, locale } = useI18n();
  const query = useTopDevices();

  const state = query.isError ? "error" : query.isPending ? "pending" : "ready";
  const fmt = (n: number) => formatNumber(n, locale);
  const bars: DistributionBar[] = (query.data?.buckets ?? []).map((b) => ({ label: b.label, value: b.devices }));

  return (
    <ChartCard title={t("chart.device.title")} subtitle={t("chart.device.subtitle")} state={state} onRetry={() => void query.refetch()}>
      {query.data && (
        <p className="mb-4 text-xs text-muted">
          {t("chart.device.stats", {
            mean: fmt(Math.round(query.data.meanPerDevice)),
            median: fmt(Math.round(query.data.medianPerDevice)),
            max: fmt(query.data.maxPerDevice),
            total: fmt(query.data.totalDevices),
          })}
        </p>
      )}
      <div className="mb-2 flex justify-between text-[10px] uppercase tracking-wider text-muted">
        <span>{t("chart.device.axisBucket")}</span>
        <span>{t("chart.device.axisDevices")}</span>
      </div>
      <DistributionBars bars={bars} format={fmt} ariaLabel={t("chart.device.title")} color="var(--color-cuebiq-teal)" />
    </ChartCard>
  );
}
