import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useReducedMotion } from "../../motion";
import { useI18n } from "../../i18n";
import { formatNumber } from "../../format";

/** Animates a number from 0 to `value` with GSAP; renders the final value under reduced motion. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const { locale } = useI18n();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      el.textContent = formatNumber(value, locale);
      return;
    }
    const state = { n: 0 };
    const tween = gsap.to(state, {
      n: value,
      duration: 1.4,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = formatNumber(Math.round(state.n), locale);
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, reduced, locale]);

  return (
    <span ref={ref} className={className}>
      {formatNumber(value, locale)}
    </span>
  );
}
