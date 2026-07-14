## Context

The dataset is a flat 200k-row CSV (`device_id, lat, lng, timestamp`) plus a US-states GeoJSON. The brief judges how the app behaves as the dataset grows, so the foundation must push aggregation and geo-resolution into an indexed database rather than into request-time scans or the browser. This change builds the monorepo skeleton and the data layer; it deliberately ships no query endpoints or UI (those are the `analytics-api` and `explorer-ui` changes).

Constraints: Kotlin + Spring Boot backend (Cuebiq's stack), React + TS frontend, PostgreSQL preferred, `docker compose up` must bring the whole thing up locally.

## Goals / Non-Goals

**Goals:**
- One-command local bring-up: Postgres/PostGIS + schema + seeded, enriched data.
- Each impression resolved to its US state exactly once, at ingest, and indexed.
- Schema and load path transparent and defensible (raw SQL, visible indexes).
- Seed is idempotent and streams the CSV rather than buffering it in memory.

**Non-Goals:**
- The four analytical endpoints and the map/charts UI (later changes).
- Streaming/incremental ingestion, CDC, or a real ETL scheduler — this is a one-shot batch load of a fixed file.
- Time-zone-correct "hour of day" and Black Friday windowing — the schema stores a `timestamptz` that supports both; the definitions land in `analytics-api`.
- Auth, multi-tenancy, horizontal scaling.

## Decisions

**Plain PostgreSQL, no PostGIS.** PostGIS would earn its keep only if we ran spatial operations at read time (hex-bin density on raw points, arbitrary spatial predicates, vector tiles). We don't: state is resolved once at ingest and the map centrepiece is a per-state choropleth, so every runtime query is a plain `GROUP BY` on indexed scalar columns. Finer density, if added, is a square-grid aggregation expressible as `floor(lng/cell), floor(lat/cell)` in ordinary SQL. Pulling in the `postgis/postgis` image and extension for a single one-time batch join is complexity we don't need — `postgres:16` is enough. (If a future feature genuinely needs hexagons or spatial indexing, PostGIS can be added then.)

**Ingest-time geo-join by ray casting, in the seed loader.** Each impression's `(lng, lat)` is matched to its US state by point-in-polygon (even-odd ray casting) with a per-state bounding-box prefilter, and the resolved `state_id` is stored and indexed. This turns "impressions per state" into `GROUP BY state_id` — no geometry at read time. Alternatives rejected: resolving state per request, or in the browser via d3, both recompute geometry on every query and don't scale. The prefiltered ray cast is ~50 bbox checks per point against ~50 states; for 200k points it runs in seconds, and it stays a one-time cost as the dataset grows.

**States stored as their polygon coordinates; impressions store scalar `lat/lng`.** The `states` table keeps each state's name and polygon rings (the loader reads them from `map.json`); the loader holds them in memory to run the join. Impressions persist `lat`, `lng` as `double precision` — the point is only needed during the one-time join, so no per-row geometry object is stored.

**Seed is a single-pass streaming loader, not `\copy` + `UPDATE`.** The loader parses `map.json`, then streams `impressions.csv` row by row, assigns the state inline, and bulk-inserts via `COPY` with `state_id` already set — one pass, no post-load update, bounded memory. Running it in the JVM (Kotlin) reuses the backend toolchain already in the repo and keeps the point-in-polygon logic reviewable and testable. A pure-SQL load isn't an option without PostGIS (point-in-polygon in SQL is impractical), and that's a fair trade for dropping the extension.

**Flyway owns the schema as a dedicated step, not the API.** Migrations run as their own unit (a one-shot compose service / `task migrate`) so schema and seed can be established without starting Spring Boot, and migrations stay plain reviewable SQL. Spring Boot connects to an already-migrated DB (Flyway in `validate` mode) rather than being the migration authority. Chosen over Liquibase for raw-SQL transparency.

**Idempotency via truncate-and-load, not upsert.** This is a batch load of a fixed file, not a merge. `TRUNCATE` + reload is simpler and provably convergent; there is no natural business key on an impression (duplicate `device_id/ts/coord` rows are legitimate). Re-running the seed yields identical counts.

**Turborepo for the monorepo, even though the API is JVM.** Turborepo orchestrates the JS side natively and runs the Kotlin build through a wrapped task; it gives one task graph, cached web builds, and one `dev` entrypoint. Gradle stays the authority for the Kotlin module. Alternative (Gradle multi-project owning everything, or Nx) rejected: heavier for a two-app repo and less idiomatic for the React side.

## Risks / Trade-offs

- **Points on a shared state border, or polygon winding quirks in `map.json`** → even-odd ray casting assigns border points deterministically to one state; the count of any ambiguous/edge cases is negligible against 200k and doesn't shift aggregates materially.
- **Impressions outside any US polygon** (offshore, AK/HI if absent from the GeoJSON, bad coords like `0,0`) → `state_id` NULL by design; the seed reports the unattributed count so it is visible, not hidden.
- **200k point-in-polygon at seed time** → bounded by the bbox prefilter; expected seconds. It stays a one-time batch cost; if the source file grew to tens of millions the join is trivially parallelizable per row.
- **Seed loader needs the CSV/GeoJSON reachable at run time** → paths are configurable and default to `assets/`; documented in the README so "clone and run" holds.
- **TRUNCATE reload discards any manual data** → acceptable; this DB is derived entirely from the two source files.

## Migration Plan

1. `task up` — start `postgres:16` via compose.
2. `task migrate` — Flyway applies schema (tables, indexes).
3. `task seed` — run the loader: parse GeoJSON into `states`, stream the CSV assigning `state_id` inline, `COPY` into `impressions`, report loaded + unattributed counts.
4. Rollback: `task down -v` drops the volume; the pipeline is fully reproducible from the two source files.

## Open Questions

- "Hour of the day" and "Black Friday day" are local-time concepts over a multi-timezone country; the storage layer stays UTC-correct and the definitions are resolved in `analytics-api` (Black Friday already decided: lift vs. annual daily mean, day fixed on a US reference timezone).
