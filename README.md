# Impression Explorer

A full-stack app to explore where US advertising **impressions** (a single ad view
from a mobile device) concentrate across the United States — by state, by device,
by hour of day, and through the years.

Built for the Cuebiq Senior Full Stack Engineer challenge. See
[`CHALLENGE.md`](./CHALLENGE.md) for the brief and
[`DECISIONS.md`](./DECISIONS.md) for the product-level choices and open questions
(what an "impression" is, local vs UTC hour, the Black Friday baseline, …).

## Stack

| Layer        | Choice                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| Frontend     | React 19 + Vite + TypeScript + Tailwind 4, Ark UI (headless), Phosphor |
| Backend      | Kotlin + Spring Boot 4 (Gradle Kotlin DSL), JDK 21                     |
| Database     | PostgreSQL 16 (no PostGIS — see below), Flyway migrations              |
| Monorepo     | Turborepo + pnpm workspaces; [Task](https://taskfile.dev) for dev flow |
| Local deploy | `docker compose up`                                                    |

The state of each impression is resolved **once at ingest** with a bounding-box-
prefiltered point-in-polygon (ray casting) in the seed loader, then stored as an
indexed `state_id`. That keeps per-state queries a plain `GROUP BY` and needs no
spatial database extension. Rationale in
[`openspec/changes/bootstrap-platform/design.md`](./openspec/changes/bootstrap-platform/design.md).

## Layout

```
apps/
  web/        React + Vite + TS frontend (Atomic Design under src/components)
  api/        Kotlin + Spring Boot backend + the seed loader (profile "seed")
db/migrations/  Flyway SQL (schema + indexes)
assets/       impressions.csv, map.json (seed inputs)
openspec/     spec-driven change history (proposal / design / specs / tasks)
.impeccable.md  design guidelines
Taskfile.yml  dev commands
docker-compose.yml + apps/*/Dockerfile
```

## Prerequisites

**For the Docker path (recommended): just [Docker Desktop](https://www.docker.com/products/docker-desktop/)** —
it bundles Docker Compose. Nothing else to install.

For **local development** (hot reload) you additionally need Node, a JDK, and
Task. On macOS with [Homebrew](https://brew.sh):

```bash
brew install --cask docker          # or install Docker Desktop manually
brew install node openjdk@21 go-task
```

You do **not** install `pnpm` by hand — `task setup` enables it through Node's
built-in corepack.

## Run it with Docker — recommended, nothing to install but Docker

One command builds and starts **everything** — Postgres, the schema migration, the
200k-row seed, the API, and the web app. Every dependency (pnpm packages, Gradle,
the JDK) is installed **inside the containers**, so no local Node/JDK/pnpm and no
`.env` are required:

```bash
docker compose up --build
```

Let the logs settle — the order is `postgres` → `flyway` (migrate) → `seed`
(loads 200k geo-joined impressions) → `api` + `web` — then open:

- **Web app → <http://localhost:3000>**
- API health → <http://localhost:8080/actuator/health>

Stop it (add `-v` to also wipe the database):

```bash
docker compose down                 # docker compose down -v  resets all data
```

## Local development — hot reload

For iterating on the code, with Vite HMR (web) and Spring DevTools (API). Run
these **in order** — the first step installs everything and creates `.env`:

```bash
task setup       # once: create .env + install all JS dependencies
task up          # start PostgreSQL (in Docker)
task migrate     # apply the schema (Flyway)
task seed        # load states + 200k impressions (idempotent; re-run any time)
task dev         # start web + API together, both with hot reload
```

Or all at once:
`task setup && task up && task migrate && task seed && task dev`

Then open:

- **Web (Vite) → <http://localhost:5173>** — proxies `/api` to the API
- API → <http://localhost:8080>

`task dev` re-runs `pnpm install` first, so it never starts on a missing
`node_modules`. The Gradle side downloads its own dependencies and finds a JDK 21
(the Taskfile falls back to Homebrew's `openjdk@21`, otherwise export `JAVA_HOME`)
automatically on first run.

Other targets:

```bash
task build       # build all apps (turbo)
task psql        # open a psql shell on the database
task down        # stop containers (task down -- -v to drop the volume)
```

## Running a single service

**Frontend only** (`apps/web`):

```bash
pnpm install
pnpm --filter @impression-explorer/web dev      # Vite dev server on :5173
pnpm --filter @impression-explorer/web build    # type-check + production build
pnpm --filter @impression-explorer/web test     # vitest (i18n catalog parity)
```

**Backend only** (`apps/api`) — needs `JAVA_HOME` on a JDK 17+ and a running DB:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21 2>/dev/null || echo /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home)
cd apps/api
./gradlew bootRun                                 # start the API on :8080
./gradlew test                                    # unit tests (ray-cast geo)
./gradlew assemble                                # build the boot jar
# run the one-shot seed against the DB:
DATABASE_URL=jdbc:postgresql://localhost:5432/impressions \
  ./gradlew bootRun --args='--spring.profiles.active=seed'
```

**Database only** (Postgres + migrations, via compose):

```bash
docker compose up -d postgres     # start Postgres
docker compose run --rm flyway    # apply migrations
```

## The data

`assets/impressions.csv` — 200,000 rows of `device_id, lat, lng, timestamp`
(Unix epoch seconds, UTC), spanning 2019–2025 across ~7,968 devices.
`assets/map.json` — US states GeoJSON.

The seed loads the states, then streams the CSV, assigns each impression's US
state by point-in-polygon, and bulk-loads via `COPY`. Impressions outside every
state polygon (offshore, bad coords) keep a `NULL` state and are reported
(~2,747, ~1.4%). Timestamps are stored in **UTC**; local-time views (e.g. hour of
day) are a presentation concern.

## What it answers

1. Impressions per device
2. Impressions per hour of the day
3. Impressions per US state (the interactive map — the centrepiece)
4. Black Friday impression rate through the years (lift vs. the annual daily mean)

All four are implemented — an interactive US choropleth as the centrepiece plus
three bespoke charts — served from pre-aggregated rollups so query latency stays
flat as the dataset grows (see [`DECISIONS.md`](./DECISIONS.md), tested at 200M).

## Testing

```bash
task build                                        # builds web + api
pnpm --filter @impression-explorer/web test       # frontend unit tests
cd apps/api && ./gradlew test                      # backend unit tests
```

## How this was built (AI-assisted)

Developed with a coding agent, driven **spec-first**:

- **OpenSpec** (`openspec/`) — each change starts as a proposal → design → specs
  → tasks, then implementation. The `bootstrap-platform` change (this foundation)
  is fully readable there, including the decisions and their rationale.
- **Reado** guided review — the diff was reviewed file-by-file; findings were
  raised as comments, triaged, and resolved (e.g. explicit transaction rollback
  in the seed, CSV-header validation, index-rationale corrections).

The `.reado/` directory is committed **on purpose** (it is not build noise): it
holds that guided-review record — the review comments, tasks, and sessions — so
that, if you'd like, you can open the project in
[Reado](https://reado.watermelon-studio.it) and inspect the exact workflow used
to build and review this. Only transient preview state under `.reado/` is
git-ignored.

The commit history is intended to read as progressive, defensible steps rather
than one drop.
