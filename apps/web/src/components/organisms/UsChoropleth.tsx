import { useEffect, useMemo, useRef, useState } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import gsap from "gsap";
import type { FeatureCollection } from "geojson";
import { useImpressionsByState } from "../../api/impressions";
import { useUsMap } from "../../api/usMap";
import { makeScale } from "../../lib/choropleth";
import { useTheme } from "../../theme";
import { useI18n } from "../../i18n";
import { useReducedMotion } from "../../motion";
import { formatNumber } from "../../format";
import { MapLegend } from "../molecules/MapLegend";

const W = 975;
const H = 610;

interface Shape {
  name: string;
  d: string;
}

function project(map: FeatureCollection | undefined): Shape[] {
  if (!map) return [];
  const projection = geoAlbersUsa().fitSize([W, H], map);
  const path = geoPath(projection);
  return map.features.map((f) => ({
    name: String((f.properties as Record<string, unknown>)?.level1 ?? ""),
    d: path(f) ?? "",
  }));
}

export function UsChoropleth() {
  const { theme } = useTheme();
  const { t, locale } = useI18n();
  const reduced = useReducedMotion();
  const map = useUsMap();
  const data = useImpressionsByState();
  const svgRef = useRef<SVGSVGElement>(null);

  const shapes = useMemo(() => project(map.data), [map.data]);
  const counts = useMemo(
    () => new Map((data.data?.states ?? []).map((s) => [s.state, s.count])),
    [data.data],
  );
  const scale = useMemo(() => makeScale([...counts.values()], theme), [counts, theme]);
  const [active, setActive] = useState<string | null>(null);

  // Reduced-motion aware entrance: stagger the states in.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || shapes.length === 0) return;
    const paths = svg.querySelectorAll("path");
    if (reduced) {
      gsap.set(paths, { opacity: 1 });
      return;
    }
    const tween = gsap.to(paths, { opacity: 1, duration: 0.5, ease: "power1.out", stagger: 0.006 });
    return () => {
      tween.kill();
    };
  }, [shapes, reduced]);

  if (map.isError || data.isError) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-surface/60 p-6">
        <p className="text-sm text-muted">{t("map.error")}</p>
        <button
          type="button"
          onClick={() => {
            void map.refetch();
            void data.refetch();
          }}
          className="rounded-full border border-line px-4 py-1.5 text-sm font-medium text-ink transition-colors hover:border-accent"
        >
          {t("map.retry")}
        </button>
      </div>
    );
  }

  const total = data.data?.total ?? 0;
  const activeCount = active ? (counts.get(active) ?? 0) : null;

  return (
    <figure className="m-0">
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="group"
          aria-label={t("section.map.title")}
        >
          {shapes.map((s) => {
            const c = counts.get(s.name);
            const fill = data.isPending ? scale.noData : c == null ? scale.noData : scale.colorFor(c);
            return (
              <path
                key={s.name}
                d={s.d}
                fill={fill}
                stroke="var(--canvas)"
                strokeWidth={active === s.name ? 1.5 : 0.5}
                style={{ opacity: reduced ? 1 : 0, cursor: "pointer", outline: "none" }}
                tabIndex={0}
                role="img"
                aria-label={`${s.name}: ${formatNumber(c ?? 0, locale)}`}
                onMouseEnter={() => setActive(s.name)}
                onMouseLeave={() => setActive((a) => (a === s.name ? null : a))}
                onFocus={() => setActive(s.name)}
                onBlur={() => setActive((a) => (a === s.name ? null : a))}
              />
            );
          })}
        </svg>

        {/* Accessible detail readout — updates on hover and keyboard focus. */}
        <div className="pointer-events-none absolute right-2 top-2 min-w-40 rounded-xl border border-line bg-surface/90 px-4 py-3 backdrop-blur">
          {active ? (
            <>
              <div className="text-sm font-semibold text-ink">{active}</div>
              <div className="mt-0.5 font-serif text-2xl tabular-nums text-accent">
                {formatNumber(activeCount ?? 0, locale)}
              </div>
              <div className="text-xs text-muted">
                {total > 0 ? `${(((activeCount ?? 0) / total) * 100).toFixed(1)}%` : "—"}
              </div>
            </>
          ) : (
            <div className="text-xs text-muted">{t("map.hint")}</div>
          )}
        </div>
      </div>

      <figcaption className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <MapLegend scale={scale} loading={data.isPending} />
        {data.data && (
          <span className="text-xs text-muted">
            {t("map.unattributed", { count: formatNumber(data.data.unattributed, locale) })}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
