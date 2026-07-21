import { useCallback } from 'react';
import { useAppStateContext } from './AppStateContext';
import { ThemeMode } from './types';

export function useSettingsState() {
  const { state, actions } = useAppStateContext();

  const setTheme = useCallback((theme: ThemeMode) => {
    actions.setTheme(theme);
  }, [actions]);

  const setAutoSaveRecording = useCallback((enabled: boolean) => {
    actions.setAutoSaveRecording(enabled);
  }, [actions]);

  const resetSettings = useCallback(() => {
    actions.resetSettings();
  }, [actions]);

  return {
    theme: state.theme,
    autoSaveRecording: state.autoSaveRecording,
    recordingState: state.recordingState,
    microphonePermission: state.microphonePermission,
    analysisStatus: state.currentSession.analysisStatus,
    currentRecordingId: state.currentSession.currentRecordingId,
    setTheme,
    setAutoSaveRecording,
    resetSettings,
  };
}
