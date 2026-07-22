# Task 011：Audio Device Foundation

## Goal

建立 AI Vocal Coach 的音訊輸入裝置管理基礎。

本 Task 僅負責：

- 列出可用麥克風
- 選擇麥克風
- 管理目前 Session 的使用者選擇
- 偵測裝置插拔

不實作錄音。

---

# Scope

## Included

- enumerateDevices()
- audioinput filtering
- Device selector
- Device change detection
- Session-only device selection
- Settings UI
- AppState integration
- Unit tests

## Not Included

- MediaRecorder
- AudioContext
- Waveform
- Pitch Detection
- Audio Analysis
- Recording Session

---

# Architecture

```
Settings UI
        │
        ▼
useAudioDevices
        │
        ▼
AppState Actions
        │
        ▼
audioDeviceService
        │
        ▼
Browser API
```

規則：

- UI 不得直接呼叫 Browser API。
- Hook 不得直接呼叫 Service。
- Browser API 必須全部封裝於 Service。
- AppStateProvider 為唯一可呼叫 Service 的層。

---

# Files

## New

- src/services/audio/audioDeviceService.ts
- src/services/audio/audioDeviceService.test.ts
- src/hooks/useAudioDevices.ts
- src/hooks/useAudioDevices.test.tsx
- src/components/settings/AudioDeviceCard.tsx

## Modified

- src/state/types.ts
- src/state/appState.ts
- src/state/AppStateProvider.tsx
- src/pages/SettingsPage.tsx
- docs/ROADMAP.md
- docs/ARCHITECTURE_DECISIONS.md
- docs/TECH_DEBT.md

---

# Service Requirements

建立：

- getAudioInputDevices()
- getDefaultAudioInput()
- subscribeToDeviceChanges()

回傳型別：

```ts
export interface AudioInputDevice {
    id: string;
    label: string;
    isDefault: boolean;
}
```

`subscribeToDeviceChanges()` 必須：

- 在 Service 內監聽 `navigator.mediaDevices.devicechange`
- 接收 callback
- 回傳 unsubscribe function
- 在 unsubscribe 時移除 listener

禁止直接回傳 `MediaDeviceInfo`。

---

# AppState

新增：

- audioInputDevices
- selectedAudioInputId

Actions：

- refreshAudioDevices()
- selectAudioDevice()

狀態型別：

```ts
audioInputDevices: AudioInputDevice[];
selectedAudioInputId: string | null;
```

裝置刷新後的選擇規則：

1. 若目前選擇仍存在，保留目前選擇。
2. 若目前選擇已不存在，選擇 Default Device。
3. 若沒有 Default Device，選擇第一個裝置。
4. 若沒有任何裝置，將 `selectedAudioInputId` 設為 `null`。

`selectAudioDevice(id)` 規則：

- 若 id 存在於 `audioInputDevices`，更新 `selectedAudioInputId`。
- 若 id 不存在，不更新狀態。
- 不拋出例外。

---

# UI

新增：

Audio Device Card

內容：

- Device List
- Selected Device

若只有一個裝置：

顯示文字即可。

若有多個：

使用 Select 元件。

---

# Device Persistence

本 Task 僅將使用者選擇保存於 AppState。

使用者重新整理頁面後，不保留先前選擇。

跨頁面重新整理的持久化功能延後至後續 Task，並記錄於 TECH_DEBT.md。

---

# Device Change

監聽：

navigator.mediaDevices.devicechange

重新整理 Device List。

若目前裝置被拔除：

自動切換 Default Device。

---

# Testing

新增：

audioDeviceService.test.ts

測試：

- enumerateDevices
- Browser unsupported
- audioinput filtering
- default device
- empty device list
- devicechange subscription
- devicechange unsubscribe

新增：

useAudioDevices.test.tsx

測試：

- refresh
- select
- AppState update
- devicechange
- 保留仍存在的已選裝置
- 已選裝置拔除後 fallback 至 Default Device
- 無 Default Device 時 fallback 至第一個裝置
- 無裝置時 `selectedAudioInputId` 為 `null`
- 無效 device id 不更新 selection

全部使用 Mock。

---

# Acceptance

必須全部成功：

npm run build

npm test

npm run lint

---

# Documentation

更新：

- ROADMAP.md
- ARCHITECTURE_DECISIONS.md（ADR-011）
- TECH_DEBT.md

---

# Commit Message

Task 011: Audio device foundation