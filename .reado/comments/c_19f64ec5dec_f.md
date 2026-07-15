---
id: c_19f64ec5dec_f
type: bug
state: open
kind: task
anchor:
  file: apps/web/src/main.tsx
  scope: range
  startLine: 9
  endLine: 9
context:
  snippet: import "./index.css";
  before: |-
    import { ThemeProvider } from "./theme";
    import { LocaleProvider, detectLocale, isLocale } from "./i18n";
    import { MotionProvider } from "./motion";
  after: |2-

    const queryClient = new QueryClient({
      defaultOptions: { queries: { refetchOnWindowFocus: false } },
links: []
author: user
orphan: false
createdAt: 1784104639980
updatedAt: 1784104639980
---

Cannot find module or type declarations for side-effect import of './index.css'.
