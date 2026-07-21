import { useCallback, useMemo } from 'react';
import { useAppStateContext } from './AppStateContext';
import { AppState, AppStateActions, CurrentSessionState } from './types';

export function useAppState(): AppState {
  return useAppStateContext().state;
}

export function useAppStateActions(): AppStateActions {
  return useAppStateContext().actions;
}

export function useTheme(): [AppState['theme'], AppStateActions['setTheme']] {
  const { state, actions } = useAppStateContext();
  return [state.theme, actions.setTheme];
}

export function useRecordingState(): [AppState['recordingState'], AppStateActions['setRecordingState']] {
  const { state, actions } = useAppStateContext();
  return [state.recordingState, actions.setRecordingState];
}

export function useMicrophonePermission(): [AppState['microphonePermission'], AppStateActions['setMicrophonePermission']] {
  const { state, actions } = useAppStateContext();
  return [state.microphonePermission, actions.setMicrophonePermission];
}

export function useCurrentSession(): [CurrentSessionState, AppStateActions['updateCurrentSession']] {
  const { state, actions } = useAppStateContext();
  return [state.currentSession, actions.updateCurrentSession];
}

export function useAppStateSelectors() {
  const { state, actions } = useAppStateContext();

  return useMemo(
    () => ({
      theme: state.theme,
      recordingState: state.recordingState,
      microphonePermission: state.microphonePermission,
      currentSession: state.currentSession,
      setTheme: actions.setTheme,
      setRecordingState: actions.setRecordingState,
      setMicrophonePermission: actions.setMicrophonePermission,
      updateCurrentSession: actions.updateCurrentSession,
    }),
    [actions, state],
  );
}

export function useUpdateCurrentRecordingId() {
  const { actions } = useAppStateContext();
  return useCallback(
    (currentRecordingId: string | null) => {
      actions.updateCurrentSession((currentSession: CurrentSessionState) => ({
        ...currentSession,
        currentRecordingId,
      }));
    },
    [actions],
  );
}

export function useSelectAudioFile() {
  const { actions } = useAppStateContext();
  return useCallback(
    (selectedAudioFile: string | null) => {
      actions.updateCurrentSession((currentSession: CurrentSessionState) => ({
        ...currentSession,
        selectedAudioFile,
      }));
    },
    [actions],
  );
}

export function useSetAnalysisStatus() {
  const { actions } = useAppStateContext();
  return useCallback(
    (analysisStatus: CurrentSessionState['analysisStatus']) => {
      actions.updateCurrentSession((currentSession: CurrentSessionState) => ({
        ...currentSession,
        analysisStatus,
      }));
    },
    [actions],
  );
}
