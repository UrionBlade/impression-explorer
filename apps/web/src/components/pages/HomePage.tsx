import { AppShell } from "../templates/AppShell";
import { Hero } from "../organisms/Hero";
import { MapSection } from "../organisms/MapSection";
import { QuestionsSection } from "../organisms/QuestionsSection";

export function HomePage() {
  return (
    <AppShell>
      <Hero />
      <MapSection />
      <QuestionsSection />
    </AppShell>
  );
}
