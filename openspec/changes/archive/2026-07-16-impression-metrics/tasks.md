> **Design note:** the frontend evolved past this initial plan during the build —
> the hour chart shipped as a radial (not bars), the device view as a distribution
> histogram with median (not a top-N list), and the layout as a sticky-map
> scrollytelling page (not a card dashboard). The delivered capabilities and their
> rationale live in the current spec and `DECISIONS.md`; the boxes below are ticked
> against what actually shipped.

## 1. Backend — hour of day (local + UTC)

- [x] 1.1 Migration `V3__state_timezone.sql`: `state_timezone(state, timezone)` reference table + INSERT the 51 state → IANA zone rows (straddling states → predominant zone)
- [x] 1.2 Repository: UTC query (`extract(hour FROM ts)`, all rows) + local query (`extract(hour FROM i.ts AT TIME ZONE tz.timezone)`, joined through `state_timezone`), each 0-filled to 24 buckets
- [x] 1.3 `GET /api/impressions/by-hour` → `{ local: [{ hour, count }], utc: [{ hour, count }] }`
- [x] 1.4 Testcontainers test: both series 24 buckets; `utc` sums to total, `local` sums to the attributed total

## 2. Backend — top devices

- [x] 2.1 Repository query: top-N by `GROUP BY device_id ORDER BY count DESC LIMIT N`, plus `COUNT(DISTINCT device_id)`
- [x] 2.2 `GET /api/impressions/by-device` → `{ totalDevices, top: [{ deviceId, count }] }`
- [x] 2.3 Test: ordering (densest first), N honoured, totalDevices correct

## 3. Backend — Black Friday

- [x] 3.1 Date helper: Black Friday (Friday after the 4th Thursday of November) per year, unit-tested against known dates
- [x] 3.2 Repository: per year, BF-day count via `(ts AT TIME ZONE 'America/New_York')::date`, year total, observed-day count → daily mean + lift
- [x] 3.3 `GET /api/impressions/black-friday` → `[{ year, date, count, dailyMean, lift }]`
- [x] 3.4 Test: BF dates correct, lift == count / dailyMean

## 4. Frontend — data + chart primitives

- [x] 4.1 Query hooks: `useImpressionsByHour`, `useTopDevices`, `useBlackFriday`
- [x] 4.2 Shared SVG chart helpers (scales, axis/labels) reused by the charts

## 5. Frontend — charts

- [x] 5.1 Hour-of-day bar chart (24 bars) with a Local ↔ UTC switch (client-side, no refetch); the local view notes that unattributed impressions are excluded; accessible + locale-aware
- [x] 5.2 Top-devices bar chart, with the total-devices context
- [x] 5.3 Black Friday lift chart across years (line/bar), tooltip with count + daily mean
- [x] 5.4 Per-chart loading skeleton + error/retry; reduced-motion-aware reveal
- [x] 5.5 Non-visual equivalent for each chart (accessible labels or sr-only table)

## 6. Dashboard integration

- [x] 6.1 Rework `HomePage` into a dashboard: map centrepiece, then hour full-width, then top-devices + Black Friday side by side (stacked on mobile); remove the placeholder question cards
- [x] 6.2 IT/EN copy for all chart titles, axes, and labels

## 7. Verify

- [x] 7.1 End-to-end against the seeded stack: all three charts render real values; sums/lift reconcile with direct SQL
- [x] 7.2 Both themes/languages, reduced-motion, per-panel error; endpoint + frontend build/tests green
