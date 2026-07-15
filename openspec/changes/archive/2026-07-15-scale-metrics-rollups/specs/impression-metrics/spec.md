## ADDED Requirements

### Requirement: Metrics served from pre-aggregated rollups

Every analytical metric SHALL be served from a pre-aggregated rollup refreshed after the seed, so serving cost is independent of the impression row count. This covers all four aggregates (per state, per hour of day, per-device distribution, Black Friday per year): no metric endpoint may scan the full `impressions` table on a request, and none may materialise a per-device (or per-row) collection in application memory. Response shapes are unchanged.

#### Scenario: Serving does not scan the base table

- **WHEN** any metric endpoint is requested after a seed
- **THEN** the response is computed from a bounded rollup relation, not by
  scanning `impressions`
- **AND** the per-device distribution (buckets, mean, median, max) is computed in
  SQL, without loading per-device counts into application memory

#### Scenario: Rollups reflect the seeded data

- **WHEN** the seed completes and refreshes the rollups
- **THEN** each metric endpoint returns the same values it would from an
  equivalent aggregate over the base table (per-state counts reconcile with the
  unattributed count; the hour series still sum to the total and the attributed
  total; the median is the true median of impressions per device)
