## 1. Monorepo skeleton

- [x] 1.1 Initialize Turborepo at the root (`package.json`, `turbo.json`, `pnpm-workspace.yaml`) with `apps/*` workspaces
- [x] 1.2 Add root `.gitignore` (node_modules, build output, `.gradle`, env files; keep `.reado/` review artifacts, drop personal UI prefs)
- [x] 1.3 Scaffold `apps/api` as a Kotlin + Spring Boot project (Gradle Kotlin DSL, Boot 4.1 / Kotlin 2.3 / JDK 21 toolchain) — `assemble` builds clean
- [x] 1.4 Scaffold `apps/web` as a React + Vite + TypeScript app with Tailwind 4 wired up (renders an app shell) — `build` passes
- [x] 1.5 Wire a Turborepo task that runs the Gradle build for `apps/api` (`@impression-explorer/api` build → `./gradlew assemble`)

## 2. Database schema (Flyway)

- [x] 2.1 Add `db/migrations/` and migration `V1__states.sql`: `states` table (id, unique name)
- [x] 2.2 `V2__impressions.sql`: `impressions` table (id, device_id, `lat/lng double precision`, `ts timestamptz`, `state_id` FK) + B-tree indexes on `state_id`, `ts`, `device_id`

## 3. Seed pipeline (single-pass loader)

- [x] 3.1 States load: parse `assets/map.json`, insert 51 state names into `states`, keep polygons in memory for the join
- [x] 3.2 Point-in-polygon: even-odd ray-cast with a per-state bounding-box prefilter (unit-tested — `GeoTest`)
- [x] 3.3 Impressions load: stream `assets/impressions.csv`, parse `ts` from epoch seconds, assign `state_id` inline, `COPY` into `impressions`; fail loudly on malformed rows
- [x] 3.4 Make the seed idempotent (truncate-and-reload) and report loaded counts + unattributed (NULL state) count
- [x] 3.5 Verify: 200,000 rows, timestamps round-trip (device 693297 → 1730905514), re-run leaves counts unchanged; 2,747 (1%) unattributed

## 4. Local dev environment

- [x] 4.1 `docker-compose.yml` with a `postgres:16` service (named volume, healthcheck) and a one-shot Flyway migration service
- [x] 4.2 `Dockerfile` for `apps/api` (multi-stage JDK→JRE) and `apps/web` (pnpm build → nginx serve + `/api` proxy); wired `api`/`web`/one-shot `seed` services into compose so `docker compose up` runs the whole stack. Both images build clean.
- [x] 4.3 `Taskfile.yml`: `up`, `down`, `migrate`, `seed`, `dev`, `build`, `psql` targets
- [x] 4.4 `.env.example` with DB connection settings consumed by compose, Flyway, and the seed

## 5. Frontend foundation (shell, i18n, design guidelines)

- [x] 5.1 Ran the `teach-impeccable` design-context step; guidelines captured in `.impeccable.md` (elegant/editorial, dark-default dual theme, Cuebiq-logo palette, animated)
- [x] 5.2 i18n layer: `LocaleProvider` context + `t(key)` hook + `en.json` / `it.json` catalogs; language detected from `navigator.language` (Italian → it, else English), no manual switcher
- [x] 5.3 Locale-aware formatting helpers over `Intl.NumberFormat` / `Intl.DateTimeFormat`
- [x] 5.4 Browser language detection with English fallback (pre-hydration script sets `<html lang>`, `LocaleProvider` reads it)
- [x] 5.5 Catalog-parity check (test) that fails if a key is missing from `en.json` or `it.json`
- [x] 5.6 Base layout/theme: Tailwind tokens for the Cuebiq palette (navy/blue/teal), dual light+dark themes with dark default, Ark UI (headless) + Phosphor icons, Atomic Design (atoms/molecules/organisms/templates/pages) — verified in both themes
- [x] 5.7 Motion foundation: installed GSAP, Framer Motion, Lenis; `MotionProvider` runs Lenis smooth scroll and exposes a `prefers-reduced-motion` guard (plus a global CSS media-query fallback)
- [x] 5.8 Proved the stack in the shell: Framer `Reveal` on scroll-in, GSAP `CountUp` on the stats, Lenis scrolling — all gated on reduced-motion

## 6. Documentation

- [x] 6.1 README: prerequisites, Docker quick start, and the `task up` → `migrate` → `seed` → `dev` flow (plus single-service commands)
- [x] 6.2 Note the schema, the ingest-time ray-cast geo-join, why no PostGIS, and scaling (links to `design.md`)
- [x] 6.3 Note the i18n approach (browser-detected IT/EN) and where design guidelines live (`.impeccable.md`); plus the AI-assisted (OpenSpec + Reado) note
