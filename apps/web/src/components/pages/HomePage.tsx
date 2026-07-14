import { AppShell } from "../templates/AppShell";
import { Hero } from "../organisms/Hero";
import { MapPlaceholder } from "../organisms/MapPlaceholder";
import { QuestionsSection } from "../organisms/QuestionsSection";

export function HomePage() {
  return (
    <AppShell>
      <Hero />
      <MapPlaceholder />
      <QuestionsSection />
    </AppShell>
  );
}
