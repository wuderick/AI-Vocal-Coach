import { AppState, AnalysisStatus, CurrentSessionState, MicrophonePermission, RecordingState, ThemeMode } from './types';

export const initialCurrentSessionState: CurrentSessionState = {
  currentRecordingId: null,
  selectedAudioFile: null,
  analysisStatus: 'idle',
};

export const initialAppState: AppState = {
  theme: 'system',
  recordingState: 'idle',
  microphonePermission: 'prompt',
  currentSession: initialCurrentSessionState,
  autoSaveRecording: true,
};

export function createAppState(overrides: Partial<AppState> = {}): AppState {
  return {
    ...initialAppState,
    ...overrides,
    currentSession: {
      ...initialCurrentSessionState,
      ...overrides.currentSession,
    },
  };
}

export const themeModes: ThemeMode[] = ['system', 'light', 'dark'];
export const recordingStates: RecordingState[] = ['idle', 'recording', 'paused', 'stopped'];
export const microphonePermissions: MicrophonePermission[] = ['prompt', 'granted', 'denied', 'unsupported'];
export const analysisStatuses: AnalysisStatus[] = ['idle', 'processing', 'completed', 'failed'];
