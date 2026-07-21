export type ThemeMode = 'system' | 'light' | 'dark';
export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';
export type MicrophonePermission = 'unknown' | 'granted' | 'denied';
export type AnalysisStatus = 'idle' | 'processing' | 'completed' | 'failed';

export interface CurrentSessionState {
  currentRecordingId: string | null;
  selectedAudioFile: string | null;
  analysisStatus: AnalysisStatus;
}

export interface AppState {
  theme: ThemeMode;
  recordingState: RecordingState;
  microphonePermission: MicrophonePermission;
  currentSession: CurrentSessionState;
  autoSaveRecording: boolean;
}

export interface AppStateActions {
  setTheme: (theme: ThemeMode) => void;
  setRecordingState: (recordingState: RecordingState) => void;
  setMicrophonePermission: (permission: MicrophonePermission) => void;
  setAutoSaveRecording: (enabled: boolean) => void;
  updateCurrentSession: (updater: (currentSession: CurrentSessionState) => CurrentSessionState) => void;
  resetSettings: () => void;
}
