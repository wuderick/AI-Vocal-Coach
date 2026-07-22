import type { AudioInputDevice } from '../types/audio';

export type ThemeMode = 'system' | 'light' | 'dark';
export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';
export type MicrophonePermission = 'unsupported' | 'prompt' | 'granted' | 'denied';
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
  audioInputDevices: AudioInputDevice[];
  selectedAudioInputId: string | null;
  currentSession: CurrentSessionState;
  autoSaveRecording: boolean;
}

export interface AppStateActions {
  setTheme: (theme: ThemeMode) => void;
  setRecordingState: (recordingState: RecordingState) => void;
  setMicrophonePermission: (permission: MicrophonePermission) => void;
  refreshMicrophonePermission: () => Promise<void>;
  requestMicrophonePermission: () => Promise<void>;
  refreshAudioDevices: () => Promise<void>;
  selectAudioDevice: (deviceId: string) => void;
  setAutoSaveRecording: (enabled: boolean) => void;
  updateCurrentSession: (updater: (currentSession: CurrentSessionState) => CurrentSessionState) => void;
  resetSettings: () => void;
}
