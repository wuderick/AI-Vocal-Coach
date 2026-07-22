# Task 017: Time-Domain Buffer Foundation

## Summary

建立 Time-Domain Audio Buffer Foundation，讓 Provider 可以從既有 AnalyserNode 讀取時域波形資料（time-domain samples），作為後續 Pitch Detection 的前置基礎。

本 Task 僅定義任務規格與邊界，不包含程式碼實作。

---

## Background

目前專案已完成：

- Task 010 Microphone Permission
- Task 011 Audio Device Foundation
- Task 012 Audio Capture Foundation
- Task 013 Audio Graph Foundation
- Task 014 Frequency Buffer Foundation
- Task 015 Frequency Buffer Update Pipeline
- Task 016 Frequency Update Scheduler Foundation

現階段已有：

- Capture Runtime lifecycle
- Audio Graph Runtime（含 AnalyserNode）
- Frequency Buffer Runtime 與更新管線

Task 017 需補齊「Time-Domain Buffer Runtime + Service + Provider/Hook 接口規格」，並明確與 Frequency Buffer 職責分離。

---

## Goal

建立可管理的 time-domain buffer 基礎能力，使系統可透過既有 AnalyserNode：

- 初始化時配置 timeDomainData: Float32Array
- 更新時寫入 getFloatTimeDomainData() 資料
- 在 capture lifecycle 中安全初始化與清理

此能力僅作為未來 Pitch Detection 輸入基礎，本 Task 不加入任何分析演算法。

---

## Scope

### Included

- 新增獨立 timeDomainBufferService
- 定義 TimeDomainBufferRuntime
- 根據 analyserNode.fftSize 初始化 Float32Array
- 提供一次性更新 API（使用 analyserNode.getFloatTimeDomainData）
- Provider 擁有 runtime reference 與 lifecycle 編排
- Hook 暴露 time-domain buffer 相關讀取/更新入口（規格層）
- 明確 error code contract
- 明確 runtime invariants
- StrictMode 與 stale async operation 生命週期考量

### Out of Scope

- Pitch Detection 演算法
- UI rendering
- AudioWorklet
- Scheduler 自動啟動
- Frequency Buffer 責任重構

---

## Out of Scope

以下項目明確不在本 Task 範圍：

- 不新增 pitch detection、formant、VAD、FFT feature extraction
- 不新增 waveform 視覺化、Canvas、圖表元件
- 不新增錄音、匯出、回放流程
- 不新增 AudioWorklet 或背景執行緒音訊處理
- 不啟用任何自動 scheduler 行為
- 不改變 frequencyBufferService 既有責任邊界

---

## Architecture

```text
Hook
  |
  v
Provider Action
  |
  v
timeDomainBufferService
  |
  v
AnalyserNode
```

設計原則：

- Service 必須 stateless。
- Service 不持有 module-level mutable state。
- Runtime reference 由 Provider 擁有。
- Service 僅接收外部 runtime 與 analyserNode 執行 initialize / update / dispose。

---

## Data Flow

### Initialize Flow

1. Provider 取得可用 analyserNode
2. Provider 呼叫 timeDomainBufferService.initializeTimeDomainBuffer({ analyserNode })
3. Service 依 analyserNode.fftSize 配置 Float32Array
4. Provider 保存 runtime reference

### Update Flow

1. Provider（或由 Hook 觸發 Provider action）呼叫 update
2. Service 呼叫 analyserNode.getFloatTimeDomainData(timeDomainData)
3. 資料寫入既有 Float32Array（in-place）
4. 回傳同一個 Float32Array reference

### Dispose Flow

1. Provider 在 stop/reset/unmount 呼叫 dispose
2. Service 回傳初始 runtime
3. Runtime 回到初始 invariant

---

## Runtime Ownership

### TimeDomainBufferRuntime

至少包含：

- timeDomainData: Float32Array | null
- fftSize: number

可擴充欄位（若後續需要）應保持與 Service stateless 邊界一致。

### Ownership Rules

- Provider owns the runtime reference.
- Service may read/return runtime data but must not retain or cache runtime.
- Service must never create global mutable runtime storage.
- Runtime replacement 與 dispose 時機由 Provider 決定。

---

## Proposed Types

```ts
export type TimeDomainBufferErrorCode =
  | 'invalid-runtime'
  | 'buffer-init-failed';

export class TimeDomainBufferError extends Error {
  readonly code: TimeDomainBufferErrorCode;
}

export interface TimeDomainBufferRuntime {
  timeDomainData: Float32Array | null;
  fftSize: number;
}

export interface InitializeTimeDomainBufferOptions {
  analyserNode: AnalyserNode | null;
}

export interface ReadTimeDomainDataOptions {
  analyserNode: AnalyserNode | null;
  runtime: TimeDomainBufferRuntime | null;
}
```

---

## Proposed Service API

```ts
export const initialTimeDomainBufferRuntime: TimeDomainBufferRuntime;

export function initializeTimeDomainBuffer(
  options: InitializeTimeDomainBufferOptions,
): TimeDomainBufferRuntime;

export function readTimeDomainData(
  options: ReadTimeDomainDataOptions,
): Float32Array;

export function disposeTimeDomainBuffer(
  runtime?: TimeDomainBufferRuntime | null,
): TimeDomainBufferRuntime;
```

規則：

- initialize 依 analyserNode.fftSize 配置 Float32Array。
- readTimeDomainData 使用 analyserNode.getFloatTimeDomainData()。
- repeated update 不得重新配置 Float32Array。
- dispose 後回到 initialTimeDomainBufferRuntime invariant。

---

## Provider Integration

Provider 責任：

- 持有 timeDomainBufferRuntime reference
- 在 Capture Start 成功且 graph ready 後初始化
- 在 Capture Stop / Reset / Unmount 時 dispose
- 在 runtime 無效時阻止 update
- 錯誤轉譯與 state 邊界控制

Provider 規則：

- update 只更新 buffer 內容，不得觸發 React setState。
- update 不可替換 runtime reference（除 initialize/dispose lifecycle）。
- zero-length buffer 視為 invalid runtime，必須拒絕 update。

---

## Hook Integration

Hook 目標：

- 暴露 isTimeDomainBufferReady 狀態（與 isFrequencyBufferReady 命名一致）
- 暴露 updateTimeDomainBuffer() 入口（同步回傳 Float32Array）
- 暴露必要 runtime 可用性判斷結果

規則：

- Hook 不直接持有 runtime。
- Hook 透過 Provider actions 操作。
- Hook 不新增自動排程邏輯。

---

## Lifecycle Rules

### Start

- Capture Start 成功後，當 graph runtime 可用時初始化 time-domain buffer。
- 若初始化失敗，需遵守既有 transaction safety 原則（不破壞可用舊 runtime）。

### Stop

- Capture Stop 前後流程中必須包含 time-domain buffer dispose。
- dispose 後 runtime 必須回到 Stopped/Initial invariant。

### Reset

- Reset 必須防禦性 dispose time-domain buffer。
- 不得保留髒的 Float32Array reference。

### Unmount

- Unmount cleanup 必須 dispose。
- unmount 後不得寫入 state。

### StrictMode and Stale Async Considerations

- 必須考量 StrictMode double-invocation cleanup/setup 對 runtime 的影響。
- 必須防止 stale async operation 覆寫較新 lifecycle 狀態。
- 清理路徑需維持 idempotent。

---

## Error Contract

建議 error code：

- invalid-runtime
- buffer-init-failed
- buffer-read-failed

錯誤規則：

- analyserNode 缺失時：invalid-runtime
- runtime 缺失時：invalid-runtime
- timeDomainData 缺失時：invalid-runtime
- timeDomainData.length === 0 時：invalid-runtime
- Float32Array 配置失敗時：buffer-init-failed
- getFloatTimeDomainData() 執行失敗時：buffer-read-failed
- getFloatTimeDomainData() 執行失敗不可靜默忽略，需以明確錯誤向上回傳

---

## Runtime Invariants

### Initial / Disposed Invariant

- timeDomainData === null
- fftSize === 0

### Active Invariant

- timeDomainData !== null
- timeDomainData.length > 0
- fftSize > 0
- timeDomainData.length === runtime.fftSize

### Update Invariant

- 每次 readTimeDomainData 回傳同一個 Float32Array reference
- 更新後內容可變，但 reference 不可變

---

## Testing Requirements

### Unit Tests (Service)

- initialize uses analyserNode.fftSize allocation
- readTimeDomainData calls getFloatTimeDomainData
- repeated read reuses same Float32Array reference
- zero-length runtime treated as invalid-runtime
- dispose is idempotent
- dispose twice remains idempotent
- init allocation failure path
- analyser/runtime missing error path

### Integration Tests (Provider + Hook)

- start success initializes time-domain runtime
- update reads and returns in-place buffer
- update does not trigger setState
- stop/reset/unmount disposes runtime
- zero-length runtime blocks update with invalid-runtime
- StrictMode lifecycle does not leave dirty runtime
- stale async operations do not override newer lifecycle state

### Regression Tests

- 不影響既有 frequency buffer lifecycle 與責任邊界
- 不引入 scheduler 自動啟動副作用

---

## Acceptance Criteria

以下條件需全部成立：

- 新增獨立 timeDomainBufferService（stateless）
- Runtime 由 Provider 擁有
- initialize 以 analyserNode.fftSize 配置 Float32Array
- update 使用 getFloatTimeDomainData()
- repeated update 不重新配置 Float32Array
- dispose 後回到初始 invariant
- update 不觸發 React setState
- Capture Start 成功後初始化
- Capture Stop / Reset / Unmount 會 dispose
- zero-length buffer 視為 invalid runtime
- 錯誤使用明確 error code
- Provider owns runtime lifecycle.
- Service owns no lifecycle and no module-level mutable state.
- 不自動啟動 scheduler
- 不加入 pitch detection / UI / AudioWorklet
- 不修改 frequency buffer 既有責任
- StrictMode 與 stale async operation 風險有明確規格與測試要求

---

## Files Expected to Change

### Add

- src/services/audio/timeDomainBufferService.ts
- src/services/audio/timeDomainBufferService.test.ts
- tasks/TASK_017_TIME_DOMAIN_BUFFER_FOUNDATION.md

### Modify

- src/state/types.ts
- src/state/AppStateProvider.tsx
- src/hooks/useAudioCapture.ts
- src/hooks/useAudioCapture.test.tsx

---

## Non-Goals

- 本 Task 不交付 Pitch Detection
- 本 Task 不交付可視化 UI
- 本 Task 不交付 scheduler orchestration 改造
- 本 Task 不交付 AudioWorklet pipeline
- 本 Task 不做 frequency buffer API 重構

---

## Validation Commands

於後續實作完成時必須通過：

- npm run build
- npm test
- npm run lint
