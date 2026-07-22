# Task 011：Audio Device Foundation

## Goal

建立 AI Vocal Coach 的音訊輸入裝置管理基礎。

本 Task 僅負責：

- 列出可用麥克風
- 選擇麥克風
- 保存使用者選擇
- 偵測裝置插拔

不實作錄音。

---

# Scope

## Included

- enumerateDevices()
- audioinput filtering
- Device selector
- Device change detection
- Device persistence is deferred / non-goal for this task; session-only selection is implemented
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

回傳型別：

```ts
export interface AudioInputDevice {
    id: string;
    label: string;
    isDefault: boolean;
}
```

禁止直接回傳 MediaDeviceInfo。

---

# AppState

新增：

- audioInputDevices
- selectedAudioInputId

Actions：

- refreshAudioDevices()
- selectAudioDevice()

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

使用既有 Settings Storage。

重新整理頁面後：

自動恢復使用者選擇。

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

新增：

useAudioDevices.test.tsx

測試：

- refresh
- select
- AppState update
- devicechange

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