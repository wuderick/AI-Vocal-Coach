# Task 016: Frequency Update Scheduler Foundation

## Objective

建立 Frequency Update Scheduler Foundation。

Scheduler 唯一責任：

requestAnimationFrame

↓

onFrame()

↓

Provider-owned callback

↓

既有 updateFrequencyBuffer()

↓

FrequencyBufferService.readFrequencyData()

↓

更新既有 Float32Array

本 Task 僅建立排程基礎與責任邊界，Scheduler 不做任何音訊分析。

---

## Scope

### Included

- Scheduler Service
- requestAnimationFrame
- startScheduler()
- stopScheduler()
- Provider Action
- Hook 暴露
- Scheduler Runtime
- startFrequencyUpdateScheduler()（Provider Action）
- stopFrequencyUpdateScheduler()（Provider Action）

### Excluded

- Waveform
- Spectrogram
- Pitch Detection
- FFT Feature Extraction
- Recorder
- AudioWorklet
- Voice Activity Detection
- AI Analysis
- Canvas Rendering
- UI 更新
- Buffer Analysis

---

## Excluded Scope

以下項目明確不在本 Task 範圍內：

- 任何 Waveform / Spectrogram 視覺化資料流
- 任何 Pitch Detection 或 FFT 衍生特徵計算
- 任何 Recorder、AudioWorklet、Voice Activity Detection
- 任何 AI Analysis
- 任何 Canvas Rendering 或 UI 更新策略
- 任何 Frequency Buffer 分析邏輯

重要限制：

- Scheduler 不讀取 Frequency Buffer。
- Scheduler 不直接接觸 FrequencyBufferService。

---

## Architecture

```text
Hook
  |
  v
Provider.startFrequencyUpdateScheduler()
  |
  v
SchedulerService.startScheduler({
  runtime,
  onFrame,
  onError,
})
  |
  v
requestAnimationFrame
  |
  v
onFrame()
  |
  v
Provider-owned callback
  |
  v
既有 updateFrequencyBuffer()
  |
  v
FrequencyBufferService.readFrequencyData()
```

重點：

- Scheduler Service 只負責 frame scheduling，且只接收 callback。
- Scheduler Service 只接收：onFrame: () => void、onError: (error: unknown) => void。
- Scheduler Service 不得知道 React、Provider、updateFrequencyBuffer 名稱、FrequencyBufferService、Graph Runtime、Frequency Buffer Runtime。
- Provider 負責將既有 updateFrequencyBuffer() 包裝為 onFrame callback。
- Scheduler 不直接呼叫 FrequencyBufferService。

---

## Runtime Ownership

新增 Runtime：

### FrequencyUpdateSchedulerRuntime

包含：

- animationFrameId: number | null
- isRunning: boolean

Ownership 規則：

- Provider owns the SchedulerRuntime reference.
- Scheduler Service may mutate only the passed runtime control fields in place.
- Scheduler Service must never retain, cache, or globally store the runtime.
- Provider 持有 Runtime reference；Service 不擁有 Runtime。
- Scheduler Service 維持 Stateless，不持有 module-level mutable state。

### Runtime Invariants

Stopped Runtime：

- animationFrameId === null
- isRunning === false

Running Runtime：

- animationFrameId !== null
- isRunning === true

Invariant 規則：

- start 成功後必須符合 Running invariant。
- stop 完成後必須符合 Stopped invariant。
- frame error、reset、unmount 後必須符合 Stopped invariant。

---

## Scheduler Lifecycle

### Manual Lifecycle Scope

Task 016 採手動啟停，不自動綁定 Capture Start。

Provider Actions：

- startFrequencyUpdateScheduler(): void
- stopFrequencyUpdateScheduler(): void

Hook 暴露相同的手動 actions。

### Start Sequence

Manual Start Action

↓

Provider validates graph runtime + frequency buffer runtime

↓

Provider builds onFrame/onError callbacks

↓

SchedulerService.startScheduler({ runtime, onFrame, onError })

↓

requestAnimationFrame loop starts

規則：

- Capture Start 不自動啟動 Scheduler。
- Scheduler 只能在 graph runtime 與 frequency buffer runtime 有效時手動啟動。
- Provider 呼叫 Scheduler Service.startScheduler() 建立 RAF loop。

### Stop Sequence

Capture Stop

↓

Scheduler Stop

↓

Dispose Graph

↓

Dispose FrequencyBuffer

規則：

- Provider 必須先停止 scheduler，再進行 graph/buffer 清理。
- Scheduler 不負責 Dispose graph 或 frequency buffer。
- Capture Stop 必須防禦性停止 Scheduler。

### Reset / Unmount

- Provider 應先 stop scheduler，避免殘留 RAF callback。
- stop 後 runtime 應回到非執行狀態（animationFrameId 清空、isRunning=false）。
- Reset 必須防禦性停止 Scheduler。
- Unmount 必須防禦性停止 Scheduler。
- 未來是否自動跟隨 Capture Start，留給後續 integration task。

### RAF Frame Order

每一個 RAF callback 順序固定為：

1. 確認 runtime.isRunning
2. 執行 onFrame()
3. 再次確認 runtime.isRunning
4. 成功後才 requestAnimationFrame 下一幀
5. 將新的 frame ID 寫入 runtime.animationFrameId

補充規則：

- 每個 RAF callback 最多呼叫一次 onFrame。
- 不可先排下一幀再執行 onFrame。
- 若 onFrame 執行期間 Scheduler 被停止，不得再排下一幀。

---

## Error Handling

需定義以下錯誤與預期行為：

- 重複 Start
- 重複 Stop
- invalid runtime
- scheduler already running

建議行為準則：

- 重複 Start：startScheduler() 同步拋出 scheduler-already-running，不建立第二個 RAF，不改變目前 running runtime。
- 重複 Stop：idempotent，不拋錯，維持 Stopped invariant。
- invalid runtime：Provider 在 graph 或 frequency buffer runtime 無效時不得呼叫 SchedulerService.startScheduler()，Provider action 同步拋出 invalid-runtime，不建立 RAF。

### Frame Error Strategy

若 onFrame() 拋錯：

1. Scheduler 立即進入 Stopped invariant
2. 不排下一幀
3. 呼叫 onError(error)
4. 本 Task 不新增 UI error state
5. 錯誤不得被靜默忽略

注意：

- RAF callback 不在 startScheduler() 的同步呼叫堆疊中。
- 錯誤策略以 callback 通知（onError）為主，不描述為同步上拋到 startScheduler 呼叫端。
- Frame Error 不屬於同步 throw：onFrame() 錯誤路徑為 catch -> Scheduler Stop -> onError(error)。

---

## Suggested API

```ts
export interface FrequencyUpdateSchedulerRuntime {
  animationFrameId: number | null;
  isRunning: boolean;
}

export interface StartSchedulerOptions {
  runtime: FrequencyUpdateSchedulerRuntime;
  onFrame: () => void;
  onError: (error: unknown) => void;
}

export function createSchedulerRuntime():
  FrequencyUpdateSchedulerRuntime;

export function startScheduler(
  options: StartSchedulerOptions,
): void;

export function stopScheduler(
  runtime: FrequencyUpdateSchedulerRuntime,
): void;
```

### Error Contract

- createSchedulerRuntime()：不拋 lifecycle error。
- startScheduler()：同步 throw scheduler-already-running（重複啟動時）。
- Provider：runtime 驗證失敗時同步 throw invalid-runtime（且不得呼叫 SchedulerService.startScheduler()）。
- stopScheduler()：idempotent，不 throw。
- onFrame() 非同步錯誤：使用 onError(error)，不得透過 startScheduler() 呼叫堆疊回傳。

---

## Testing Strategy

### Unit Tests

- Scheduler Service startScheduler()/stopScheduler() 行為
- 重複 start 保護
- 重複 stop idempotent
- RAF 註冊與取消行為
- Service stateless 檢驗

### Integration Tests

- Hook 可手動啟動與停止 scheduler
- Provider 每 frame 透過 onFrame 觸發既有 updateFrequencyBuffer()
- stop 後不再觸發 updateFrequencyBuffer()
- Provider 持有並更新 Scheduler Runtime
- Capture Start 不自動啟動 scheduler

### Lifecycle Tests

- 手動 start/stop lifecycle 順序正確
- capture stop/reset/unmount 前先停止 scheduler
- scheduler 停止後才進入 graph/buffer dispose 階段
- frame error 後 scheduler 進入 Stopped invariant 並觸發 onError

---

## Acceptance Criteria

以下條件需全部成立：

- Scheduler 可 Start
- Scheduler 可 Stop
- 不重複 Start
- Stop 取消 RAF
- 每 frame 呼叫 updateFrequencyBuffer()
- Scheduler Service 只接收 onFrame/onError callback
- Scheduler 不知道 Provider 或 updateFrequencyBuffer 名稱
- Provider 將既有 updateFrequencyBuffer 包裝為 onFrame
- Provider owns SchedulerRuntime reference
- Service 只原地更新傳入 runtime 控制欄位
- Service 不保存或 cache runtime
- Running/Stopped invariants 明確成立
- 每個 frame 最多執行一次 onFrame
- onFrame 成功後才排下一幀
- callback 執行期間 Stop 時不得再排下一幀
- onFrame 拋錯時停止、呼叫 onError、不再排程
- 重複 Start 不建立第二個 RAF
- 重複 Stop 為 idempotent
- startScheduler() 重複啟動時同步 throw scheduler-already-running
- Provider runtime 驗證失敗時同步 throw invalid-runtime
- stopScheduler() idempotent
- Frame Error 與 Start Error 使用不同錯誤路徑
- Capture Start 不自動啟動 Scheduler
- Capture Stop、Reset、Unmount 會防禦性停止 Scheduler
- Provider 持有 Scheduler Runtime
- Scheduler Service Stateless
- 不分析 Buffer
- 不新增 UI
- build/test/lint 可通過（下一步實作時）

---

## Deliverables

### Added

- tasks/TASK_016_FREQUENCY_UPDATE_SCHEDULER_FOUNDATION.md

### Planned Code Changes (Next Step, Not In This Step)

- src/services/audio/frequencyUpdateSchedulerService.ts
- src/state/types.ts
- src/state/AppStateProvider.tsx
- src/hooks/useAudioCapture.ts
- 對應 unit / integration / lifecycle 測試檔案
