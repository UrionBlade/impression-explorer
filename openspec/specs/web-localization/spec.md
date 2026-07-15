# web-localization Specification

## Purpose
TBD - created by archiving change bootstrap-platform. Update Purpose after archive.
## Requirements
### Requirement: Route-based bilingual UI

The language SHALL be carried by the route (`/it`, `/en`). Opening a path without a supported language SHALL redirect to the language of the browser's preference, falling back to English. A language switcher SHALL let the user change language by navigating between the two routes.

#### Scenario: Root redirects to the browser language

- **WHEN** a user whose browser prefers Italian opens `/`
- **THEN** they are redirected to `/it` and the UI renders in Italian

#### Scenario: Unsupported language route falls back to English

- **WHEN** a user opens a path whose language segment is neither `it` nor `en` (or none)
- **THEN** they are redirected to the browser's language, or English if it is unsupported

#### Scenario: Switching language changes the route

- **WHEN** the user selects the other language from the switcher
- **THEN** the app navigates to that language's route and all visible text updates

### Requirement: No hard-coded user-facing strings

User-facing copy SHALL come from per-language message catalogs, not literals embedded in components, so every string exists in both languages.

#### Scenario: Missing translation is caught

- **WHEN** a string key exists in one catalog but not the other
- **THEN** the mismatch is detectable (a check/test fails or a visible fallback flags it) rather than shipping an untranslated string silently

### Requirement: Locale-aware number and date formatting

Numbers (impression counts) and dates SHALL be formatted according to the active locale (e.g. thousands separators, date order), not with a single hard-coded format.

#### Scenario: Number formatting follows locale

- **WHEN** the same count is shown in Italian and in English
- **THEN** it is formatted per each locale's conventions (e.g. `1.234` vs `1,234`)

