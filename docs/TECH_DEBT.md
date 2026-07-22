# Technical Debt

本文件紀錄目前刻意延後處理的技術債。

---

## Pending

### Audio Engine

目前：

- 僅建立 Permission Foundation

未來：

- Recording
- MediaRecorder
- Audio Pipeline
- Web Audio API

---

### Error Handling

目前：

- 基本錯誤處理

未來：

- Error Boundary
- Toast System
- Global Error State

---

### Logging

目前：

- Console

未來：

- Logger Service

---

### Settings

目前：

- Local State
- Audio device selection is session-only and not persisted across refresh

未來：

- Persistent Profile
- Integrate unified Settings persistence so audio device selection can survive page reloads

---

### Tests

目前：

- Unit Test

未來：

- E2E
- Playwright
- Browser Automation

---

### Performance

未來：

- Lazy Loading
- Code Splitting
- Worker
- Audio Threadgit push origin main