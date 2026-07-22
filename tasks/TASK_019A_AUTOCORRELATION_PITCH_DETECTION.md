# Task 019A: Autocorrelation Pitch Detection

## Status

Completed.

## Goal

實作第一個真正可用的 pitch detection 演算法，使用 normalized autocorrelation 從 time-domain samples 估算基礎音高。

本 Task 以 frequency estimation 為主，建立穩定的 autocorrelation pipeline、搜尋範圍、峰值選擇與 lag-to-frequency 轉換。

---

## Scope

### Included

- normalized autocorrelation pitch detection
- 60Hz–1000Hz search range
- DC offset removal
- local peak selection
- near-best earliest peak rule
- parabolic lag interpolation
- frequency estimation
- stateless behavior
- unit tests for representative tones and invalid inputs

### Out of Scope

- RMS gate
- confidence calculation
- voiced / unvoiced decision
- note mapping
- cent calculation
- smoothing
- FFT
- YIN
- McLeod
- AMDF
- Scheduler integration
- UI
- React Hook
- Provider State

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
computeNormalizedAutocorrelation()
  ↓
findBestLag()
  ↓
parabolic refinement
  ↓
lagToFrequency()
  ↓
PitchDetectionResult
```

Design rules:

- Service remains stateless and pure.
- No module-level mutable state.
- No cache or singleton.
- No dependency on React, Browser APIs, or AudioContext.

---

## Implementation Details

- Search range is constrained to `MIN_FREQUENCY = 60` and `MAX_FREQUENCY = 1000`.
- `timeDomainData` is centered by removing DC offset before correlation.
- Autocorrelation is normalized using signal energy, not raw correlation alone.
- Peak selection prefers the earliest local peak that is sufficiently close to the global peak to avoid later periodic multiples on clean periodic signals.
- Parabolic interpolation refines the selected lag when neighboring samples are available.
- The final frequency is rejected if it falls outside the supported 60Hz–1000Hz range.
- The service returns the same placeholder confidence/isVoiced shape as the public contract, while frequency estimation is now functional.

---

## Test Coverage

- 61Hz sine wave
- 220Hz sine wave
- 440Hz sine wave
- 523.25Hz sine wave
- 880Hz sine wave
- 997Hz sine wave
- silence returns null
- DC offset does not affect estimation
- short buffer returns null
- invalid input throws
- service is stateless

---

## Acceptance Criteria

- normalized autocorrelation pitch detection implemented
- 60Hz–1000Hz search range enforced
- DC offset removal implemented
- local peak selection implemented
- near-best earliest peak rule implemented
- parabolic lag interpolation implemented
- frequency estimation implemented
- stateless behavior preserved
- tests for representative pitches and invalid inputs pass
- build pass
- test pass
- lint pass

---

## Validation Result

- `npm run build`: passed
- `npm test`: passed
- `npm run lint`: passed
- Full suite passed with 193 tests at completion of Task 019A

---

## Commit Reference

- `2f3032b` — `feat(audio): implement autocorrelation pitch detection`
