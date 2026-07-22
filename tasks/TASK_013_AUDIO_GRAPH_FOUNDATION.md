# Task 013: Audio Graph Foundation

## Objective

建立 AI Vocal Coach 的 Audio Graph Foundation，讓既有 Capture Runtime 在啟動後可建立可管理的 Web Audio Graph：

MediaStream -> MediaStreamAudioSourceNode -> AnalyserNode

本 Task 僅建立基礎 graph lifecycle 與 runtime 管理，不做任何音訊分析運算。

---

## Scope

### Included

- AudioGraphService
- AudioGraphRuntime
- MediaStreamAudioSourceNode 建立
- AnalyserNode 建立
- Graph dispose 與 idempotent cleanup
- AppStateProvider graph lifecycle 整合
- Runtime replacement
- Graph 初始化失敗時 transaction recovery
- Operation token 與 StrictMode cleanup 整合
- Unit tests
- Provider integration tests

### Excluded

- FFT
- Frequency Buffer 讀取
- Waveform rendering
- Pitch detection
- Recorder
- AudioWorklet
- Blob export / playback
- AI analysis

---

## Audio Graph Architecture

```text
MediaStream
    |
    v
MediaStreamAudioSourceNode
    |
    v
AnalyserNode
```

Graph Runtime 由 AppStateProvider 持有與替換。

AudioGraphService 不保存任何全域狀態。

---

## Responsibility Boundaries

### AudioCaptureService

負責：

- getUserMedia
- MediaStream lifecycle
- AudioContext lifecycle（create/reuse/resume/suspend）

不負責：

- Audio Graph 建立
- Graph runtime replacement
- AppState state transition

### AudioGraphService

負責：

- 建立新 graph（sourceNode + analyserNode）
- dispose 指定 graph runtime

不負責：

- Capture lifecycle
- 舊 graph replacement 決策
- AppState state transition
- operation token 管理

重要設計：

- initializeAudioGraph 只處理「create new graph」
- 不在 initialize 階段處理 previous runtime
- 舊 graph dispose 責任在 Provider

### AppStateProvider

負責：

- capture + graph lifecycle 編排
- runtime replacement
- old graph dispose 時機
- graph failure transaction recovery
- operation token 防止 stale async 覆寫
- StrictMode setup/cleanup 與 mounted guard
- state 同步到 UI

---

## AudioGraphRuntime

使用型別：

- sourceNode: MediaStreamAudioSourceNode | null
- analyserNode: AnalyserNode | null

規則：

- runtime 不得放在 service module-level singleton
- Provider 持有 current runtime（ref + state）
- state 只保存目前生效 runtime

---

## Lifecycle

### Start

1. Provider 呼叫 AudioCaptureService.startAudioCapture 取得新 capture runtime。
2. Provider 呼叫 AudioGraphService.initializeAudioGraph 建立新 graph。
3. 若成功：
   - Provider dispose old graph
   - Provider replace current graph runtime
   - state 進入 active

### Stop

1. Provider 先 dispose current graph。
2. Provider 再 stop capture runtime。
3. Provider 更新 runtime 為空 graph + 空 stream。
4. state 回到 idle。

### Reset

1. Provider 先使 operation token 前進，讓舊操作過期。
2. Provider dispose current graph。
3. Provider stop capture runtime。
4. Provider 重置設定狀態並同步 runtime。

### Unmount

1. cleanup 設 isMountedRef 為 false。
2. operation token 前進，舊 async 操作全部過期。
3. dispose current graph。
4. stop capture runtime。
5. unmount 後不得 setState。

---

## Graph Initialization Failure Transaction

策略：

- 不先 dispose 舊 graph
- 先嘗試建立新 graph

行為：

1. 若新 graph 建立失敗：
   - stop 新 capture runtime（避免殘留新 stream）
   - 保留舊 graph runtime（不破壞既有 graph）
   - state 進入 error
2. 若新 graph 建立成功：
   - 才 dispose 舊 graph
   - replace current graph runtime

此行為避免：

- old graph 被先清掉，new graph 又建立失敗，導致無 graph 可用

---

## Operation Token and StrictMode Cleanup

### Operation Token

Provider 使用遞增 operation token（generation counter）：

- 每次 start/stop/reset 前遞增 token
- async resolve/reject 回來時比對 token
- token 不一致即視為 stale，不可覆寫新狀態

### StrictMode Cleanup

Provider lifecycle 採用：

- setup: isMountedRef.current = true
- cleanup: isMountedRef.current = false

並於 cleanup 時：

- 遞增 operation token
- dispose graph
- stop capture runtime

確保在 React StrictMode 測試性 cleanup/setup 後：

- mounted guard 不會永久失效
- 舊 cleanup async 結果不會覆寫新 setup state

---

## Tests

### Unit Tests

- [src/services/audio/audioGraphService.test.ts](src/services/audio/audioGraphService.test.ts)

覆蓋：

- graph 初始化
- source -> analyser connect
- dispose idempotent
- null runtime disposal
- partial disconnect failure 仍繼續清理
- invalid runtime error
- graph create failure
- partial node create/connect failure cleanup

### Integration Tests

- [src/hooks/useAudioCapture.test.tsx](src/hooks/useAudioCapture.test.tsx)
- [src/components/settings/AudioDeviceCard.test.tsx](src/components/settings/AudioDeviceCard.test.tsx)

覆蓋：

- start 時 graph runtime 寫入 state
- stop/reset/unmount graph cleanup
- stale operation 防護
- StrictMode lifecycle
- graph 初始化失敗時保留 old graph
- UI 測試在 graph lifecycle 下仍正常

---

## Acceptance Criteria

必須全部通過：

- npm run build
- npm test
- npm run lint

功能驗收：

- 可建立 MediaStreamAudioSourceNode 與 AnalyserNode
- graph dispose 可重複呼叫且安全
- graph 初始化失敗時保留舊 graph
- Provider 能正確處理 Start/Stop/Reset/Unmount lifecycle
- operation token 可阻擋 stale async 覆寫
- StrictMode cleanup/setup 不造成 mounted guard 永久失效

---

## Deliverables

### Added

- [src/services/audio/audioGraphService.ts](src/services/audio/audioGraphService.ts)
- [src/services/audio/audioGraphService.test.ts](src/services/audio/audioGraphService.test.ts)
- [tasks/TASK_013_AUDIO_GRAPH_FOUNDATION.md](tasks/TASK_013_AUDIO_GRAPH_FOUNDATION.md)

### Modified

- [src/state/AppStateProvider.tsx](src/state/AppStateProvider.tsx)
- [src/state/appState.ts](src/state/appState.ts)
- [src/state/types.ts](src/state/types.ts)
- [src/hooks/useAudioCapture.ts](src/hooks/useAudioCapture.ts)
- [src/hooks/useAudioCapture.test.tsx](src/hooks/useAudioCapture.test.tsx)
- [src/components/settings/AudioDeviceCard.test.tsx](src/components/settings/AudioDeviceCard.test.tsx)

---

## Not Included Before Task 014

在 Task 014 開始前，以下功能明確不包含：

- FFT 運算
- Frequency data buffer 讀取/轉換
- Waveform data pipeline
- Pitch detection
- Recorder
- AudioWorklet
- 視覺化渲染
- AI 分析
