import type { Theme } from "../theme";

// Sequential ramps chosen so lightness is monotonic against each theme's canvas:
// on dark, density brightens (blue → teal); on light, density darkens (pale → navy).
const RAMPS: Record<Theme, string[]> = {
  dark: ["#2a3a5c", "#2f5788", "#3d78b0", "#3fa0b8", "#3fc7c9", "#7fe0e1"],
  light: ["#dceef0", "#a9d8dc", "#6bb9c4", "#3d8fb0", "#356fa0", "#233a63"],
};

const NO_DATA: Record<Theme, string> = { dark: "#191f36", light: "#e9edf4" };

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
  const rest = pos - base;
  const next = sorted[base + 1] ?? sorted[base];
  return sorted[base] + rest * (next - sorted[base]);
}

/**
 * Quantile-binned scale. Impression counts are heavily skewed (a few big states,
 * many small), so equal-count quantile bins spread colour meaningfully rather
 * than dumping everything into the lowest linear bin.
 */
export function makeScale(counts: number[], theme: Theme): ColorScale {
  const ramp = RAMPS[theme];
  const n = ramp.length;
  const positive = counts.filter((c) => c > 0).sort((a, b) => a - b);

  // Thresholds at the (1/n … (n-1)/n) quantiles → n bins.
  const thresholds: number[] = [];
  for (let i = 1; i < n; i++) thresholds.push(Math.round(quantile(positive, i / n)));

  const binIndex = (count: number): number => {
    let i = 0;
    while (i < thresholds.length && count >= thresholds[i]) i++;
    return i;
  };

  const min = positive[0] ?? 0;
  const max = positive[positive.length - 1] ?? 0;
  const edges = [min, ...thresholds, max];
  const bins = ramp.map((color, i) => ({ color, min: edges[i], max: edges[i + 1] }));

  return {
    colorFor: (count) => ramp[binIndex(count)],
    noData: NO_DATA[theme],
    bins,
  };
}
