# Task 021: Developer Debug Panel

## Status

Draft.

## Goal

Create a developer-only debug panel to verify the complete audio pipeline in real time.

This task is strictly a UI integration layer over existing audio modules. It does not introduce new audio algorithms or modify existing signal-processing behavior.

---

## Scope

### Included

- Reuse existing Time Domain Buffer
- Reuse existing Pitch Detection
- Reuse existing Pitch Validation
- Reuse existing Pitch Mapping
- Provide a developer-only debug view for audio pipeline verification
- Display only the currently mapped pitch state needed for inspection
- Show a waiting state when no voice is detected

### Out of Scope

- Tuner UI
- Pitch history
- Pitch smoothing
- Scoring
- Animations
- New DSP algorithms
- FFT
- YIN
- MPM

---

## Public UI

Display only:

- Frequency (Hz)
- Note
- MIDI
- Cents
- Confidence
- Voiced

If no voice is detected, display:

- `Waiting for voice...`

---

## Suggested Files

- `src/components/debug/DebugPanel.tsx`
- `src/hooks/usePitchDebug.ts`
- App integration only if necessary

---

## Architecture / Processing Flow

```text
Time Domain Buffer
  ↓
Pitch Detection
  ↓
Pitch Validation
  ↓
Pitch Mapping
  ↓
Debug Panel
```

Design rules:

- Reuse existing audio services.
- Do not modify pitch detection or pitch mapping logic.
- Keep the panel developer-focused and non-product-facing.
- Only surface data already produced by the existing pipeline.

---

## Implementation Details

- The panel should consume existing audio pipeline results rather than recalculate them.
- The UI should render a compact developer inspection surface for the current pitch state.
- If pitch validity indicates no voiced signal, the panel should show the waiting message instead of numeric pitch details.
- The task is limited to wiring and presentation; all DSP behavior remains unchanged.

---

## Acceptance Criteria

- Existing audio services are reused.
- No modification to `pitchDetectionService`.
- No modification to `pitchMappingService`.
- Debug panel displays real-time information.
- `Waiting for voice...` is shown when `isVoiced` is false.
- Build passes.
- Tests pass.
- Lint passes.

---

## Validation Result

- Pending implementation.

---

## Commit Reference

- Not yet assigned.
