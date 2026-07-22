# Task 019B: Pitch Validation Foundation

## Status

Completed.

## Goal

在 Task 019A 的 frequency estimation 基礎上，增加 pitch validity / reliability 評估，讓系統能更穩定地判斷估算音高是否可信。

本 Task 不改變 public API，僅強化 RMS gate、confidence 推導與 voiced / unvoiced decision。

---

## Scope

### Included

- RMS gate
- confidence from the selected autocorrelation peak
- voiced / unvoiced decision
- no second autocorrelation pass
- deterministic white-noise tests
- low-amplitude rejection
- tone-plus-noise validation
- private helper expansion

### Out of Scope

- FFT
- YIN
- MPM
- note mapping
- MIDI conversion
- cent calculation
- smoothing
- React hooks
- Scheduler
- UI
- AudioWorklet
- recomputing autocorrelation solely for confidence

---

## Public API

Public API unchanged:

```ts
export interface PitchDetectionResult {
  readonly frequency: number | null;
  readonly confidence: number;
  readonly isVoiced: boolean;
}

export interface DetectPitchOptions {
  readonly timeDomainData: Float32Array;
  readonly sampleRate: number;
}

export function detectPitch(options: DetectPitchOptions): PitchDetectionResult;
```

---

## Architecture / Processing Flow

```text
validateInput()
  ↓
removeDcOffset()
  ↓
computeRms()
  ↓
Normalized Autocorrelation
  ↓
Peak Selection
  ↓
Parabolic Refinement
  ↓
Frequency
  ↓
Confidence
  ↓
Voiced Decision
  ↓
PitchDetectionResult
```

Design rules:

- Service remains pure and stateless.
- No module-level mutable state.
- No additional autocorrelation pass for confidence.
- Confidence must be derived from the already-selected peak.

---

## Implementation Details

- Added `MIN_RMS = 0.01` as the RMS gate threshold.
- Added `MIN_CONFIDENCE = 0.6` as the voiced threshold.
- RMS is computed as `sqrt(mean(x²))` after DC offset removal.
- Silence or signals below the RMS gate return the invalid placeholder result immediately.
- Confidence is derived directly from the selected normalized autocorrelation peak and clamped to `[0, 1]`.
- `isVoiced` requires all conditions:
  - `frequency !== null`
  - `confidence >= MIN_CONFIDENCE`
  - `rms >= MIN_RMS`
- White-noise and low-amplitude cases are rejected deterministically without changing the public API.

---

## Test Coverage

- strong 440Hz tone returns high confidence and voiced true
- silence returns confidence 0 and voiced false
- low-amplitude 440Hz returns null / zero confidence / unvoiced
- white noise returns very low or zero confidence and voiced false
- 440Hz + 5% white noise stays near 440Hz and voiced true
- stateless behavior still holds

---

## Acceptance Criteria

- Public API unchanged
- Service remains stateless
- Confidence computed without a second autocorrelation pass
- RMS gate prevents silence from being detected as pitch
- Unit tests cover tone, silence, noise, and mixed signals
- build pass
- test pass
- lint pass

---

## Validation Result

- `npm run build`: passed
- `npm test`: passed
- `npm run lint`: passed
- Full suite passed with 197 tests at completion of Task 019B

---

## Commit Reference

- `e86a39d` — `feat(audio): add pitch validation foundation`
