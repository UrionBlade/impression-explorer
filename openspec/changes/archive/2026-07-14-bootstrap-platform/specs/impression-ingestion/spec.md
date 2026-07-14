## ADDED Requirements

### Requirement: US states reference data

The system SHALL populate a `states` reference table with one row per US state from the GeoJSON (`assets/map.json`), keyed by a stable name, so impressions can reference a state by id and the frontend can join aggregates back to the map by name. Polygon geometry is read from `map.json` by the seed for the join and by the frontend for rendering; it is not duplicated in the database.

#### Scenario: States table populated from GeoJSON

- **WHEN** the seed runs against an empty database
- **THEN** the `states` table contains one row per state feature in `map.json`, each with a non-null, unique name

### Requirement: Impression bulk load

The system SHALL load every row of `assets/impressions.csv` into an `impressions` table with columns for `device_id`, latitude, longitude, and the event timestamp stored as a timezone-aware instant (from Unix epoch seconds, UTC).

#### Scenario: All rows loaded

- **WHEN** the seed runs against an empty database
- **THEN** the number of rows in `impressions` equals the number of data rows in `impressions.csv` (200,000)
- **AND** each row's timestamp round-trips to the original Unix epoch second

#### Scenario: Malformed rows are rejected, not silently dropped

- **WHEN** a CSV row is missing a field or has a non-numeric coordinate or timestamp
- **THEN** the seed fails loudly (non-zero exit, error identifying the row) rather than importing a partial or corrupt dataset

### Requirement: State geo-join at ingest

The system SHALL resolve each impression to the US state whose polygon contains its `(lng, lat)` point, at ingest time (point-in-polygon), and store the result as an indexed `state_id` foreign key on the impression row — so that per-state aggregation never evaluates geometry at query time.

#### Scenario: Impression inside a state is attributed

- **WHEN** an impression's coordinate falls within exactly one state polygon
- **THEN** its `state_id` references that state

#### Scenario: Impression outside all US state polygons

- **WHEN** an impression's coordinate falls outside every state polygon (e.g. offshore, or a territory not in `map.json`)
- **THEN** its `state_id` is NULL and the row is still loaded
- **AND** the seed reports the count of unattributed impressions

### Requirement: Analytical indexing

The system SHALL index the `impressions` table to support the product's aggregations — grouping by state, by hour-of-day, and filtering/grouping by date — without full-table scans becoming the only access path as the dataset grows.

#### Scenario: Indexes present after migration

- **WHEN** migrations have been applied
- **THEN** indexes exist that cover per-state grouping (`state_id`) and time-based access (`ts`)

### Requirement: Idempotent, re-runnable seed

The seed SHALL be safe to run more than once, converging to the same loaded state without duplicating rows or requiring a manual database reset.

#### Scenario: Re-running the seed does not duplicate data

- **WHEN** the seed is run a second time on an already-populated database
- **THEN** the final row counts in `states` and `impressions` are unchanged from after the first run
