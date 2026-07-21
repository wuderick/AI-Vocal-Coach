import React, { useEffect, useMemo, useState } from 'react';
import { AppState, AppStateActions } from './types';
import { AppStateContext } from './AppStateContext';
import { initialAppState } from './appState';

function resolveThemeMode(theme: AppState['theme']): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') {
    return theme;
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return 'dark';
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialAppState);

  useEffect(() => {
    const updateDocumentTheme = () => {
      document.documentElement.dataset.theme = resolveThemeMode(state.theme);
    };

    updateDocumentTheme();

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => updateDocumentTheme();

    mediaQuery.addEventListener?.('change', listener);
    return () => mediaQuery.removeEventListener?.('change', listener);
  }, [state.theme]);

  const actions = useMemo<AppStateActions>(() => ({
    setTheme: (theme: AppState['theme']) => setState((current) => ({ ...current, theme })),
    setRecordingState: (recordingState: AppState['recordingState']) => setState((current) => ({ ...current, recordingState })),
    setMicrophonePermission: (microphonePermission: AppState['microphonePermission']) =>
      setState((current) => ({ ...current, microphonePermission })),
    setAutoSaveRecording: (enabled: boolean) => setState((current) => ({ ...current, autoSaveRecording: enabled })),
    updateCurrentSession: (updater: (currentSession: AppState['currentSession']) => AppState['currentSession']) =>
      setState((current) => ({ ...current, currentSession: updater(current.currentSession) })),
    resetSettings: () => setState(initialAppState),
  }), []);

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
