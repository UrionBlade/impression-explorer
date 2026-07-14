## Why

The challenge dataset is a raw 200k-row CSV with only `device_id, lat, lng, timestamp` — no US state, no time-of-day, no indexes. Every analytical question ("impressions per state", "per hour", "Black Friday rate") would otherwise be recomputed by scanning the whole file on each request, which does not scale as the dataset grows — the one property the brief says it looks at closely. We need a real database that enriches each impression once, at ingest, and is indexed for the aggregations the product will ask for.

This change lays the foundation: the monorepo, a PostgreSQL + PostGIS database, the schema, and an idempotent loader that geo-joins each impression to its US state during ingest. No product features yet — the goal is "data loaded, enriched, and queryable" so the API and UI changes can build on it.

## What Changes

- New **Turborepo monorepo** with `apps/web` (React/TS placeholder) and `apps/api` (Kotlin/Spring Boot placeholder), plus a `db/` package for migrations and the seed loader.
- **PostgreSQL 16** as the database (no PostGIS extension), run via `docker-compose`.
- **Flyway migrations** defining the schema: a `states` reference table (name + polygon loaded from `map.json`) and an `impressions` table with a resolved `state_id`, indexed for state / hour-of-day / date-range aggregations.
- **Ingest-time geo-join in the seed loader**: each impression's `(lng, lat)` is matched to a US state polygon by a bounding-box-prefiltered point-in-polygon (ray casting) during load, so `state_id` is precomputed and per-state queries never evaluate geometry at read time. No spatial DB extension required.
- **Idempotent CSV seed loader** that streams `impressions.csv`, assigns the state per row, and bulk-inserts (COPY) — re-runnable safely.
- **Local dev ergonomics**: a `Taskfile.yml` (`task up`, `task seed`, `task dev`, …) and per-service `Dockerfile`s so the stack comes up with documented commands.

## Capabilities

### New Capabilities
- `impression-ingestion`: load the raw impressions CSV and the US-states GeoJSON into PostgreSQL, resolving each impression to its US state via a point-in-polygon geo-join at ingest, and indexing the data so downstream analytical aggregations run against pre-enriched, indexed columns rather than raw geometry. Idempotent and re-runnable.

### Modified Capabilities
<!-- none: first change, no existing specs -->

## Impact

- New services: `postgres` (`postgres:16`), `api` and `web` scaffolds, `db` migrations/seed.
- New dependencies: Flyway, Turborepo, Task (go-task). No PostGIS / spatial extension.
- Dataset `assets/impressions.csv` and `assets/map.json` become inputs to the seed step (not queried directly at runtime).
- Establishes the DB contract (`states`, `impressions` tables) that the `analytics-api` change will query.
