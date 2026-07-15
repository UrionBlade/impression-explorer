## Why

The map answers "impressions per state". Three of the brief's four questions
remain — per hour of day, per device, and the Black Friday rate through the
years. Each is a single indexed aggregate plus one chart; splitting them into
three separate changes would be more process than substance. This change ships
all three together and, in doing so, settles the page's information architecture:
where the charts sit relative to the map.

## What Changes

- Three read endpoints over the existing schema (indexed aggregates, no migration):
  - `GET /api/impressions/by-hour` → count per **local** hour-of-day (0–23), each
    impression converted to its US state's timezone so the curve reflects real
    daily behaviour rather than a UTC smear across zones.
  - `GET /api/impressions/by-device` → the top-N devices by impression count,
    plus the total device count.
  - `GET /api/impressions/black-friday` → per year: the Black Friday day, its
    impression count, the annual daily mean, and the **lift** (BF count ÷ daily
    mean).
- Three bespoke, on-brand chart components (SVG, matching the map's style rather
  than a generic chart library): an hour-of-day bar chart, a top-devices bar
  chart, and a Black Friday lift chart across the years — each with TanStack
  Query data fetching, loading/error states, locale-aware formatting, and
  reduced-motion-aware reveals.
- **Dashboard layout**: the map stays the centrepiece; the three charts arrange
  below it as an analyst dashboard, replacing the placeholder "questions" list.

## Capabilities

### New Capabilities
- `impression-metrics`: expose impressions aggregated by hour-of-day, by device
  (top-N), and by Black Friday day per year (with lift), and present them as
  charts in a dashboard around the map — completing the four analytical questions.

### Modified Capabilities
<!-- none: state-impression-map is composed alongside, not changed -->

## Impact

- `apps/api`: three controller endpoints + queries. Adds a small `state_timezone`
  reference table (state → IANA timezone), created and populated by a migration in
  this change (no change to the archived seed). Black Friday needs a date helper —
  the Friday after the 4th Thursday of November, on a US reference timezone.
- `apps/web`: three chart components, their query hooks, and a reworked home page
  (dashboard). Depends on `impression-ingestion` (the data) and reuses the
  `web-localization` / `motion-experience` foundations and the `state-impression-map`
  read-path pattern.
