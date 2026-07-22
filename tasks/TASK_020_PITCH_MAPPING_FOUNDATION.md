# Task020 — Pitch Mapping Foundation

Status: Completed

Commit: Pending

---

## Goal

Provide a pure and deterministic service that converts a detected frequency into musical pitch information.

---

## Scope

- Add pitchMappingService.ts
- Add pitchMappingService.test.ts
- No modification to PitchDetectionService
- No React
- No Browser API
- No AudioContext

---

## Public API

```ts
mapFrequencyToPitch(frequency): PitchMappingResult
```

Returns:

- midi
- note
- octave
- cents
- referenceFrequency

---

## Processing Flow

Frequency

↓

Frequency → MIDI

↓

Nearest MIDI

↓

Reference Frequency

↓

Cent Offset

↓

PitchMappingResult

---

## Test Coverage

- A0
- A1
- A2
- A3
- A4
- A5
- C4
- C5
- C8
- Positive cents
- Negative cents
- NaN
- Infinity
- Zero
- Negative frequency

---

## Validation

- npm run build ✅
- npm test ✅ (16 files / 212 tests)
- npm run lint ✅