import { ClockIcon, DeviceMobileIcon, MapPinIcon, ShoppingBagIcon } from "@phosphor-icons/react";
import { Reveal } from "../atoms/Reveal";
import { QuestionCard } from "../molecules/QuestionCard";
import { useI18n } from "../../i18n";

export function QuestionsSection() {
  const { t } = useI18n();
  const items = [
    { icon: DeviceMobileIcon, label: t("section.q.device") },
    { icon: ClockIcon, label: t("section.q.hour") },
    { icon: MapPinIcon, label: t("section.q.state") },
    { icon: ShoppingBagIcon, label: t("section.q.blackfriday") },
  ];
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <Reveal>
        <h2 className="font-serif text-2xl font-semibold text-ink">{t("section.questions.title")}</h2>
      </Reveal>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {items.map((item, i) => (
          <Reveal key={item.label} delay={i * 0.08}>
            <QuestionCard icon={item.icon} label={item.label} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
