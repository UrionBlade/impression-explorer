# Product decisions

The brief is intentionally open in places. Where it was, I picked an approach,
treated it as settled, and explain the reasoning here — these are decisions, not
questions. Engineering rationale (no PostGIS, ingest-time geo-join, spec-driven
flow) lives in the [`openspec/`](./openspec) change history; this file is about
*what the numbers mean*, not how they're computed.

## What is an "impression"?

The brief never defines it, so I fixed an assumption and built on it:

> An impression is **one ad served to one device, at one place, at one time**.
> Each CSV row (`device_id, lat, lng, timestamp`) is exactly that event.

Consequences I carried through the whole product:

- It is **not a purchase** and not a conversion — it sits at the top of the
  funnel, before any user action.
- It is **not a confirmed human view** — "served to the screen", not
  "consciously seen" (viewability is a separate metric we don't have).
- It is **a device, not a person**. `device_id` is a pseudonymous mobile
  advertising ID; one person may own several, and IDs reset over time. So
  "impressions per device" answers *per-device*, and we never phrase it as
  "per user".
- We have a **point, not a trajectory**: lat/lng is where the device was *when
  the ad was served*, not how it moved. We don't infer mobility.

Everything the app shows is a different cut of this one event: **where** (state),
**how concentrated per device**, **at what hour**, and **how it changes across
years** (Black Friday).

We treat **each CSV row as one distinct impression** — no de-duplication — and
`device_id` as a **stable pseudonymous advertising ID** for the window of the
dataset. Two impressions from the same device in the same second are two
impressions: at this granularity they're genuine repeated deliveries, and
collapsing them would need a rule the data doesn't justify.

## Hour of day: local time vs UTC (we show both)

An ad served at 8pm in New York and 8pm in California is the **same human hour**
(evening prime time) but **different UTC hours**. For "impressions by hour of
day" the analyst almost always means the *human* rhythm, so:

- **Local time is the default.** Each impression is bucketed by the wall-clock
  hour **in its own state's timezone** (`ts AT TIME ZONE tz`, joined through a
  state→IANA-timezone reference table). This is the view that answers "when in
  the day are people served ads?".
- **UTC is available via a toggle**, for the absolute/technical view — a single
  global instant, useful for infrastructure/load reasoning or sanity checks.

Why both instead of picking one: they answer different questions and it costs us
almost nothing — the backend returns both series in one payload, so the toggle is
instant on the client.

**Why the analyst cares:** the local view is what tells you the *best time to
serve ads*. People engage with ads at particular points in their own day (early
afternoon is a strong window — our data peaks around **13:00 local**), and that's
a fact about their local clock, not UTC. Aggregate the same impressions in UTC
and that peak gets **smeared across the timezones** — a 1pm-local peak in New York
and in California land on different UTC hours and flatten each other out. So the
local series is the actionable one for scheduling; UTC is the operational one.

**Split-state timezones.** A few states span two zones (e.g. Florida ET/CT). We
bucket every impression by its state's **predominant** zone, not by a per-
coordinate timezone lookup. We attribute location at state granularity, so the
timezone follows the same granularity: the predominant zone is correct for the
large majority of a split state's impressions, and per-point resolution would add
a geographic lookup for a difference that only shifts a small border minority by
one hour.

Honest caveat surfaced in the UI: the local view only covers impressions we could
attribute to a state (≈197k of 200k); the rest have no timezone and are excluded
from the local series but present in UTC. We label this rather than hide it.

## Black Friday: compared to the mean of the rest of the year

The interesting number isn't "how many impressions on Black Friday" in isolation
— it's **how much bigger than normal** it is. The question is: normal compared to
*what*?

Options I rejected:
- **The day before / a nearby day** — arbitrary, and itself distorted by the
  pre-Black-Friday ramp.
- **A "typical day"** — vague, and easy to read as a hand-picked day.
- **The November median, or the same weekday across November** — narrower and
  more seasonal, but they compare Black Friday against a window that's *already*
  lifted by the holiday-shopping build-up, which shrinks the very effect we're
  measuring. The full-year mean is the neutral reference.

What we use:
- **Baseline = the mean daily volume of the rest of that year**
  `(yearTotal − blackFridayCount) / (observedDays − 1)`.
- **Lift = blackFridayCount / baseline.**
- We show **both the Black Friday value and the baseline line**, per year, so the
  gap is visible, not just a single multiplier.

Black Friday itself is computed as the **Friday after the 4th Thursday of
November** (the US convention), per year, in `America/New_York`.

## Impressions per state: attribution and the leftovers

- State is resolved **once at ingest** by point-in-polygon (ray casting) against
  the US map, then stored as an indexed `state_id`. Per-state queries are a plain
  `GROUP BY`.
- **51 "states"** includes the District of Columbia.
- The ≈2.7k impressions that fall **outside every US state polygon** (offshore
  points, island fragments, bad coordinates) are **kept and labelled**, not
  dropped and not snapped to the nearest state. Both alternatives are worse:
  dropping them makes the state totals quietly not add up, and snapping invents a
  location the data doesn't support. We count them as "unattributed" and show them
  as a footnote (`N impressions outside any US state`).
- The choropleth color scale is **theme-independent** (one fixed light ramp): the
  same count maps to the same color in light and dark mode, so switching theme
  never flips the reading of the map.

## Impressions per device: median over mean, even buckets

The distribution is extremely skewed — most devices send a handful of
impressions, a few send thousands (max observed ≈13,351 against a mean of ≈25).

- We report **median** as the representative "typical device", not the mean.
  With a tail that long, the mean is misleading; the median (≈8) actually
  describes a normal device. Mean and max are shown alongside for context, not as
  the headline.
- Buckets are **even and comparable** (`1–10, 11–20, …, 91–100, 100+`) so bar
  lengths mean the same thing across the axis. The `100+` bucket absorbs the tail.

We **keep the extreme devices** (the ≈13k-impression one, ~500× the median)
rather than filtering them. Whether that's a heavy user or ad-tech test traffic,
the median already stops it from distorting the "typical device", and dropping
raw data would need a policy the brief doesn't set. It stays in the totals and in
the `100+` bucket, visible, not silently removed.

## Cross-cutting UI rules

- **Every chart has an accessible table** (`sr-only`) mirroring the data, and
  respects `prefers-reduced-motion` (charts render fully drawn, no animation).
- **Chart animations trigger on scroll into view**, not on load, so the
  storytelling reads in order as you scroll.
