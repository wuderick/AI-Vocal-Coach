# Task 009 — Settings System

## Goal

Create the first functional Settings system for AI Vocal Coach.

This task validates the global application state introduced in Task 008 by providing a complete settings interface.

The focus is architecture, usability, and extensibility rather than feature richness.

---

## Scope

Implement only:

- Appearance
- Recording
- Developer

Do not implement actual audio recording or AI analysis.

---

## Appearance Section

Create a Theme selector.

Options:

- System
- Light
- Dark

Requirements:

- Read from global application state.
- Update global application state.
- Theme changes should immediately affect the entire application.
- Theme selection must remain strongly typed.

---

## Recording Section

Create one recording preference.

Auto Save Recording

Options:

- Enabled
- Disabled

Requirements:

- Store inside global application state.
- No persistence yet.
- No recording logic.

---

## Developer Section

Create a developer information panel.

Display:

Theme

Recording State

Microphone Permission

Analysis Status

Current Session ID

Display values directly from the global state.

Developer information should update automatically whenever state changes.

---

## Reset Button

Create:

Reset Settings

Requirements:

Restore default values:

Theme -> System

Recording State -> Idle

Microphone Permission -> Unknown

Analysis Status -> Idle

Current Session -> Empty

Auto Save Recording -> Enabled

Implement using reusable state actions.

Do not duplicate reset logic.

---

## UI Requirements

Reuse existing design system components.

Use:

Card

Section

Button

Switch

Container

Typography

Spacing

Responsive layout.

Desktop

Tablet

Mobile

---

## Architecture

Avoid prop drilling.

Access state only through reusable hooks.

Do not consume React Context directly inside pages.

Separate presentation from state logic whenever practical.

---

## Future Compatibility

The Settings system should be easy to extend with future sections such as:

Audio

Analysis

Storage

Export

Accessibility

Language

Developer Tools

without restructuring existing code.

---

## Tests

Add tests for:

Theme selection

Auto Save toggle

Reset Settings

Developer panel rendering

---

## Acceptance Criteria

Theme updates application state.

Auto Save updates state.

Developer panel reflects current state.

Reset restores defaults.

Responsive layout.

Strong TypeScript typing.

No duplicated logic.

Build succeeds.

Tests succeed.

Lint succeeds.

---

## Verification

Run:

npm run build

npm test

npm run lint