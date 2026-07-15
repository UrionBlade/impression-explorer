## 1. Backend — hour of day (local + UTC)

- [ ] 1.1 Migration `V3__state_timezone.sql`: `state_timezone(state, timezone)` reference table + INSERT the 51 state → IANA zone rows (straddling states → predominant zone)
- [ ] 1.2 Repository: UTC query (`extract(hour FROM ts)`, all rows) + local query (`extract(hour FROM i.ts AT TIME ZONE tz.timezone)`, joined through `state_timezone`), each 0-filled to 24 buckets
- [ ] 1.3 `GET /api/impressions/by-hour` → `{ local: [{ hour, count }], utc: [{ hour, count }] }`
- [ ] 1.4 Testcontainers test: both series 24 buckets; `utc` sums to total, `local` sums to the attributed total

## 2. Backend — top devices

- [ ] 2.1 Repository query: top-N by `GROUP BY device_id ORDER BY count DESC LIMIT N`, plus `COUNT(DISTINCT device_id)`
- [ ] 2.2 `GET /api/impressions/by-device` → `{ totalDevices, top: [{ deviceId, count }] }`
- [ ] 2.3 Test: ordering (densest first), N honoured, totalDevices correct

## 3. Backend — Black Friday

- [ ] 3.1 Date helper: Black Friday (Friday after the 4th Thursday of November) per year, unit-tested against known dates
- [ ] 3.2 Repository: per year, BF-day count via `(ts AT TIME ZONE 'America/New_York')::date`, year total, observed-day count → daily mean + lift
- [ ] 3.3 `GET /api/impressions/black-friday` → `[{ year, date, count, dailyMean, lift }]`
- [ ] 3.4 Test: BF dates correct, lift == count / dailyMean

## 4. Frontend — data + chart primitives

- [ ] 4.1 Query hooks: `useImpressionsByHour`, `useTopDevices`, `useBlackFriday`
- [ ] 4.2 Shared SVG chart helpers (scales, axis/labels) reused by the charts

## 5. Frontend — charts

- [ ] 5.1 Hour-of-day bar chart (24 bars) with a Local ↔ UTC switch (client-side, no refetch); the local view notes that unattributed impressions are excluded; accessible + locale-aware
- [ ] 5.2 Top-devices bar chart, with the total-devices context
- [ ] 5.3 Black Friday lift chart across years (line/bar), tooltip with count + daily mean
- [ ] 5.4 Per-chart loading skeleton + error/retry; reduced-motion-aware reveal
- [ ] 5.5 Non-visual equivalent for each chart (accessible labels or sr-only table)

## 6. Dashboard integration

- [ ] 6.1 Rework `HomePage` into a dashboard: map centrepiece, then hour full-width, then top-devices + Black Friday side by side (stacked on mobile); remove the placeholder question cards
- [ ] 6.2 IT/EN copy for all chart titles, axes, and labels

## 7. Verify

- [ ] 7.1 End-to-end against the seeded stack: all three charts render real values; sums/lift reconcile with direct SQL
- [ ] 7.2 Both themes/languages, reduced-motion, per-panel error; endpoint + frontend build/tests green
