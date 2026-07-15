import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import App from "./App.tsx";
import { ThemeProvider } from "./theme";
import { LocaleProvider, detectLocale, isLocale } from "./i18n";
import { MotionProvider } from "./motion";
import "@fontsource-variable/manrope";
import "@fontsource-variable/fraunces";
import "./index.css";

// The dataset is a static batch load — cache queries for the session, no refetch.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity, gcTime: Infinity, refetchOnWindowFocus: false, retry: 1 },
  },
});

/** Single source of the default-language redirect; preserves the query string. */
function RedirectToDefaultLocale() {
  const { search } = useLocation();
  return <Navigate to={`/${detectLocale()}${search}`} replace />;
}

/** Validate the `/:lang` route; unknown or missing language → redirect to the browser's. */
function LocalizedApp() {
  const { lang } = useParams();
  if (!isLocale(lang)) return <RedirectToDefaultLocale />;
  return (
    <LocaleProvider locale={lang}>
      <App />
    </LocaleProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MotionProvider>
          <BrowserRouter>
            <Routes>
              {/* `/*` leaves room for per-language sub-routes in later metric slices. */}
              <Route path="/:lang/*" element={<LocalizedApp />} />
              <Route path="*" element={<RedirectToDefaultLocale />} />
            </Routes>
          </BrowserRouter>
        </MotionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
