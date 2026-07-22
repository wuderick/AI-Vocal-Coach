# Task 018: Pitch Detection Service Foundation

## Status

Completed.

## Goal

建立 Pitch Detection 的基礎服務契約，先提供可驗證的純函式入口與 placeholder 回傳，為後續真正的音高偵測演算法預留穩定的 public API。

本 Task 不實作實際 pitch detection 演算法，只建立 service contract、輸入驗證與可測試的 foundation。

---

## Scope

### Included

- 建立 `PitchDetectionResult`
- 建立 `DetectPitchOptions`
- 建立 `PitchDetectionError`
- 建立 `detectPitch()` 的 stateless public API
- 建立輸入驗證
- 建立 placeholder result
- 建立 unit tests

### Out of Scope

- Autocorrelation
- YIN
- McLeod
- AMDF
- FFT-based pitch detection
- Note mapping
- Cent calculation
- Sharp / Flat 判定
- Pitch smoothing
- Scheduler integration
- UI
- React Hook
- Provider State
- AudioWorklet

---

## Public API

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
DetectPitchOptions
  ↓
validateInput()
  ↓
placeholder PitchDetectionResult
```

設計原則：

- Service 必須 stateless。
- Service 必須 deterministic。
- Service 不依賴 React。
- Service 不依賴 Browser APIs。
- Service 不保存 runtime、cache 或 singleton 狀態。

---

## Implementation Details

- `detectPitch()` 先驗證 `timeDomainData` 與 `sampleRate`。
- 無效輸入會丟出 `PitchDetectionError('invalid-input', ...)`。
- 於 Task 018 階段，`detectPitch()` 固定回傳 placeholder result：
  - `frequency: null`
  - `confidence: 0`
  - `isVoiced: false`
- 這個階段不做任何 pitch estimation。
- public API 保持穩定，供後續 Task 019A / 019B 擴充。

---

## Test Coverage

- `detectPitch` returns placeholder result
- rejects empty `Float32Array`
- rejects `sampleRate <= 0`
- service is stateless

---

## Acceptance Criteria

- 建立 pitch detection service foundation
- 建立 `detectPitch()`
- 建立 placeholder result
- 建立 `PitchDetectionError`
- 建立 input validation
- 建立 unit tests
- build pass
- test pass
- lint pass

---

## Validation Result

- `npm run build`: passed
- `npm test`: passed
- `npm run lint`: passed

---

## Commit Reference

- `51f587f` — `feat(audio): add pitch detection foundation`
