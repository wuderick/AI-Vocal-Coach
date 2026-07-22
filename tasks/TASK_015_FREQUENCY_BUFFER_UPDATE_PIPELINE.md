# Task 015: Frequency Buffer Update Pipeline

## Objective

建立 Frequency Buffer Update Pipeline，讓既有 frequency buffer 可由單一更新入口觸發一次頻譜資料寫入流程：

updateFrequencyBuffer()

↓

AnalyserNode.getFloatFrequencyData()

↓

寫入既有 Float32Array

本 Task 僅處理一次性更新流程與責任邊界，不包含任何排程或自動更新機制。

Provider Action 更新流程保持同步，不新增任何 async scheduling。

---

## Scope

### Included

- 使用既有 FrequencyBufferService.readFrequencyData()
- AppStateProvider 新增 updateFrequencyBuffer action
- Hook 暴露 updateFrequencyBuffer()
- 透過 AnalyserNode.getFloatFrequencyData() 更新頻譜資料
- 寫入既有 Float32Array（in-place update）
- Runtime ownership 明確化（Provider 持有 runtime，Service 維持 stateless）

### Excluded

- requestAnimationFrame
- setInterval
- setTimeout
- 自動更新
- Waveform
- Pitch Detection
- Spectrogram
- Recorder
- AudioWorklet
- FFT Feature Extraction

---

## Excluded Scope

以下項目明確不在本 Task 範圍內：

- 任何形式的循環排程（包含 RAF、timer、背景輪詢）
- 任何 waveform / spectrogram 視覺化資料流
- 任何 pitch estimation 或音高演算法
- 任何錄音、編碼、匯出流程
- 任何 AudioWorklet node 建置或 worklet thread 資料管線
- 任何 FFT 衍生特徵計算（peaks、bands、formant、centroid 等）

---

## Architecture

```text
Hook (useAudioCapture)
    |
    v
AppStateProvider action: updateFrequencyBuffer()
    |
    v
FrequencyBufferService.readFrequencyData({
    analyserNode: graphRuntime.analyserNode,
    runtime: frequencyBufferRuntime,
})
    |
    v
AnalyserNode.getFloatFrequencyData(frequencyBufferRuntime.frequencyData)
```

重點：

- 更新流程採「單次呼叫、單次寫入」。
- frequencyData 必須是既有 Float32Array，僅更新內容，不可替換參考。
- graph runtime 與 frequency buffer runtime 維持分離，不將 analyserNode 放入 FrequencyBufferRuntime。
- Service 不儲存內部 runtime，不維護任何全域狀態。

---

## Runtime Ownership

### Ownership Rule

- Provider 擁有 Runtime（包含 graph runtime 與 frequency buffer runtime）。
- Provider Action 呼叫時同時提供 graphRuntime.analyserNode 與 frequencyBufferRuntime。
- Runtime 在 Provider 內建立、替換、清理與持有。
- Service 僅接收外部傳入依賴執行資料寫入。

### Allocation Rule

- updateFrequencyBuffer() 不可重新配置 Float32Array。
- 若 runtime.frequencyData 不存在或無效，視為錯誤路徑處理，不在 update 階段進行補建。
- updateFrequencyBuffer() 不可 replace runtime，不可 replace buffer。

### Stateless Service Rule

- FrequencyBufferService 不可持有 module-level mutable state。
- FrequencyBufferService 不可持有 runtime cache。
- FrequencyBufferService 僅以輸入參數決定行為。

---

## Error Handling

### Service Layer

- runtime 缺失（null / undefined）時，回傳可辨識錯誤。
- analyserNode 缺失或不可用時，回傳可辨識錯誤。
- frequencyData 缺失或尺寸異常時，回傳可辨識錯誤。
- getFloatFrequencyData 拋錯時，保留既有 runtime ownership，不做 replacement。

### Provider Layer

- Provider Action 直接回傳既有 Float32Array。
- Provider 不呼叫 setState() 觸發 render strategy 變更。
- Provider 負責接收 service error 並回傳可辨識錯誤（例如 invalid-runtime）。
- update 失敗不得破壞既有 runtime。
- update 失敗不得觸發 runtime replacement 或 buffer re-allocation。

---

## Lifecycle

### During Active Capture

1. 外部（UI/Hook）呼叫 updateFrequencyBuffer()
2. Provider 同時取得 graphRuntime.analyserNode 與 frequencyBufferRuntime
3. Provider 呼叫 FrequencyBufferService.readFrequencyData({ analyserNode, runtime })
4. Service 使用 analyserNode 將資料寫入既有 frequencyData
5. Provider Action 直接回傳既有 Float32Array（不 setState、不替換 runtime、不替換 buffer）

### During Idle / Stopped State

- updateFrequencyBuffer() 統一回傳可辨識錯誤（例如 invalid-runtime），不得 silent no-op。
- updateFrequencyBuffer() 不得建立新 runtime。

### During Reset / Unmount

- Runtime 已釋放後不得再執行有效寫入。
- 呼叫 updateFrequencyBuffer() 時應回傳可辨識錯誤（例如 invalid-runtime）。

### Synchronization Rule

- Task 015 更新流程保持同步。
- 不新增任何 async scheduling（requestAnimationFrame / setInterval / setTimeout）。

---

## Testing Strategy

### Unit Tests

- FrequencyBufferService.readFrequencyData() 會呼叫 getFloatFrequencyData
- 驗證傳入的是既有 Float32Array 參考（參考不變）
- runtime/analyser/frequencyData 缺失錯誤路徑
- getFloatFrequencyData 拋錯路徑

### Integration Tests

- Provider action updateFrequencyBuffer() 能串接到 Service
- Hook 可成功暴露並呼叫 updateFrequencyBuffer()
- active 狀態可更新 frequencyData 內容
- Provider action 直接回傳既有 Float32Array
- idle/stopped/reset/unmount 呼叫時回傳可辨識錯誤（invalid-runtime）
- update 呼叫不觸發 setState()
- update 失敗不會替換 runtime、不會重新配置 buffer

---

## Acceptance Criteria

以下條件需全部成立：

- Provider 存在 updateFrequencyBuffer action
- Hook 暴露 updateFrequencyBuffer()
- Provider Action 同時取得 graphRuntime.analyserNode + frequencyBufferRuntime
- 更新流程符合：updateFrequencyBuffer() -> readFrequencyData() -> getFloatFrequencyData() -> 寫入既有 Float32Array
- Action 回傳既有 Float32Array
- 不呼叫 setState()
- 不替換 Runtime
- 不重新配置 Buffer
- Service 使用既有 readFrequencyData()
- Idle / Stop 呼叫時回傳可辨識 Error（invalid-runtime）
- Runtime ownership 在 Provider，Service 維持 stateless
- 不包含任何 Excluded Scope 功能
- 測試覆蓋成功（unit + integration）

---

## Deliverables

### Added

- tasks/TASK_015_FREQUENCY_BUFFER_UPDATE_PIPELINE.md

### Planned Code Changes (Next Step, Not In This Step)

- src/state/AppStateProvider.tsx
- src/hooks/useAudioCapture.ts
- 既有 src/services/audio/frequencyBufferService.ts（沿用 readFrequencyData()，不新增 duplicate service API）
- 對應測試檔案（service / hook / integration）
