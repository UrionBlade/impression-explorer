import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { max as d3max } from "d3-array";
import { useReducedMotion } from "../../motion";

export interface DistributionBar {
  label: string;
  value: number;
}

/** Horizontal histogram — buckets down the side, counts across. */
export function DistributionBars({
  bars,
  format,
  ariaLabel,
  color = "var(--accent)",
}: {
  bars: DistributionBar[];
  format: (n: number) => string;
  ariaLabel: string;
  color?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [active, setActive] = useState<number | null>(null);
  const maxV = d3max(bars, (b) => b.value) ?? 1;

  return (
    <div ref={ref}>
      <div role="img" aria-label={ariaLabel} className="space-y-2.5">
        {bars.map((b, i) => (
          <div
            key={b.label}
            className="flex items-center gap-3 text-sm"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive((v) => (v === i ? null : v))}
          >
            <div className="w-16 shrink-0 text-right tabular-nums text-muted">{b.label}</div>
            <div className="h-7 flex-1 rounded bg-line/25">
              <motion.div
                className="h-full origin-left rounded"
                style={{
                  backgroundColor: color,
                  width: `${(b.value / maxV) * 100}%`,
                  opacity: active == null || active === i ? 1 : 0.4,
                }}
                initial={reduced ? false : { scaleX: 0 }}
                animate={{ scaleX: reduced || inView ? 1 : 0 }}
                transition={{ duration: 0.5, delay: reduced ? 0 : i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="w-20 shrink-0 tabular-nums font-medium text-ink">{format(b.value)}</div>
          </div>
        ))}
      </div>

      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <tbody>
          {bars.map((b) => (
            <tr key={b.label}>
              <th scope="row">{b.label}</th>
              <td>{format(b.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
