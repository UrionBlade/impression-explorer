## Why

Every analytical endpoint currently scans the whole `impressions` table on each
request. At 200k rows that's sub-millisecond; the brief tells us they look closely
at how the app behaves **as the dataset grows**, and there the current shape has a
ceiling the schema comment already names ("the lever there is a pre-aggregated
rollup"). Two specific problems:

1. **`deviceDistribution()` materialises every per-device count in the JVM heap**
   (`SELECT count(*) … GROUP BY device_id` → `List<Long>`, then buckets and median
   in Kotlin). That's O(devices) memory in the application and an in-memory sort —
   it degrades hardest of all the endpoints as device cardinality grows.
2. **No rollup**: `by-hour` (per-row `AT TIME ZONE`), `by-device`, and
   `black-friday` (multiple full scans per year) all re-aggregate the base table
   on every call.

The data is immutable between seeds, so the rollup is the whole answer: aggregate
once after the seed, then serve every metric from a handful of tiny relations.

## What Changes

- **Materialized views** (migration `V4`) hold every metric pre-aggregated:
  per-state counts, per-hour counts (local + UTC), per-device distribution stats
  (mean/median/max/total) and buckets, and per-day counts (for Black Friday).
  Each is ≤ a few thousand rows regardless of the impression count.
- **Device distribution moves entirely into SQL** — `percentile_cont` for the
  median and `width_bucket`-style bucketing — so nothing is materialised in the
  app heap. The result is 1 stats row + ≤11 bucket rows.
- **The seed refreshes the rollups** once, after the load commits.
- **Every repository query reads a materialized view**, not `impressions`.
- No API contract changes, no frontend changes — same JSON, faster and flat as
  the table grows.

## Capabilities

### Modified Capabilities
- `impression-metrics`: the same four aggregates are now served from
  pre-aggregated rollups refreshed after ingest, with per-device distribution
  computed in SQL. Response shapes are unchanged; the requirement adds that
  serving cost is independent of the impression row count.

## Impact

- `apps/api`: new migration `V4__rollups.sql`; `ImpressionRepository` reads the
  views; `SeedRunner` refreshes them after commit. Integration tests move from
  rollback isolation to commit + refresh + truncate, since rollups read committed
  data (this also makes the tests exercise the real rollup path).
- Out of scope: generating a larger benchmark dataset (separate follow-up).
