import { useRef, useState } from "react";
import { arc } from "d3-shape";
import { scaleLinear } from "d3-scale";
import { max as d3max } from "d3-array";
import { motion, useInView } from "framer-motion";
import { useReducedMotion } from "../../motion";

export interface HourDatum {
  hour: number;
  count: number;
}

const SIZE = 340;
const C = SIZE / 2;
const INNER = 74;
const OUTER = 138;
const BAND = (2 * Math.PI) / 24;

/** 24-hour radial bar chart — hours are cyclical, so a ring reads better than bars. */
export function RadialHours({
  data,
  format,
  ariaLabel,
  readoutLabel,
  color = "var(--accent)",
}: {
  data: HourDatum[];
  format: (n: number) => string;
  ariaLabel: string;
  readoutLabel: (hour: number) => string;
  color?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [active, setActive] = useState<number | null>(null);
  const maxV = d3max(data, (d) => d.count) ?? 1;
  const r = scaleLinear().domain([0, maxV]).range([INNER, OUTER]);
  const wedge = arc();

  const peak = data.reduce((a, b) => (b.count > a.count ? b : a), data[0] ?? { hour: 0, count: 0 });
  const focus = active != null ? data.find((d) => d.hour === active) : peak;

  return (
    <svg ref={ref} viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-[380px]" role="img" aria-label={ariaLabel}>
      <g transform={`translate(${C},${C})`}>
        {Array.from({ length: 24 }, (_, h) => h).map((h) => {
          const emphasised = h % 6 === 0;
          const a = (h / 24) * 2 * Math.PI;
          const tr = OUTER + (emphasised ? 20 : 12);
          return emphasised ? (
            <text
              key={h}
              x={Math.sin(a) * tr}
              y={-Math.cos(a) * tr}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted text-[11px] font-medium tabular-nums"
            >
              {String(h).padStart(2, "0")}
            </text>
          ) : (
            <circle key={h} cx={Math.sin(a) * (OUTER + 8)} cy={-Math.cos(a) * (OUTER + 8)} r={1} className="fill-muted" />
          );
        })}

        {focus && (
          <>
            <text textAnchor="middle" y={-8} className="fill-ink font-serif text-[26px] font-semibold tabular-nums">
              {format(focus.count)}
            </text>
            <text textAnchor="middle" y={14} className="fill-muted text-[11px] uppercase tracking-wider">
              {readoutLabel(focus.hour)}
            </text>
          </>
        )}

        <motion.g
          initial={reduced ? false : { scale: 0 }}
          animate={{ scale: reduced || inView ? 1 : 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: "0px 0px" }}
        >
          {data.map((d) => {
            const a = (d.hour / 24) * 2 * Math.PI;
            const path =
              wedge({ innerRadius: INNER, outerRadius: r(d.count), startAngle: a, endAngle: a + BAND * 0.82 }) ?? "";
            return (
              <path
                key={d.hour}
                d={path}
                fill={color}
                style={{ opacity: active == null || active === d.hour ? 1 : 0.28, cursor: "pointer" }}
                onMouseEnter={() => setActive(d.hour)}
                onMouseLeave={() => setActive((v) => (v === d.hour ? null : v))}
              />
            );
          })}
        </motion.g>
      </g>

      <foreignObject x="0" y="0" width="0" height="0">
        <table className="sr-only">
          <caption>{ariaLabel}</caption>
          <tbody>
            {data.map((d) => (
              <tr key={d.hour}>
                <th scope="row">{readoutLabel(d.hour)}</th>
                <td>{format(d.count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </foreignObject>
    </svg>
  );
}
