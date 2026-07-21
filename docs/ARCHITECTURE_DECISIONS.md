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
