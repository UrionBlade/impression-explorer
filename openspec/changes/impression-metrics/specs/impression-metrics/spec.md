## ADDED Requirements

### Requirement: Impressions per hour of day, local and UTC

The API SHALL expose impression counts per hour of day (0–23) in two series: a
**local** series where each impression is bucketed by the hour in its US state's
timezone, and a **UTC** series bucketed by absolute UTC hour. The frontend SHALL
let the user switch between the two.

#### Scenario: Both series present and 0-filled

- **WHEN** a client requests `GET /api/impressions/by-hour`
- **THEN** the response has a `local` and a `utc` array, each with one entry per
  hour 0–23 (hours with none present as 0)

#### Scenario: Series reconcile as expected

- **WHEN** the two series are summed
- **THEN** the `utc` series sums to the total number of impressions
- **AND** the `local` series sums to the number of impressions attributed to a
  state (those without a state are excluded, since they can't be localised)

#### Scenario: Switching the view

- **WHEN** the user toggles between local and UTC on the hour chart
- **THEN** the chart updates to the chosen series without refetching

### Requirement: Top devices by impressions

The API SHALL expose the top-N devices by impression count plus the total number
of distinct devices, so the heaviest devices can be charted without sending all
of them.

#### Scenario: Top-N and total

- **WHEN** a client requests `GET /api/impressions/by-device`
- **THEN** the response contains at most N device entries, each with a device id
  and count, ordered by count descending
- **AND** it includes the total count of distinct devices

### Requirement: Black Friday rate through the years

The API SHALL expose, for each year in the data, the Black Friday day, its
impression count, the year's average daily impressions, and the lift (Black
Friday count ÷ daily mean).

#### Scenario: Correct Black Friday day and lift

- **WHEN** a client requests `GET /api/impressions/black-friday`
- **THEN** each year's `date` is the Friday after the 4th Thursday of November of
  that year
- **AND** `lift` equals the year's Black Friday count divided by that year's mean
  daily impressions

### Requirement: Metric charts in a dashboard

The frontend SHALL render each metric as an accessible, locale-aware chart, laid
out as a dashboard alongside the map.

#### Scenario: Charts render the data

- **WHEN** the metric data has loaded
- **THEN** the hour-of-day, top-devices, and Black Friday charts each display
  their values, with numbers formatted per the active locale
- **AND** each chart has a non-visual equivalent (accessible name/label or table)
  so meaning does not rest on the bars/line alone

#### Scenario: Per-panel loading and error

- **WHEN** one metric request is still loading or fails
- **THEN** only that panel shows its loading or error (with retry) state; the
  other panels and the map stay usable

### Requirement: Reduced-motion aware chart reveals

Any chart entrance animation SHALL respect the reduced-motion preference.

#### Scenario: Reduced motion

- **WHEN** the user prefers reduced motion
- **THEN** the charts appear in their final state without entrance animation
