## Why

The dataset is loaded and geo-enriched, but nothing surfaces it yet. The brief's
natural centrepiece is "an interactive map of impression density". This is the
first vertical slice: it answers question 3 (impressions per US state) end to
end — SQL aggregate → API endpoint → an interactive choropleth — and in doing so
establishes the page's anchor that later metric charts arrange around.

## What Changes

- New **API endpoint** `GET /api/impressions/by-state` returning each state's
  impression count (plus the count of impressions attributed to no state), read
  from the pre-enriched `state_id` — a plain indexed `GROUP BY`.
- New **frontend data layer**: TanStack Query client + a typed hook for the
  endpoint.
- New **choropleth map** on the home page: the US states from `map.json`
  (`albersUsa` projection via d3-geo), filled on a sequential Cuebiq scale
  (teal → blue → navy) by impression count, joined to the API counts by state
  name. Hover shows a state's name, count and share; a legend explains the scale;
  the map draws in on load (reduced-motion aware).
- **Page layout** reworked so the map is the centrepiece, replacing the empty
  placeholder; the shell leaves room for the remaining metric charts as later
  slices.

## Capabilities

### New Capabilities
- `state-impression-map`: expose impressions aggregated per US state through the
  API and render them as an interactive choropleth of impression density, the
  application's centrepiece.

### Modified Capabilities
<!-- none: web-localization / motion-experience are consumed, not changed -->

## Impact

- `apps/api`: a controller + query for per-state counts (new read path over the
  existing schema; no migration).
- `apps/web`: TanStack Query dependency, d3-geo dependency, `map.json` served to
  the client, the map components, and a reworked home page.
- Depends on `impression-ingestion` (the `states` / `impressions` tables and the
  `name = level1` join contract) and builds on the `web-localization` /
  `motion-experience` foundation.
