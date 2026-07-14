import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ThemeProvider } from "./theme";
import { LocaleProvider } from "./i18n";
import { MotionProvider } from "./motion";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <LocaleProvider>
        <MotionProvider>
          <App />
        </MotionProvider>
      </LocaleProvider>
    </ThemeProvider>
  </StrictMode>,
);
