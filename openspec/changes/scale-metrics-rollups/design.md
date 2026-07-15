## Why materialized views, not summary tables

The seed is a one-shot truncate-and-reload of immutable data. A materialized view
*is* the rollup: its defining `SELECT` is the aggregation, Postgres stores the
result, and `REFRESH MATERIALIZED VIEW` recomputes it. No application code to keep
a summary table in sync, no triggers, no drift. If ingestion later becomes
incremental, these can become `REFRESH … CONCURRENTLY` or hand-maintained tables —
the repository reads the same relation names either way.

## The views

- `mv_state_counts(state_id, cnt)` — ~52 rows. `state_id IS NULL` = unattributed.
- `mv_hour_counts(mode, hour, cnt)` — 48 rows. `mode` ∈ {`utc`,`local`}; local
  joins through `states` + `state_timezone` and buckets on `ts AT TIME ZONE tz`.
- `mv_device_stats(total_devices, mean, median, max)` — 1 row. `median` via
  `percentile_cont(0.5) WITHIN GROUP (ORDER BY c)` over per-device counts.
- `mv_device_buckets(bucket, devices)` — ≤11 rows. `bucket = least(ceil(c/10), 11)`;
  bucket 11 is the `100+` tail. The repository maps the index to its label.
- `mv_daily_counts(day, cnt)` — one row per observed US-day (~thousands over the
  dataset's span). Black Friday reads its BF-day count, year total, and observed
  days from here; the "Friday after the 4th Thursday of November" logic stays in
  the tested Kotlin helper rather than being re-encoded in SQL.

## Cost

Every endpoint now reads a bounded relation (≤ a few thousand rows) instead of
scanning `impressions`. Serving latency is independent of the impression count;
the O(rows) work happens once, at seed time, inside the refresh.

## Tests

Rollups read committed data, so the rollback-per-test isolation no longer fits.
`IntegrationTestBase` drops `@Transactional`; each test inserts committed rows,
calls `refreshRollups()`, asserts, and a shared `@AfterEach` truncates and
re-refreshes to reset the singleton container. This is strictly better coverage:
the tests now verify the view definitions and the refresh, i.e. the real path.
