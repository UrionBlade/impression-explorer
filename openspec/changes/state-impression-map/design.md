## Context

`impressions.state_id` is already resolved and indexed, so "impressions per state"
is a plain `GROUP BY`. This slice exposes that over HTTP and renders it as the
choropleth centrepiece, establishing the read path (query → DTO → endpoint →
TanStack Query → view) that later metric slices reuse.

## Goals / Non-Goals

**Goals:**
- One indexed aggregate endpoint for per-state counts, plus the unattributed count.
- An interactive, accessible choropleth that reads well in both themes and both
  languages, with graceful loading/error states.
- Reusable data-fetching wiring (TanStack Query) and a page layout with the map
  as the anchor.

**Non-Goals:**
- The other three metrics (hour, device, Black Friday) — later slices.
- Click-through drill-down, date-range filtering, server-side spatial binning
  (the choropleth is per-state; no PostGIS).
- Replacing the static `map.json` with vector tiles / topojson optimisation.

## Decisions

**Endpoint: `GET /api/impressions/by-state` → `{ total, unattributed, states: [{ state, count }] }`.**
`state` is the state name (`states.name`, i.e. GeoJSON `level1`) — the join key
the frontend already keys the map on. Returning `total` and `unattributed`
alongside lets the UI show each state's share and surface impressions outside any
US polygon without a second request. Backed by two cheap queries (a grouped join
and a `WHERE state_id IS NULL` count), both hitting `idx_impressions_state_id`.

**Backend uses `JdbcClient`, not a repository abstraction.** This is a read-only
analytical aggregate, not entity CRUD. A single `JdbcClient` query in a thin
`@Repository` returning a DTO is the least indirection and keeps the SQL visible
(the brief values query thinking). A controller maps it to the JSON above.

**Frontend renders the map from static `map.json` with d3-geo; the API supplies
only numbers.** The GeoJSON is reference geometry, not runtime data, so it is
served as a static asset (`apps/web/public/map.json`) and projected client-side
with `geoAlbersUsa().fitSize(...)` (the projection `map.json` declares; it also
repositions AK/HI). The map draws its shapes immediately and colours them once
the counts arrive — progressive, and the shapes never block on the network.

**Sequential colour scale, quantised into bins, hand-rolled.** Density maps read
best with a small number of legible steps and a legend, not a continuous ramp. We
quantise counts into ~6 bins and colour them along the brand ramp teal → blue →
navy (from `.impeccable.md`). A 3-stop interpolation is a few lines, so we add
only `d3-geo` (needed for the projection) and skip `d3-scale`/chromatic. Colour is
never the sole signal: the legend shows the numeric ranges and hover shows the
exact value.

**TanStack Query for data fetching.** Gives caching, loading/error state, and a
reusable pattern for the next slices, via a `QueryClientProvider` and a typed
`useImpressionsByState` hook. In dev the Vite proxy and in prod the nginx proxy
put web and API on one origin, so no CORS config is needed.

**Responsive via a fixed projection + `viewBox`.** The projection fits a fixed
`975×610` canvas once; the SVG scales with `width:100%` and `viewBox`, so no
resize recomputation. Hover uses per-path pointer events; the tooltip follows the
cursor and is also reachable by keyboard focus on each state.

## Risks / Trade-offs

- **Colour-only meaning excludes some users** → legend carries numeric ranges,
  every state is focusable, and hover/focus shows the exact count + share.
- **`map.json` is ~1 MB fetched by the client** → acceptable for now; cache it and,
  if it matters later, ship topojson. Noted, not solved here.
- **A state name present in `map.json` but absent from the API (zero impressions)**
  → rendered in a distinct "no data" tone, not bin 0, so empty ≠ low.
- **AK/HI far geometry** → `map.json` longitudes stop at ~-168 (no antimeridian
  wrap), so `geoAlbersUsa` projects them cleanly.

## Open Questions

- Whether the unattributed count deserves its own small callout or just a footnote
  under the map — decide during implementation from how it looks.
