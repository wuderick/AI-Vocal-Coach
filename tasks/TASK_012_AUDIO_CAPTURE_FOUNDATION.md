# Task 012 — Audio Capture Foundation

## Summary

建立 Audio Capture 的基礎生命週期，提供後續即時音訊分析、波形顯示與錄音功能共用的音訊來源。

本 Task 僅負責建立與釋放：

- `MediaStream`
- `AudioContext`
- `MediaStreamAudioSourceNode`

本 Task 不實作錄音、分析、波形、音高偵測或音量偵測。

---

## Background

Task 010 已建立麥克風權限管理。

Task 011 已建立音訊輸入裝置列舉、選擇與裝置變更處理。

下一階段需要建立實際的麥克風音訊擷取生命週期，使後續模組可以共用同一個 `MediaStream` 與 `AudioContext`，避免不同功能各自重複呼叫 Browser API。

Capture 與 Recording 必須維持不同概念：

- Capture：取得並持有即時麥克風音訊來源。
- Recording：將 Capture 的音訊編碼並保存為錄音資料。

因此，本 Task 不建立 `MediaRecorder`。

---

## Goal

完成後，系統必須能：

1. 根據目前選取的音訊輸入裝置建立 `MediaStream`。
2. 建立並持有一個 `AudioContext`。
3. 從 `MediaStream` 建立 `MediaStreamAudioSourceNode`。
4. 透過 AppState 管理 Capture 狀態。
5. 正確停止所有 MediaStream tracks。
6. 正確關閉 AudioContext。
7. 安全處理重複初始化與重複釋放。
8. 對初始化失敗提供穩定且可測試的錯誤狀態。

---

## Scope

本 Task 包含：

- 新增 `audioCaptureService`
- 封裝 `navigator.mediaDevices.getUserMedia`
- 建立 `MediaStream`
- 建立 `AudioContext`
- 建立 `MediaStreamAudioSourceNode`
- 管理 Capture 資源參照
- 新增 Capture AppState
- 新增 Capture actions
- 新增 `useAudioCapture` Hook
- 在 Settings 頁面提供基礎啟動與停止控制
- Service 單元測試
- AppState 或 Hook 測試
- 更新架構決策與 Roadmap

---

## Out of Scope

本 Task 不實作：

- `MediaRecorder`
- 音訊 Blob
- 錄音下載
- 錄音播放
- `AnalyserNode`
- FFT
- PCM buffer
- Waveform
- Pitch detection
- Volume detection
- RMS 或 dB 計算
- AudioWorklet
- AI 分析
- Capture 狀態持久化
- 自動重新連線
- 背景錄音
- 多個 Capture session

不得為了未來功能，提前加入未被本 Task 使用的抽象層或公開 API。

---

## Architecture

資料流必須維持：

```text
Settings UI
    ↓
useAudioCapture
    ↓
AppState Actions
    ↓
audioCaptureService
    ↓
Browser API
Layer Rules
UI 不得直接呼叫 navigator.mediaDevices.getUserMedia。
UI 不得直接建立 AudioContext。
Hook 不得直接呼叫 Browser API。
audioCaptureService 不得 import React、Hook 或 Component。
AppStateProvider 是 UI 層唯一可觸發 Capture Service 生命週期的狀態入口。
Browser API 資源不得保存於 React Component local state。
MediaStream、AudioContext 與 Source Node 不得暴露到一般 UI component。
Shared Types

新增或更新共用型別，例如：

src/types/audio.ts

新增：

export type AudioCaptureState =
    | 'idle'
    | 'starting'
    | 'active'
    | 'stopping'
    | 'error';

必要時可新增穩定的錯誤型別，但不得直接將原始 Browser API 物件放入 AppState。

Service Design

建立：

src/services/audio/audioCaptureService.ts
Responsibility

audioCaptureService 只負責 Audio Capture 資源生命週期：

初始化
查詢目前資源
釋放

不得負責：

Recording
Analysis
Waveform
UI state
Toast
Permission prompt UI
Recommended Public API
export interface AudioCaptureResources {
    readonly stream: MediaStream;
    readonly audioContext: AudioContext;
    readonly sourceNode: MediaStreamAudioSourceNode;
}

export interface InitializeAudioCaptureOptions {
    readonly deviceId?: string | null;
}

initializeCapture(
    options?: InitializeAudioCaptureOptions
): Promise<AudioCaptureResources>;

disposeCapture(): Promise<void>;

getCaptureResources(): AudioCaptureResources | null;

isCaptureInitialized(): boolean;

實作時可以在不破壞責任邊界的前提下微調命名，但不得增加錄音或分析 API。

Device Constraint

當存在有效的 deviceId 時，getUserMedia 應使用精確裝置限制：

{
    audio: {
        deviceId: {
            exact: deviceId
        }
    }
}

當 deviceId 為 null、空字串或未提供時，應使用預設音訊輸入：

{
    audio: true
}

不得自行指定未經需求確認的進階 audio constraints，例如：

echoCancellation
noiseSuppression
autoGainControl
sampleRate
channelCount

這些設定會影響後續聲學分析，必須在獨立 Task 中明確評估。

Initialization Lifecycle

初始化順序：

驗證 Browser API 是否可用。
處理既有 Capture 資源。
呼叫 getUserMedia。
建立 AudioContext。
使用 createMediaStreamSource(stream) 建立 Source Node。
儲存完整 Capture resources。
回傳 resources。

初始化必須具有明確且可預測的行為。

Repeated Initialization

當 Capture 已初始化，再次呼叫 initializeCapture() 時，不得留下舊資源。

本 Task 採用以下規則：

再次初始化前，先完整釋放既有 Capture，再建立新的 Capture。

不得同時保留兩組 active MediaStream 或 AudioContext。

若新初始化失敗，舊資源已被釋放，Service 應回到未初始化狀態。

Partial Initialization Failure

初始化可能在不同階段失敗，例如：

getUserMedia 失敗
AudioContext constructor 失敗
createMediaStreamSource 失敗

若任何階段失敗：

停止已取得的所有 MediaStream tracks。
關閉已建立的 AudioContext。
清除所有內部 reference。
將原始錯誤重新拋出，或轉換為明確且保留 cause 的 domain error。
不得留下半初始化狀態。
Disposal Lifecycle

disposeCapture() 必須：

對 Source Node 呼叫 disconnect()。
停止 MediaStream 的所有 tracks。
若 AudioContext 尚未關閉，呼叫 close()。
清除所有內部 references。
即使部分清理步驟失敗，也要盡可能完成其他清理。
可安全重複呼叫。

disposeCapture() 必須具備 idempotent 特性：

idle → dispose → idle
active → dispose → idle
idle → dispose → idle

不得依賴垃圾回收自動釋放麥克風或 AudioContext。

AppState Changes

新增：

audioCaptureState: AudioCaptureState;
audioCaptureError: string | null;

初始值：

audioCaptureState: 'idle'
audioCaptureError: null

新增 actions：

initializeAudioCapture(): Promise<void>;
disposeAudioCapture(): Promise<void>;
Initialize State Transitions

成功流程：

idle
→ starting
→ active

失敗流程：

idle
→ starting
→ error

開始新的初始化時，必須清除舊錯誤。

Dispose State Transitions

成功流程：

active
→ stopping
→ idle

在 error 狀態呼叫 dispose 時，也應嘗試清理並回到 idle。

Concurrency Guard

快速重複點擊可能造成：

多次 getUserMedia
狀態競爭
舊初始化覆蓋新初始化
資源洩漏

因此 AppState action 必須避免同一時間執行多個初始化或停止操作。

最低要求：

starting 時忽略新的 initialize 請求。
stopping 時忽略新的 dispose 請求。
UI 控制在 starting 或 stopping 時 disabled。

不得在此 Task 中引入複雜 queue、mutex library 或第三方狀態機。

Hook Design

建立：

src/hooks/useAudioCapture.ts

Hook 只暴露 UI 所需資料，例如：

{
    captureState,
    captureError,
    isCaptureActive,
    initializeCapture,
    disposeCapture
}

Hook 不得：

直接呼叫 Service
持有 MediaStream
持有 AudioContext
持有 Source Node
呼叫 Browser API
UI Changes

在 Settings 頁面的音訊裝置區域加入最小可驗收 UI。

Idle

顯示：

Audio capture is inactive.

按鈕：

Start audio capture
Starting

顯示：

Starting audio capture…

按鈕 disabled。

Active

顯示：

Audio capture is active.

按鈕：

Stop audio capture
Stopping

顯示：

Stopping audio capture…

按鈕 disabled。

Error

顯示可理解的錯誤訊息。

提供重新嘗試：

Retry audio capture

不得在 UI 顯示或暴露原始 MediaStream、AudioContext 或 Source Node。

Interaction with Selected Device

初始化 Capture 時使用目前 AppState 的：

selectedAudioInputId

若沒有選取裝置，使用瀏覽器預設音訊輸入。

Device Selection During Active Capture

本 Task 不做 Capture 熱切換。

當 Capture 為 active 時：

音訊裝置 Select 應 disabled，或
UI 必須明確阻止裝置變更。

使用者必須先停止 Capture，才能切換裝置並重新初始化。

不得在 Task 012 中自動重啟 Capture。

Error Handling

Service 層：

負責資源清理。
保留或重新拋出錯誤。
不顯示 UI。
不呼叫 alert。
不吞掉初始化錯誤。

AppState 層：

將失敗轉換成穩定的 UI error message。
將 state 設為 error。
不保存原始 Browser API 資源。

UI 層：

顯示使用者可理解的錯誤。
不顯示大型 stack trace。

至少應妥善處理：

Browser 不支援 getUserMedia
Browser 不支援 AudioContext
權限被拒絕
指定裝置不存在
裝置忙碌或無法啟動
AudioContext 建立失敗
Testing
Service Tests

建立：

src/services/audio/audioCaptureService.test.ts

至少涵蓋：

使用預設裝置初始化成功。
使用指定 deviceId 初始化成功。
建立 MediaStream。
建立 AudioContext。
建立 MediaStreamAudioSourceNode。
getCaptureResources() 回傳目前資源。
isCaptureInitialized() 狀態正確。
重複初始化先釋放舊資源。
dispose 會 disconnect Source Node。
dispose 會 stop 所有 tracks。
dispose 會 close AudioContext。
dispose 會清除 references。
dispose 可安全重複呼叫。
Browser 不支援 getUserMedia。
Browser 不支援 AudioContext。
getUserMedia 失敗。
AudioContext 建立失敗時停止已取得的 tracks。
Source Node 建立失敗時停止 tracks 並關閉 AudioContext。
部分 cleanup 失敗時仍嘗試其餘 cleanup。
AppState or Hook Tests

至少涵蓋：

初始狀態為 idle。
initialize 時進入 starting。
initialize 成功後進入 active。
initialize 失敗後進入 error。
新的 initialize 清除舊錯誤。
dispose 時進入 stopping。
dispose 成功後回到 idle。
error 狀態可以 dispose 回到 idle。
starting 時不重複初始化。
stopping 時不重複停止。
使用目前選取的 deviceId。
無選取裝置時使用預設裝置。
UI Tests

若現有專案已有相同層級的 Component 測試模式，至少涵蓋：

Idle UI
Starting disabled state
Active UI
Stopping disabled state
Error UI
Active 時禁止切換裝置

若現有架構不適合新增 UI test，可在實作回報中說明，並將對應項目列入手動驗證。

Manual Verification

完成自動測試後，手動驗證：

有麥克風權限時可以啟動 Capture。
啟動後瀏覽器顯示麥克風使用中。
停止後瀏覽器不再顯示麥克風使用中。
重複啟動與停止不會卡住。
啟動期間無法切換輸入裝置。
停止後可以切換裝置。
選擇不同裝置後能重新啟動。
拒絕權限時顯示錯誤。
無裝置或裝置失效時顯示錯誤。
重新整理頁面後 Capture 回到 idle。
Reset Settings 不得留下 active Capture。
Console 不應出現未處理的 Promise rejection。
Documentation Updates

完成實作後更新：

docs/ARCHITECTURE_DECISIONS.md

新增 ADR-012，至少記錄：

Capture 與 Recording 分離。
audioCaptureService 統一管理 MediaStream 與 AudioContext。
後續 Analysis、Waveform 與 Recording 共用同一組 Capture 資源。
持有 Browser API 資源的 Service 必須提供 explicit disposal。
Capture active 時不支援裝置熱切換。
docs/ROADMAP.md

將 Task 012 標記為完成，並確認下一個 Task 的名稱與範圍。

docs/TECH_DEBT.md

必要時記錄：

Capture active 時裝置熱切換
權限撤銷後自動恢復
裝置拔除後自動重連
AudioContext suspend/resume 策略
Audio constraints 評估
頁面離開或應用關閉時的集中清理策略
Risks
Resource Leak

若 tracks、Source Node 或 AudioContext 未正確清理，瀏覽器可能持續使用麥克風或累積音訊資源。

Race Conditions

快速重複初始化或停止可能產生多組資源或狀態覆蓋。

Device Changes

選取裝置在初始化前可能已被拔除，getUserMedia 可能失敗。

Browser Compatibility

不同瀏覽器對 AudioContext 與媒體裝置錯誤的行為可能不同。

Audio Processing Side Effects

提前指定 echo cancellation、noise suppression 或 auto gain control，可能改變後續聲學分析結果，因此本 Task 不調整這些 constraints。

Acceptance Criteria

Task 012 完成必須符合：

 可以使用目前選取的音訊輸入裝置建立 Capture。
 沒有選取裝置時可使用預設輸入。
 Capture 成功建立 MediaStream。
 Capture 成功建立 AudioContext。
 Capture 成功建立 MediaStreamAudioSourceNode。
 Capture active 時禁止切換裝置。
 重複初始化不會保留舊資源。
 dispose 會 disconnect Source Node。
 dispose 會停止所有 tracks。
 dispose 會關閉 AudioContext。
 dispose 可安全重複呼叫。
 初始化中途失敗不會留下資源。
 AppState 狀態轉換正確。
 錯誤可在 UI 中理解。
 未實作 Out of Scope 功能。
 npm run build 通過。
 npm test 通過。
 npm run lint 通過。
 手動驗證通過。
 ADR-012 已更新。
 ROADMAP 已更新。
 TECH_DEBT 已視需要更新。
Definition of Done

只有在以下條件全部成立時，Task 012 才算完成：

Scope 全部完成。
Out of Scope 未被提前實作。
所有 Browser API 都維持在正確層級。
沒有已知 Capture 資源洩漏。
自動測試全部通過。
Build 與 Lint 通過。
手動驗證完成。
文件同步更新。
Code Review 完成。
Git diff 已確認。
使用者親自 Commit 與 Push。
Commit Message
Task 012: Audio capture foundation