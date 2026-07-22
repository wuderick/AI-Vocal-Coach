# Task 014: Frequency Buffer Foundation

## Objective

建立 AI Vocal Coach 的 Frequency Buffer Foundation，讓既有 Audio Graph Runtime 可以配置並讀取單次頻譜資料緩衝區，作為後續 FFT、Pitch Detection、Waveform 與 AudioWorklet 的前置基礎。

本 Task 不包含任何持續輪詢或音訊分析邏輯。

---

## Scope

### Included

- FrequencyBufferService
- FrequencyBufferRuntime
- Float32Array buffer allocation
- readFrequencyData()
- AppStateProvider runtime integration
- Hook integration
- Unit tests
- Integration tests

### Excluded

- Pitch Detection
- Waveform
- Recorder
- AudioWorklet
- requestAnimationFrame
- 持續更新 buffer
- FFT 計算
- 視覺化 rendering

---

## Architecture

```text
AudioCaptureService
	|
	v
AudioGraphService
	|
	v
FrequencyBufferService
```

FrequencyBufferService 依賴既有 AnalyserNode，建立 Float32Array buffer 並在需要時讀取當前 frequency 資料。

Graph Runtime 與 Buffer Runtime 都由 AppStateProvider 管理。

---

## Runtime

### FrequencyBufferRuntime

包含：

- frequencyData: Float32Array | null

規則：

- runtime 不可存在於 module-level singleton
- Provider 持有 current runtime
- Service 僅接收外部 runtime / analyserNode 執行 create / read / dispose

---

## Service Boundary

### FrequencyBufferService

負責：

- 依據 analyserNode.frequencyBinCount 建立 Float32Array
- 讀取單次 frequency data
- dispose runtime（回傳清空 runtime）

不負責：

- Graph lifecycle
- Runtime replacement
- 持續更新排程
- requestAnimationFrame
- State management

---

## Provider Lifecycle

### Start Capture

1. Capture Service 建立 capture runtime
2. Graph Service 建立 graph runtime
3. FrequencyBufferService 建立新 buffer runtime
4. 全部成功後 Provider replace current runtimes
5. dispose 舊 buffer runtime
6. dispose 舊 graph runtime

### Stop

1. dispose buffer runtime
2. dispose graph runtime
3. stop capture runtime
4. state 回到 idle

### Reset

1. operation token 前進
2. dispose buffer runtime
3. dispose graph runtime
4. stop capture runtime
5. state reset

### Unmount

1. mounted guard 關閉
2. operation token 前進
3. dispose buffer runtime
4. dispose graph runtime
5. stop capture runtime

---

## Transaction Rule

Frequency buffer 初始化失敗時：

1. stop 新 capture runtime
2. dispose 新 graph runtime
3. 保留 old graph runtime
4. 保留 old frequency buffer runtime
5. state 進入 error

Provider 不可因新 buffer 建立失敗而破壞現有可用 graph/buffer。

---

## Tests

### Unit Tests

- Frequency buffer initialization
- Float32Array size matches frequencyBinCount
- readFrequencyData() calls getFloatFrequencyData
- invalid runtime handling
- dispose idempotent

### Integration Tests

- start 時 buffer runtime 建立
- stop/reset/unmount 時 buffer runtime 清理
- stale operation 不覆蓋新狀態
- StrictMode 不造成 mounted guard 或 runtime 清理回歸
- new buffer 建立失敗時保留 old buffer

---

## Acceptance Criteria

以下必須全部通過：

- npm run build
- npm test
- npm run lint

功能驗收：

- 可建立 Float32Array buffer runtime
- 可讀取單次 frequency data
- Provider 正確管理 buffer lifecycle
- reset / unmount 不留髒 runtime
- 不包含 Excluded scope 內功能

---

## Deliverables

### Added

- src/services/audio/frequencyBufferService.ts
- src/services/audio/frequencyBufferService.test.ts
- tasks/TASK_014_FREQUENCY_BUFFER_FOUNDATION.md

### Modified

- src/state/types.ts
- src/state/appState.ts
- src/state/AppStateProvider.tsx
- src/hooks/useAudioCapture.ts
- src/hooks/useAudioCapture.test.tsx

---

## Not Included Before Later Tasks

在後續 Task 前，以下功能明確不包含：

- Pitch Detection
- Waveform
- Recorder
- AudioWorklet
- requestAnimationFrame loop
- 持續更新 frequency buffer
