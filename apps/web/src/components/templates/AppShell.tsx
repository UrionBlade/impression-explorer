import type { ReactNode } from "react";
import { Header } from "../organisms/Header";
import { Footer } from "../organisms/Footer";

/** Page chrome: header + scrollable main + footer. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
