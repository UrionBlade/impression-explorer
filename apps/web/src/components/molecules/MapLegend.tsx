import type { ColorScale } from "../../lib/choropleth";
import { useI18n } from "../../i18n";
import { formatNumber } from "../../format";

/** Colour bins with their numeric ranges — so meaning never rests on colour alone. */
export function MapLegend({ scale, loading }: { scale: ColorScale; loading?: boolean }) {
  const { t, locale } = useI18n();
  return (
    <div>
      <div className="mb-1.5 text-xs uppercase tracking-wider text-muted">{t("map.legend")}</div>
      <div className="flex items-center gap-3">
        <div className="flex overflow-hidden rounded-md">
          {scale.bins.map((b, i) => (
            <span
              key={i}
              className="h-3 w-6"
              style={{ backgroundColor: loading ? scale.noData : b.color }}
              title={`${formatNumber(b.min, locale)} – ${formatNumber(b.max, locale)}`}
            />
          ))}
        </div>
        {!loading && (
          <span className="text-xs tabular-nums text-muted">
            {formatNumber(scale.bins[0].min, locale)} –{" "}
            {formatNumber(scale.bins[scale.bins.length - 1].max, locale)}
          </span>
        )}
      </div>
    </div>
  );
}
