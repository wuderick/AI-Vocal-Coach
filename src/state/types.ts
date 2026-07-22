import type { AudioInputDevice } from '../types/audio';
import type { AudioCaptureErrorCode, AudioCaptureRuntime } from '../services/audio/audioCaptureService';
import type { AudioGraphRuntime } from '../services/audio/audioGraphService';
import type { FrequencyBufferRuntime } from '../services/audio/frequencyBufferService';

export type ThemeMode = 'system' | 'light' | 'dark';
export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';
export type MicrophonePermission = 'unsupported' | 'prompt' | 'granted' | 'denied';
export type AnalysisStatus = 'idle' | 'processing' | 'completed' | 'failed';
export type AudioCaptureStatus = 'idle' | 'starting' | 'active' | 'stopping' | 'error';

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
  audioCaptureStatus: AudioCaptureStatus;
  audioCaptureErrorCode: AudioCaptureErrorCode | null;
  audioCaptureRuntime: AudioCaptureRuntime;
  audioGraphRuntime: AudioGraphRuntime;
  audioFrequencyBufferRuntime: FrequencyBufferRuntime;
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
  startAudioCapture: () => Promise<void>;
  stopAudioCapture: () => Promise<void>;
  updateFrequencyBuffer: () => Float32Array;
  startFrequencyUpdateScheduler: () => void;
  stopFrequencyUpdateScheduler: () => void;
  setAutoSaveRecording: (enabled: boolean) => void;
  updateCurrentSession: (updater: (currentSession: CurrentSessionState) => CurrentSessionState) => void;
  resetSettings: () => void;
}
