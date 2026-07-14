## ADDED Requirements

### Requirement: Bilingual UI (Italian and English)

The frontend SHALL render all user-facing text in either Italian or English, selected at runtime, with English as the default when no preference is known.

#### Scenario: Default language

- **WHEN** a user opens the app with no prior language preference
- **THEN** the UI renders in English

#### Scenario: Switching language

- **WHEN** the user selects the other language from the language switcher
- **THEN** all visible UI text updates to that language without a full page reload
- **AND** the choice persists across reloads

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
