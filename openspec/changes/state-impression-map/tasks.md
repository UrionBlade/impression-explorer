## 1. Backend — per-state aggregate

- [x] 1.1 Repository (`JdbcClient`): grouped `count(*)` by `state_id` joined to `states.name`, plus a `WHERE state_id IS NULL` count and a total
- [x] 1.2 DTO + `@RestController` `GET /api/impressions/by-state` → `{ total, unattributed, states: [{ state, count }] }`
- [x] 1.3 Testcontainers integration test: sums reconcile (states + unattributed == total), densest state ordered first. Also verified live: 200k, 2747 unattributed, Florida top

## 2. Frontend — data layer

- [x] 2.1 Add `@tanstack/react-query` + `d3-geo`; `QueryClientProvider` in `main.tsx`
- [x] 2.2 Typed `useImpressionsByState` hook fetching `/api/impressions/by-state`
- [x] 2.3 Serve `map.json` as a static asset in `apps/web/public`

## 3. Frontend — choropleth

- [x] 3.1 Project `map.json` with `geoAlbersUsa().fitSize([975,610])` → per-state SVG paths (memoised)
- [x] 3.2 Quantised sequential colour scale (teal → blue → navy), ~6 bins; "no data" tone for states without a count
- [x] 3.3 `UsChoropleth` organism: render paths, join counts by name, colour; shapes render before data (skeleton) 
- [x] 3.4 Hover/focus interaction → tooltip with state name, count, share; states keyboard-focusable
- [x] 3.5 Legend molecule mapping bins to numeric ranges
- [x] 3.6 Reduced-motion-aware reveal (GSAP stagger; final state under reduced motion)
- [x] 3.7 Loading skeleton + non-blaming error state with retry

## 4. Page integration

- [x] 4.1 Rework `HomePage`: map as the centrepiece, remove the empty placeholder, leave room for later metric charts
- [x] 4.2 Surface the unattributed count (footnote/callout) and keep copy in both IT/EN catalogs

## 5. Verify

- [x] 5.1 End-to-end against the seeded stack: counts render, Florida/Texas/NY read as the densest; hover/legend correct
- [x] 5.2 Reduced-motion and both themes/languages check; endpoint + frontend build/tests green
