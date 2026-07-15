# state-impression-map Specification

## Purpose
TBD - created by archiving change state-impression-map. Update Purpose after archive.
## Requirements
### Requirement: Per-state impression counts endpoint

The API SHALL expose impressions aggregated per US state, plus the count of
impressions attributed to no state and the overall total, from the pre-resolved
`state_id` (no geometry at request time).

#### Scenario: Counts returned

- **WHEN** a client requests `GET /api/impressions/by-state`
- **THEN** the response contains a total, an unattributed count, and one entry per
  state with a name and an impression count
- **AND** the sum of every state's count plus the unattributed count equals the
  total

#### Scenario: State name matches the map join key

- **WHEN** a state entry is returned
- **THEN** its name equals the corresponding `map.json` `level1` value, so the
  frontend can join it to a map feature

### Requirement: Choropleth of impression density

The frontend SHALL render the US states as a choropleth, colouring each state by
its impression count on a sequential brand scale, joining API counts to map
features by name.

#### Scenario: States coloured by count

- **WHEN** the counts have loaded
- **THEN** each state is filled according to its count, higher counts more
  saturated along the scale
- **AND** a state with no returned count is shown in a distinct "no data" tone,
  not as the lowest bin

#### Scenario: Map shapes render before data

- **WHEN** the page loads and the counts are still in flight
- **THEN** the state shapes are already drawn (uncoloured/skeleton) rather than a
  blank area

### Requirement: Legend and per-state detail, not colour alone

Meaning SHALL NOT depend on colour alone: a legend gives the numeric ranges, and
each state's exact figures are available on interaction.

#### Scenario: Legend present

- **WHEN** the choropleth is shown
- **THEN** a legend maps colour bins to their numeric count ranges

#### Scenario: State detail on hover or focus

- **WHEN** the user hovers or keyboard-focuses a state
- **THEN** its name, impression count and share of the total are shown

### Requirement: Loading and error states

The map view SHALL communicate loading and failure without breaking the page.

#### Scenario: Load failure

- **WHEN** the counts request fails
- **THEN** the view shows a non-blaming error with a way to retry, and the page
  chrome stays intact

### Requirement: Reduced-motion aware reveal

Any entrance animation of the map SHALL respect the reduced-motion preference.

#### Scenario: Reduced motion

- **WHEN** the user prefers reduced motion
- **THEN** the map appears in its final state without the entrance animation, fully
  usable

