import type { Icon } from "@phosphor-icons/react";

/** An analytical question, previewed as an icon + label card. */
export function QuestionCard({ icon: IconCmp, label }: { icon: Icon; label: string }) {
  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-line bg-surface/60 p-5 transition-colors hover:border-accent">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110">
        <IconCmp size={22} weight="duotone" />
      </span>
      <span className="text-sm font-medium text-ink">{label}</span>
    </div>
  );
}
