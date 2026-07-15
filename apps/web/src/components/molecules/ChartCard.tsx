import type { ReactNode } from "react";
import { useI18n } from "../../i18n";

/**
 * An editorial block for one metric: a strong header and the viz — no card box.
 * Owns its own loading skeleton and error/retry state.
 */
export function ChartCard({
  title,
  subtitle,
  actions,
  state,
  onRetry,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  state: "pending" | "error" | "ready";
  onRetry?: () => void;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="border-t border-line pt-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl font-semibold tracking-tight text-ink">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {actions}
      </div>

      {state === "error" ? (
        <div className="flex flex-col items-start gap-3 py-10">
          <p className="text-sm text-muted">{t("map.error")}</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-line px-4 py-1.5 text-sm font-medium text-ink transition-colors hover:border-accent"
          >
            {t("map.retry")}
          </button>
        </div>
      ) : state === "pending" ? (
        <div className="h-56 animate-pulse rounded-lg bg-line/40" />
      ) : (
        children
      )}
    </div>
  );
}
