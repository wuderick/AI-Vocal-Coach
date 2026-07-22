import { AppState, AnalysisStatus, CurrentSessionState, MicrophonePermission, RecordingState, ThemeMode } from './types';
import type { AudioCaptureStatus } from './types';
import type { AudioCaptureRuntime } from '../services/audio/audioCaptureService';
import { initialAudioGraphRuntime } from '../services/audio/audioGraphService';
import { initialFrequencyBufferRuntime } from '../services/audio/frequencyBufferService';

export const initialCurrentSessionState: CurrentSessionState = {
  currentRecordingId: null,
  selectedAudioFile: null,
  analysisStatus: 'idle',
};

export const initialAudioCaptureStatus: AudioCaptureStatus = 'idle';

export const initialAudioCaptureRuntime: AudioCaptureRuntime = {
  audioContext: null,
  mediaStream: null,
};

export const initialAppState: AppState = {
  theme: 'system',
  recordingState: 'idle',
  microphonePermission: 'prompt',
  audioInputDevices: [],
  selectedAudioInputId: null,
  audioCaptureStatus: initialAudioCaptureStatus,
  audioCaptureErrorCode: null,
  audioCaptureRuntime: initialAudioCaptureRuntime,
  audioGraphRuntime: initialAudioGraphRuntime,
  audioFrequencyBufferRuntime: initialFrequencyBufferRuntime,
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
