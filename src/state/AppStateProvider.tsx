import React, { useMemo, useState } from 'react';
import { AppState, AppStateActions } from './types';
import { AppStateContext } from './AppStateContext';
import { initialAppState } from './appState';

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialAppState);

  const actions = useMemo<AppStateActions>(() => ({
    setTheme: (theme: AppState['theme']) => setState((current) => ({ ...current, theme })),
    setRecordingState: (recordingState: AppState['recordingState']) => setState((current) => ({ ...current, recordingState })),
    setMicrophonePermission: (microphonePermission: AppState['microphonePermission']) =>
      setState((current) => ({ ...current, microphonePermission })),
    updateCurrentSession: (updater: (currentSession: AppState['currentSession']) => AppState['currentSession']) =>
      setState((current) => ({ ...current, currentSession: updater(current.currentSession) })),
  }), []);

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
