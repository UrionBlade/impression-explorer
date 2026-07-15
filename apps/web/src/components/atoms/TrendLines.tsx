import { useRef, useState } from "react";
import { area, line } from "d3-shape";
import { scaleLinear, scalePoint } from "d3-scale";
import { max as d3max } from "d3-array";
import { motion, useInView } from "framer-motion";
import { useReducedMotion } from "../../motion";

export interface TrendPoint {
  year: number;
  count: number;
  baseline: number;
}

const W = 560;
const H = 240;
const PAD = { t: 16, r: 16, b: 28, l: 48 };

/** Two lines over the years: the Black Friday day vs the year's typical (median) day. */
export function TrendLines({
  data,
  format,
  ariaLabel,
  readout,
}: {
  data: TrendPoint[];
  format: (n: number) => string;
  ariaLabel: string;
  readout: (p: TrendPoint) => string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [active, setActive] = useState<number | null>(null);

  const x = scalePoint<string>().domain(data.map((d) => String(d.year))).range([PAD.l, W - PAD.r]).padding(0.5);
  const y = scaleLinear().domain([0, d3max(data, (d) => d.count) ?? 1]).range([H - PAD.b, PAD.t]).nice();
  const px = (d: TrendPoint) => x(String(d.year)) ?? 0;

  const bfArea = area<TrendPoint>().x(px).y0(H - PAD.b).y1((d) => y(d.count));
  const bfLine = line<TrendPoint>().x(px).y((d) => y(d.count));
  const baselineLine = line<TrendPoint>().x(px).y((d) => y(d.baseline));
  const shown = active != null ? data.find((d) => d.year === active) : undefined;

  return (
    <div ref={ref}>
      <div className="mb-1 h-6 text-sm">
        {shown ? (
          <span className="text-muted">{readout(shown)}</span>
        ) : (
          <span className="text-xs text-muted">—</span>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={ariaLabel}>
        {y.ticks(4).map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth={1} />
            <text x={PAD.l - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-muted text-[9px] tabular-nums">
              {format(t)}
            </text>
          </g>
        ))}

        <path d={bfArea(data) ?? ""} fill="var(--accent)" opacity={0.12} />
        <motion.path
          d={baselineLine(data) ?? ""}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: reduced || inView ? 1 : 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <motion.path
          d={bfLine(data) ?? ""}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2.5}
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: reduced || inView ? 1 : 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />

        {data.map((d) => (
          <g key={d.year}>
            <circle cx={px(d)} cy={y(d.count)} r={active === d.year ? 5 : 3.5} fill="var(--accent)" />
            <circle cx={px(d)} cy={y(d.baseline)} r={2.5} fill="var(--muted)" />
            <rect
              x={px(d) - 18}
              y={PAD.t}
              width={36}
              height={H - PAD.t - PAD.b}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setActive(d.year)}
              onMouseLeave={() => setActive((v) => (v === d.year ? null : v))}
            />
            <text x={px(d)} y={H - 8} textAnchor="middle" className="fill-muted text-[9px] tabular-nums">
              {d.year}
            </text>
          </g>
        ))}
      </svg>

      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.year}>
              <th scope="row">{d.year}</th>
              <td>{format(d.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
