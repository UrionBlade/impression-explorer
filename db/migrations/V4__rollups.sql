-- Pre-aggregated rollups. The seed is a one-shot load of immutable data, so a
-- materialized view *is* the rollup: its SELECT is the aggregation, Postgres
-- stores the result, and REFRESH recomputes it after the seed. Every analytical
-- endpoint reads one of these bounded relations instead of scanning impressions,
-- so serving cost no longer grows with the row count. Created empty here (the
-- base table is empty at migration time); SeedRunner refreshes them after load.

-- Impressions per US state; state_id NULL = outside every polygon (unattributed).
CREATE MATERIALIZED VIEW mv_state_counts AS
SELECT state_id, count(*) AS cnt
FROM impressions
GROUP BY state_id;

-- Impressions per hour of day, in UTC and localised to each state's timezone.
CREATE MATERIALIZED VIEW mv_hour_counts AS
SELECT 'utc'::text AS mode, extract(hour FROM ts)::int AS hour, count(*) AS cnt
FROM impressions
GROUP BY 2
UNION ALL
SELECT 'local'::text, extract(hour FROM i.ts AT TIME ZONE tz.timezone)::int, count(*)
FROM impressions i
JOIN states s ON s.id = i.state_id
JOIN state_timezone tz ON tz.state = s.name
GROUP BY 2;

-- Per-device distribution, fully aggregated in SQL (no per-device list leaves the
-- database). One summary row: total devices, mean, exact median, heaviest.
CREATE MATERIALIZED VIEW mv_device_stats AS
WITH per_device AS (SELECT count(*) AS c FROM impressions GROUP BY device_id)
SELECT
    count(*)                                                    AS total_devices,
    coalesce(avg(c), 0)                                         AS mean,
    coalesce(percentile_cont(0.5) WITHIN GROUP (ORDER BY c), 0) AS median,
    coalesce(max(c), 0)                                         AS max
FROM per_device;

-- Even 10-wide bands (1–10, 11–20, …, 91–100) with the tail collapsed into 100+
-- as bucket 11. The repository maps the bucket index to its label.
CREATE MATERIALIZED VIEW mv_device_buckets AS
WITH per_device AS (SELECT count(*) AS c FROM impressions GROUP BY device_id)
SELECT least(ceil(c / 10.0)::int, 11) AS bucket, count(*) AS devices
FROM per_device
GROUP BY bucket;

-- Impressions per US calendar day (America/New_York). Black Friday reads its
-- BF-day count, the year total, and the observed-day count from here; the
-- "Friday after the 4th Thursday of November" logic stays in Kotlin.
CREATE MATERIALIZED VIEW mv_daily_counts AS
SELECT (ts AT TIME ZONE 'America/New_York')::date AS day, count(*) AS cnt
FROM impressions
GROUP BY 1;
