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

### Requirement: Distribution of impressions per device

The API SHALL expose the distribution of impressions per device — how many
devices fall in each fixed impressions-per-device band — plus the mean, median,
and heaviest per-device count and the total number of devices, so the shape of
how impressions spread across devices can be charted without listing every device.

#### Scenario: Distribution and summary stats

- **WHEN** a client requests `GET /api/impressions/by-device`
- **THEN** the response contains device counts bucketed into fixed impression
  ranges, plus the mean and median impressions per device, the heaviest device's
  count, and the total number of distinct devices
- **AND** the bucketed device counts sum to the total number of devices

### Requirement: Black Friday rate through the years

The API SHALL expose, for each year in the data, the Black Friday day, its
impression count, the mean daily impressions over the **rest** of that year
(Black Friday excluded), and the lift (Black Friday count ÷ that mean).

#### Scenario: Correct Black Friday day and lift

- **WHEN** a client requests `GET /api/impressions/black-friday`
- **THEN** each year's `date` is the Friday after the 4th Thursday of November of
  that year
- **AND** `lift` equals the year's Black Friday count divided by the mean daily
  impressions of the year's other days

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
