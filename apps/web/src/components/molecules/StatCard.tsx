import { CountUp } from "../atoms/CountUp";

/** A single headline figure with its label (animated count). */
export function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface/60 px-5 py-4">
      <div className="font-serif text-3xl font-semibold tabular-nums text-ink sm:text-4xl">
        <CountUp value={value} />
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}
