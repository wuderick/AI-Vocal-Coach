# Task 009A — Settings UI Polish

## Goal

Improve the usability and visual consistency of the Settings page.

This task must NOT change application logic.

Only improve layout, hierarchy, spacing and component presentation.

---

## Scope

No new functionality.

No state changes.

No business logic.

No persistence.

UI polish only.

---

## Recording Section

Current issue:

The Auto Save switch is visually detached from its label.

Improve alignment.

Requirements:

- Keep the switch vertically centered.
- Reduce excessive horizontal separation.
- The switch should visually belong to the setting row.
- Maintain responsive behavior.

---

## Theme Section

Replace radio buttons with a segmented control.

Appearance:

[ System ] [ Light ] [ Dark ]

Requirements:

- Use existing Button components if practical.
- Selected option should have a clear active style.
- Entire control should fit mobile layouts.

---

## Developer Panel

Improve readability.

Replace stacked values with key-value rows.

Example:

Theme                  Dark

Recording              Idle

Microphone             Unknown

Analysis               Idle

Current Session        None

Requirements:

- Consistent spacing
- Consistent alignment
- Easy scanning

---

## Reset Settings

Current button lacks hierarchy.

Improve visual emphasis.

Requirements:

Add a short description.

Example:

Restore all settings to their default values.

Button should remain separate from the Developer panel.

---

## Layout

Reduce unnecessary vertical whitespace.

Improve spacing consistency between:

Appearance

Recording

Developer

Reset

Do not make the page feel crowded.

---

## Component Extraction

If practical, extract reusable components:

src/components/settings/

ThemeSelector.tsx

SettingRow.tsx

DeveloperPanel.tsx

SettingsCard.tsx

Avoid placing all UI inside SettingsPage.tsx.

---

## Constraints

Do not modify application state.

Do not modify tests unless required by UI changes.

Do not change behavior.

Only improve presentation.

---

## Acceptance Criteria

Cleaner layout.

Improved visual hierarchy.

Better mobile presentation.

No duplicated UI.

Existing tests still pass.

Build passes.

Lint passes.