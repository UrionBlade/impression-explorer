## 1. Monorepo skeleton

- [ ] 1.1 Initialize Turborepo at the root (`package.json`, `turbo.json`, `pnpm-workspace.yaml`) with `apps/*` and `db/` workspaces
- [ ] 1.2 Add root `.gitignore` (node_modules, build output, `.gradle`, `target`, env files)
- [ ] 1.3 Scaffold `apps/api` as a minimal Kotlin + Spring Boot project (Gradle Kotlin DSL, boots and exposes `/actuator/health`)
- [ ] 1.4 Scaffold `apps/web` as a React + Vite + TypeScript app with Tailwind wired up (renders an app shell)
- [ ] 1.5 Wire a Turborepo task that runs the Gradle build for `apps/api`

## 2. Database schema (Flyway)

- [ ] 2.1 Add `db/` with Flyway config and migration `V1__states.sql`: `states` table (id, name, `polygon jsonb` for the rings) 
- [ ] 2.2 `V2__impressions.sql`: `impressions` table (id, device_id, `lat/lng double precision`, `ts timestamptz`, `state_id` FK) + B-tree indexes on `state_id` and `ts`

## 3. Seed pipeline (single-pass loader)

- [ ] 3.1 States load: parse `assets/map.json`, insert each feature's name + polygon rings into `states`, keep them in memory for the join
- [ ] 3.2 Point-in-polygon: even-odd ray-cast with a per-state bounding-box prefilter (unit-tested against a few known coordinates)
- [ ] 3.3 Impressions load: stream `assets/impressions.csv`, parse `ts` from epoch seconds, assign `state_id` inline, `COPY` into `impressions`; fail loudly on malformed rows
- [ ] 3.4 Make the seed idempotent (truncate-and-reload) and report loaded counts + unattributed (NULL state) count
- [ ] 3.5 Verify: row count == 200,000, timestamps round-trip, re-running the seed leaves counts unchanged

## 4. Local dev environment

- [ ] 4.1 `docker-compose.yml` with a `postgres:16` service (named volume, healthcheck) and a one-shot Flyway migration service
- [ ] 4.2 `Dockerfile` for `apps/api` (JVM build) and `apps/web` (build + static serve)
- [ ] 4.3 `Taskfile.yml`: `up`, `down`, `migrate`, `seed`, `dev`, `build` targets
- [ ] 4.4 `.env.example` with DB connection settings consumed by compose, Flyway, and the seed

## 5. Frontend foundation (shell, i18n, design guidelines)

- [ ] 5.1 Run the `teach-impeccable` design-context step and capture the answers as the project's design guidelines (AI config + a short note in the repo)
- [ ] 5.2 i18n layer: `LocaleProvider` context + `t(key)` hook + `en.json` / `it.json` catalogs; default English, choice persisted in `localStorage`
- [ ] 5.3 Locale-aware formatting helpers over `Intl.NumberFormat` / `Intl.DateTimeFormat`
- [ ] 5.4 Language switcher component in the app shell; switching updates all text without a reload
- [ ] 5.5 Catalog-parity check (test) that fails if a key is missing from `en.json` or `it.json`
- [ ] 5.6 Base layout/theme: Tailwind tokens for the Cuebiq palette (navy/blue/teal), dual light+dark themes with dark default, ready for metric views
- [ ] 5.7 Motion foundation: install GSAP (+ScrollTrigger), Framer Motion, Lenis; a `MotionProvider` that sets up Lenis smooth scroll and a global `prefers-reduced-motion` guard
- [ ] 5.8 Prove the stack end-to-end in the shell: one Framer Motion transition, one GSAP count-up/reveal, Lenis scrolling — all disabled under reduced-motion

## 6. Documentation

- [ ] 6.1 README section: prerequisites and the exact clone → `task up` → `task migrate` → `task seed` flow
- [ ] 6.2 Note the schema, the ingest-time ray-cast geo-join, why no PostGIS, and how per-state aggregation scales (link back to `design.md`)
- [ ] 6.3 Note the i18n approach (IT/EN) and where design guidelines live
