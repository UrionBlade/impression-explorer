## Why

The challenge dataset is a raw 200k-row CSV with only `device_id, lat, lng, timestamp` — no US state, no time-of-day, no indexes. Every analytical question ("impressions per state", "per hour", "Black Friday rate") would otherwise be recomputed by scanning the whole file on each request, which does not scale as the dataset grows — the one property the brief says it looks at closely. We need a real database that enriches each impression once, at ingest, and is indexed for the aggregations the product will ask for.

This change lays the foundation: the monorepo, a PostgreSQL database, the schema, an idempotent loader that geo-joins each impression to its US state during ingest, and the frontend shell (bilingual IT/EN, established design guidelines). No product metrics yet — the goal is "data loaded and queryable" plus "an app shell ready to render metrics", so each subsequent change can ship one metric end-to-end (backend + frontend together) as a vertical slice.

## What Changes

- New **Turborepo monorepo** with `apps/web` (React/TS placeholder) and `apps/api` (Kotlin/Spring Boot placeholder), plus a `db/` package for migrations and the seed loader.
- **PostgreSQL 16** as the database (no PostGIS extension), run via `docker-compose`.
- **Flyway migrations** defining the schema: a `states` reference table (name + polygon loaded from `map.json`) and an `impressions` table with a resolved `state_id`, indexed for state / hour-of-day / date-range aggregations.
- **Ingest-time geo-join in the seed loader**: each impression's `(lng, lat)` is matched to a US state polygon by a bounding-box-prefiltered point-in-polygon (ray casting) during load, so `state_id` is precomputed and per-state queries never evaluate geometry at read time. No spatial DB extension required.
- **Idempotent CSV seed loader** that streams `impressions.csv`, assigns the state per row, and bulk-inserts (COPY) — re-runnable safely.
- **Local dev ergonomics**: a `Taskfile.yml` (`task up`, `task seed`, `task dev`, …) and per-service `Dockerfile`s so the stack comes up with documented commands.
- **Bilingual frontend shell**: the React app boots with an i18n layer (Italian + English) and a language switcher, locale-aware number/date formatting, and project design guidelines captured up front (via the `teach-impeccable` design-context step, in `.impeccable.md`) so later metric UIs are consistent.
- **Motion foundation**: the app is animated throughout by design (a polished product, not a bare dashboard). This change installs and wires the motion stack — **Lenis** (smooth scroll), **GSAP + ScrollTrigger** (scroll-driven and chart/data animations), **Framer Motion** (component/layout transitions) — with a global `prefers-reduced-motion` guard, so each metric slice animates consistently.

## Capabilities

### New Capabilities
- `impression-ingestion`: load the raw impressions CSV and the US-states GeoJSON into PostgreSQL, resolving each impression to its US state via a point-in-polygon geo-join at ingest, and indexing the data so downstream analytical aggregations run against pre-enriched, indexed columns rather than raw geometry. Idempotent and re-runnable.
- `web-localization`: the frontend renders in Italian or English, with a user-facing language switcher and locale-aware formatting of numbers and dates, so the app is usable in both languages from the first metric onward.
- `motion-experience`: the app has a wired motion foundation (smooth scroll, transitions, data animations) that is applied consistently and always yields to the user's `prefers-reduced-motion` setting.

### Modified Capabilities
<!-- none: first change, no existing specs -->

## Impact

- New services: `postgres` (`postgres:16`), `api` and `web` scaffolds, `db` migrations/seed.
- New dependencies: Flyway, Turborepo, Task (go-task). No PostGIS / spatial extension.
- Dataset `assets/impressions.csv` and `assets/map.json` become inputs to the seed step (not queried directly at runtime).
- Establishes the DB contract (`states`, `impressions` tables) and the app shell (i18n, design guidelines) that each subsequent per-metric vertical slice builds on.
