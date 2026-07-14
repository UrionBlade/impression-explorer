## 1. Monorepo skeleton

- [ ] 1.1 Initialize Turborepo at the root (`package.json`, `turbo.json`, `pnpm-workspace.yaml`) with `apps/*` and `db/` workspaces
- [ ] 1.2 Add root `.gitignore` (node_modules, build output, `.gradle`, `target`, env files)
- [ ] 1.3 Scaffold `apps/api` as a minimal Kotlin + Spring Boot project (Gradle Kotlin DSL, boots and exposes `/actuator/health`)
- [ ] 1.4 Scaffold `apps/web` as a minimal React + Vite + TypeScript app (renders a placeholder page)
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

## 5. Documentation

- [ ] 5.1 README section: prerequisites and the exact clone → `task up` → `task migrate` → `task seed` flow
- [ ] 5.2 Note the schema, the ingest-time ray-cast geo-join, why no PostGIS, and how per-state aggregation scales (link back to `design.md`)
