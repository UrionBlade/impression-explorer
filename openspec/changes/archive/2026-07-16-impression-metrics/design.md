## Context

The read-path pattern (JdbcClient query → DTO → endpoint → TanStack Query → view)
is established by the map slice. This change reuses it three times for the
remaining questions and lays out the results as a dashboard around the map.

## Goals / Non-Goals

**Goals:**
- Three indexed aggregate endpoints (hour-of-day, top devices, Black Friday lift).
- Three bespoke charts consistent with the map's look, accessible and
  locale-aware, with loading/error states.
- A dashboard layout that reads as an analyst tool, with the map as the anchor.

**Non-Goals:**
- Cross-filtering between charts, date-range controls, drill-down (future).
- An expression index for hour-of-day (a 24-bucket scan over 200k rows is fine;
  revisit only if it becomes a hot path). Point-in-timezone-polygon precision for
  the local view is also out of scope (state → predominant zone is enough here).
- A charting library — see below.

## Decisions

**Three focused endpoints, fetched in parallel.** `by-hour`, `by-device`,
`black-friday` are separate REST resources (like `by-state`), each a single
query, fetched concurrently by TanStack Query. Simpler and more cacheable than
one combined payload.

- `GET /api/impressions/by-hour` → `{ local: [{ hour, count }×24], utc: [{ hour,
  count }×24] }` — both bucketings in one payload (see the hour-of-day decision
  below).
- `GET /api/impressions/by-device` → `{ totalDevices, top: [{ deviceId, count }] }`.
  Top-N (default 15) by `GROUP BY device_id ORDER BY count DESC LIMIT N`, plus
  `COUNT(DISTINCT device_id)`. Top-N because 7,968 devices can't all be charted;
  the long tail is summarised by the total.
- `GET /api/impressions/black-friday` → per year `{ year, date, count, dailyMean,
  lift }`. **Lift = count ÷ dailyMean**, the metric agreed earlier.

**Hour-of-day: local and UTC, switchable.** "Impressions per hour of day" has two
legitimate readings, so the UI offers both behind a toggle and the endpoint
returns both series in one payload (instant client-side switch, no refetch):
- **Local** — each impression bucketed by the hour in its *own* US state timezone
  (`extract(hour FROM i.ts AT TIME ZONE tz.timezone)`, joined through a small
  `state_timezone` reference table). This is the human daily rhythm: 5pm-Pacific
  and 5pm-Eastern both count as hour 17. Postgres applies DST per date. Impressions
  with no state (~2,747) can't be localised and are excluded from this series, so
  it sums to the *attributed* total; the UI notes it.
- **UTC** — every impression bucketed by its absolute UTC hour. A snapshot of
  combined national activity along the real timeline; includes all impressions, so
  it sums to the grand total.

The `state_timezone` table (state name → IANA zone) is created and populated by a
migration owned by this change — it does not touch the archived seed. States that
straddle two zones use their predominant zone (a documented approximation);
point-in-timezone-polygon precision is a deferred refinement.

**Black Friday day is computed in Kotlin, counted on a US reference timezone.**
The BF date per year (the Friday after the 4th Thursday of November) is a small
date helper (unit-tested). Impressions are attributed to a day via
`(ts AT TIME ZONE 'America/New_York')::date`, since "Black Friday" is a US local
calendar day and ts is UTC. The daily mean uses the year's **observed** days
(`yearTotal ÷ count(distinct day)`), not a hard 365, so partial-year coverage
doesn't distort the lift.

**Bespoke SVG charts, no chart library.** The map is hand-rolled SVG; matching
that for the bar/line charts keeps one visual language and avoids a generic
"chart library" look and ~another dependency on top of an already-large bundle. A
tiny shared scale/axis helper backs an hour bar chart, a top-devices bar chart,
and a Black Friday lift line. If charts later need brushing/zoom/legends beyond
this, visx is the drop-in — noted, not adopted.

**Dashboard layout.** The map stays the centrepiece; below it a metrics region
replaces the placeholder question cards: the hour-of-day bar chart full-width
(24 bars read best wide), then top-devices and Black Friday side by side on
desktop, stacked on mobile. Each panel owns its own loading/error state so one
slow/failed query doesn't blank the page.

## Risks / Trade-offs

- **Local hour depends on state → timezone accuracy** → straddling states use
  their predominant zone; the error is small against the daily-curve shape.
  Offering the UTC series alongside gives an unambiguous cross-check.
- **Black Friday tz boundary** → late-night Pacific impressions may fall on an
  adjacent UTC day; anchoring on America/New_York is a documented approximation,
  immaterial at this granularity.
- **Bespoke charts cost more code than a library** → accepted for visual
  cohesion and bundle size; the shared helper keeps duplication down.

## Open Questions

- Whether the three charts share a single combined loading skeleton or each shows
  its own — decide during implementation from how the dashboard reads.
