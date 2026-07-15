## 1. Rollup schema

- [x] 1.1 Migration `V4__rollups.sql`: materialized views `mv_state_counts`, `mv_hour_counts` (local+utc), `mv_device_stats` (total/mean/median/max via `percentile_cont`), `mv_device_buckets` (even 10-wide, 100+ collapsed), `mv_daily_counts` (per US-day)
- [x] 1.2 Views created empty at migration time (base table empty), populated by refresh after seed

## 2. Serve metrics from the rollups

- [x] 2.1 `countsByState()` reads `mv_state_counts` (join `states` for names; NULL state = unattributed)
- [x] 2.2 `countsByHour()` reads `mv_hour_counts`, 0-filled to 24
- [x] 2.3 `deviceDistribution()` reads `mv_device_stats` (1 row) + `mv_device_buckets` (≤11 rows); no per-device list in the JVM
- [x] 2.4 `blackFriday()` reads `mv_daily_counts` for BF-day count, year total, observed days (BF date logic stays in Kotlin)

## 3. Refresh on seed

- [x] 3.1 `SeedRunner` refreshes all rollups after the load transaction commits

## 4. Tests

- [x] 4.1 `IntegrationTestBase`: drop rollback isolation; add `refreshRollups()` helper and per-test truncate
- [x] 4.2 ByState / ByHour / ByDevice / BlackFriday tests: insert (committed) → refresh → assert
- [x] 4.3 Full backend test run green
