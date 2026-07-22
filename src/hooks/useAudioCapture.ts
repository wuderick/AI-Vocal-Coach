import { useCallback } from 'react';
import type { AudioCaptureErrorCode } from '../services/audio/audioCaptureService';
import { useAppStateContext } from '../state/AppStateContext';

const ERROR_CODE_TO_ZH_TW_MESSAGE: Record<AudioCaptureErrorCode, string> = {
  'permission-denied': '沒有麥克風使用權限',
  'device-not-found': '找不到所選麥克風',
  'device-busy': '麥克風目前無法使用，可能正被其他程式占用',
  'unsupported-browser': '此瀏覽器不支援麥克風收音',
  'audio-context-failed': '無法啟動音訊系統',
  unknown: '啟動麥克風時發生未知錯誤',
};

export function getAudioCaptureErrorMessage(code: AudioCaptureErrorCode): string {
  return ERROR_CODE_TO_ZH_TW_MESSAGE[code];
}

export function useAudioCapture() {
  const { state, actions } = useAppStateContext();

  const startAudioCapture = useCallback(async () => {
    await actions.startAudioCapture();
  }, [actions]);

  const stopAudioCapture = useCallback(async () => {
    await actions.stopAudioCapture();
  }, [actions]);

  const updateFrequencyBuffer = useCallback(() => actions.updateFrequencyBuffer(), [actions]);
  const updateTimeDomainBuffer = useCallback(() => actions.updateTimeDomainBuffer(), [actions]);
  const startFrequencyUpdateScheduler = useCallback(() => actions.startFrequencyUpdateScheduler(), [actions]);
  const stopFrequencyUpdateScheduler = useCallback(() => actions.stopFrequencyUpdateScheduler(), [actions]);

  return {
    captureStatus: state.audioCaptureStatus,
    captureErrorCode: state.audioCaptureErrorCode,
    captureErrorMessage: state.audioCaptureErrorCode ? getAudioCaptureErrorMessage(state.audioCaptureErrorCode) : null,
    isCaptureActive: state.audioCaptureStatus === 'active',
    isAudioGraphReady: Boolean(state.audioGraphRuntime.sourceNode && state.audioGraphRuntime.analyserNode),
    isFrequencyBufferReady:
      state.audioFrequencyBufferRuntime.frequencyData !== null
      && state.audioFrequencyBufferRuntime.frequencyData.length > 0,
    isTimeDomainBufferReady:
      state.audioTimeDomainBufferRuntime?.timeDomainData !== null
      && (state.audioTimeDomainBufferRuntime?.timeDomainData?.length ?? 0) > 0,
    startAudioCapture,
    stopAudioCapture,
    updateFrequencyBuffer,
    updateTimeDomainBuffer,
    startFrequencyUpdateScheduler,
    stopFrequencyUpdateScheduler,
  };
}
