import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { motion } from "framer-motion";
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
  cx: number;
  cy: number;
}

function project(map: FeatureCollection | undefined): Shape[] {
  if (!map) return [];
  const projection = geoAlbersUsa().fitSize([W, H], map);
  const path = geoPath(projection);
  return map.features.map((f) => {
    const [cx, cy] = path.centroid(f);
    return {
      name: String((f.properties as Record<string, unknown>)?.level1 ?? ""),
      d: path(f) ?? "",
      cx,
      cy,
    };
  });
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
  // Densest state derived client-side, so the default readout doesn't depend on
  // the endpoint's result ordering.
  const topState = useMemo(() => {
    let name: string | null = null;
    let max = -1;
    for (const [state, count] of counts) {
      if (count > max) {
        max = count;
        name = state;
      }
    }
    return name;
  }, [counts]);
  const [active, setActive] = useState<string | null>(null);

  // Reduced-motion aware entrance. GSAP owns the paths' opacity end to end (the
  // paths carry no opacity in their React style), and useLayoutEffect sets the
  // start value before paint so there's no flash and nothing for React to fight.
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || shapes.length === 0) return;
    const paths = svg.querySelectorAll<SVGPathElement>("path[data-state]");
    if (reduced) {
      gsap.set(paths, { opacity: 1 });
      return;
    }
    gsap.set(paths, { opacity: 0 });
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
  // Default the readout to the densest state; hover overrides it.
  const shown = active ?? topState;
  const shownCount = shown ? (counts.get(shown) ?? 0) : null;
  const fillFor = (name: string) => {
    const c = counts.get(name);
    return data.isPending || c == null ? scale.noData : scale.colorFor(c);
  };
  const activeShape = active ? shapes.find((s) => s.name === active) : undefined;

  return (
    <figure className="m-0">
      <div className="relative">
        {/* Visual/pointer affordance; the sr-only table below is its accessible twin. */}
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden="true">
          {shapes.map((s) => (
            <path
              key={s.name}
              data-state
              d={s.d}
              fill={fillFor(s.name)}
              stroke="var(--canvas)"
              strokeWidth={0.5}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setActive(s.name)}
              onMouseLeave={() => setActive((a) => (a === s.name ? null : a))}
            />
          ))}

          {/* Hovered/focused state, lifted and zoomed above the rest. */}
          {activeShape && (
            <motion.path
              key={activeShape.name}
              d={activeShape.d}
              fill={fillFor(activeShape.name)}
              stroke="var(--ink)"
              strokeWidth={1}
              className="pointer-events-none"
              style={{
                transformBox: "fill-box",
                transformOrigin: "center",
                filter: "drop-shadow(0 6px 14px rgba(10,15,30,0.45))",
              }}
              initial={reduced ? false : { scale: 1, opacity: 0.7 }}
              animate={{ scale: 1.08, opacity: 1 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </svg>

        {/* Detail readout — the densest state by default, updated on hover/focus. */}
        <div className="pointer-events-none absolute right-2 top-2 min-w-40 rounded-xl border border-line bg-surface/90 px-4 py-3 backdrop-blur">
          {shown ? (
            <>
              {!active && (
                <div className="text-[10px] uppercase tracking-wider text-muted">
                  {t("map.densest")}
                </div>
              )}
              <div className="text-sm font-semibold text-ink">{shown}</div>
              <div className="mt-0.5 font-serif text-2xl tabular-nums text-accent">
                {formatNumber(shownCount ?? 0, locale)}
              </div>
              <div className="text-xs text-muted">
                {total > 0 ? `${(((shownCount ?? 0) / total) * 100).toFixed(1)}%` : "—"}
              </div>
            </>
          ) : (
            <div className="text-xs text-muted">{t("map.loading")}</div>
          )}
        </div>
      </div>

      {/* Accessible equivalent of the choropleth for screen readers. */}
      <table className="sr-only">
        <caption>{t("section.map.title")}</caption>
        <thead>
          <tr>
            <th>{t("map.colState")}</th>
            <th>{t("map.colImpressions")}</th>
          </tr>
        </thead>
        <tbody>
          {(data.data?.states ?? []).map((s) => (
            <tr key={s.state}>
              <td>{s.state}</td>
              <td>{formatNumber(s.count, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>

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
