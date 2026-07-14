## ADDED Requirements

### Requirement: Bilingual UI with browser-based language

The frontend SHALL render all user-facing text in Italian or English, choosing the language from the browser's preferred language, and falling back to English for any language it does not support. There is no manual language switcher.

#### Scenario: Italian browser renders Italian

- **WHEN** a user whose browser prefers Italian opens the app
- **THEN** the UI renders in Italian

#### Scenario: Unsupported browser language falls back to English

- **WHEN** a user whose browser prefers a language other than Italian or English opens the app
- **THEN** the UI renders in English

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
