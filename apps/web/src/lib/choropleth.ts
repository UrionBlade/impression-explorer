// A single sequential ramp, the same in light and dark so the scale never flips:
// pale → saturated → navy for low → high density.
const RAMP = ["#dceef0", "#a9d8dc", "#6bb9c4", "#3d8fb0", "#356fa0", "#233a63"];
const NO_DATA = "#cbd2dc";

export interface ColorScale {
  colorFor: (count: number) => string;
  noData: string;
  /** Legend bins, low → high, with their inclusive-ish count range. */
  bins: { color: string; min: number; max: number }[];
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const lo = sorted[base] ?? 0;
  const next = sorted[base + 1] ?? lo;
  return lo + (pos - base) * (next - lo);
}

/**
 * Quantile-binned scale. Impression counts are heavily skewed (a few big states,
 * many small), so equal-count quantile bins spread colour meaningfully rather
 * than dumping everything into the lowest linear bin.
 */
export function makeScale(counts: number[]): ColorScale {
  const ramp = RAMP;
  const n = ramp.length;
  const positive = counts.filter((c) => c > 0).sort((a, b) => a - b);

  const thresholds: number[] = [];
  for (let i = 1; i < n; i++) thresholds.push(Math.round(quantile(positive, i / n)));

  const binIndex = (count: number): number => {
    let i = 0;
    while (i < thresholds.length && count >= (thresholds[i] ?? Number.POSITIVE_INFINITY)) i++;
    return i;
  };

  const min = positive[0] ?? 0;
  const max = positive[positive.length - 1] ?? 0;
  const edges = [min, ...thresholds, max];
  const bins = ramp.map((color, i) => ({ color, min: edges[i] ?? 0, max: edges[i + 1] ?? 0 }));

  const fallback = ramp[ramp.length - 1] ?? "#000000";
  return {
    colorFor: (count) => ramp[binIndex(count)] ?? fallback,
    noData: NO_DATA,
    bins,
  };
}
