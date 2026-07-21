# Architecture Decisions

## ADR-008 — Application State Management

### Status
Accepted

### Context
The application needs shared state for theme, recording status, microphone permission, and current analysis session.
Future features should avoid prop drilling and reuse a consistent state access pattern.

### Decision
Use React Context with custom hooks.
Do not use Redux, Zustand, or another external state library at this stage.
Wrap the application once with `AppStateProvider`.
Access global state through reusable hooks instead of consuming context directly.

### Consequences

#### Benefits
- No new dependency
- Strong TypeScript integration
- Simple architecture for the current project size
- Easy to extend for upcoming audio and settings tasks

#### Trade-offs
- Context updates may re-render consumers
- State may need to be split into smaller contexts if the application becomes significantly larger
- More specialized hooks may be introduced later, such as `useTheme`, `useRecording`, `useMicrophone`, and `useSession`

## ADR-009 — Settings System Architecture

### Status
Accepted

### Context
The Settings system must expose appearance, recording preferences, and developer state without adding new persistence or extra libraries.
It should reuse the existing design system and application state, keeping presentation separate from state management.

### Decision
Implement a dedicated settings state hook that reads from `AppStateProvider`.
Build the settings page using reusable design system components including `Card`, `Section`, `Button`, `Switch`, and `Container`.
Use `useSettingsState` to abstract state access and actions, keeping the page component focused on UI.

### Consequences

#### Benefits
- Clean separation of presentation and state logic
- Reuses the existing global state foundation
- Easy to extend with additional settings sections later
- No extra dependencies required

#### Trade-offs
- Simple hook-based state access may need more specialization if the settings page grows
- The page remains tied to context-driven state rather than isolated local state for every control
