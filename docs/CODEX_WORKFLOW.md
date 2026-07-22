# Codex Development Workflow

本專案採用「Architecture First」開發流程。

---

# Development Flow

## Phase 1：Architecture Design（ChatGPT）

ChatGPT 負責：

- Architecture
- System Design
- State Design
- Hook Design
- Service Design
- UI Review
- Code Review
- QA Review

---

## Phase 2：Task Document

每個功能必須先建立：

tasks/TASK_xxx.md

Task 必須包含：

- Goal
- Scope
- Non-goals
- Architecture
- Files
- Testing
- Acceptance Criteria
- ADR
- Commit Message

---

## Phase 3：Read Task

Codex 必須先閱讀：

README.md

docs/

AGENTS.md

tasks/TASK_xxx.md

閱讀後：

- 說明理解
- 說明修改檔案
- 等待人工確認

禁止直接開始寫程式。

---

## Phase 4：Implementation

Codex 開始實作。

完成後必須：

npm run build

npm test

npm run lint

若失敗：

自行修正直到全部成功。

---

## Phase 5：Manual Review

等待人工 Review。

禁止執行：

- git add
- git commit
- git push
- git rebase
- git amend

---

## Phase 6：Human Verification

人工確認：

- UI
- Browser
- Permission
- UX
- Regression

---

## Phase 7：Git

人工執行：

git add

git commit

git push

---

# Architecture Rules

UI

↓

Hook

↓

AppState

↓

Service

↓

Browser API

禁止：

UI → Browser API

UI → Service

Hook → Browser API

Hook → Service

---

# Service Rules

所有：

navigator

window

document

MediaRecorder

AudioContext

Web APIs

必須封裝於 Service。

---

# Testing Rules

每個 Task：

- build
- test
- lint

全部必須成功。

---

# Git Rules

Codex 不得執行 Git 指令。

所有 Git 操作皆由人工完成。