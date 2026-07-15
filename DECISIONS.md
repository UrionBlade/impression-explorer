# Product decisions

The brief is intentionally open in places. This file records the product-level
calls I made, why I made them, and the questions I'd put back to you. Engineering
rationale (no PostGIS, ingest-time geo-join, spec-driven flow) lives in the
[`openspec/`](./openspec) change history; this file is about *what the numbers
mean*, not how they're computed.

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

> This is the first thing I'd confirm with you — see Open questions.

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
- Impressions that fall **outside every US state polygon** (offshore points,
  island fragments, bad coordinates) are **not silently dropped** — they're
  counted as "unattributed" and shown as a footnote (`N impressions outside any
  US state`). Hiding them would make the state totals quietly not add up.
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

## Cross-cutting UI rules

- **Never render `NaN`.** Any non-finite value formats to `—`. A metric we can't
  compute shows a dash, never `NaN`.
- **Every chart has an accessible table** (`sr-only`) mirroring the data, and
  respects `prefers-reduced-motion` (charts render fully drawn, no animation).
- **Chart animations trigger on scroll into view**, not on load, so the
  storytelling reads in order as you scroll.

## Open questions (I'd rather ask than assume)

1. **Definition of impression.** Is "one ad served to one device" the right
   model? Specifically: is `device_id` a stable advertising ID, and should any
   dedup happen (same device, same second)?
2. **Outlier devices.** A device with ~13k impressions is 500× the median — real
   heavy user, ad-tech test traffic, or a bot? Right now we keep them and let the
   median absorb the distortion, but we could flag/exclude them if you have a
   policy.
3. **Split-state timezones.** A few states span two zones (e.g. Florida ET/CT).
   We pick the **predominant** zone per state for the local-hour bucketing. Good
   enough, or do you want per-coordinate timezone resolution?
4. **Unattributed impressions.** ~2.7k points fall outside every state polygon.
   Keep-and-label (current) or a different treatment?
5. **Black Friday baseline.** Is "mean of the rest of the year" the comparison
   you want, or would you rather see it against, say, the November median or the
   same weekday across the month?
