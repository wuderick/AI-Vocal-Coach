import { useCallback } from 'react';
import { useAppStateContext } from '../state/AppStateContext';

export function useAudioDevices() {
  const { state, actions } = useAppStateContext();
  const isDeviceSelectionDisabled = state.audioCaptureStatus === 'starting'
    || state.audioCaptureStatus === 'active'
    || state.audioCaptureStatus === 'stopping';

  const refreshAudioDevices = useCallback(async () => {
    await actions.refreshAudioDevices();
  }, [actions]);

  const selectAudioDevice = useCallback(
    (deviceId: string) => {
      actions.selectAudioDevice(deviceId);
    },
    [actions],
  );

  return {
    audioInputDevices: state.audioInputDevices,
    selectedAudioInputId: state.selectedAudioInputId,
    isDeviceSelectionDisabled,
    refreshAudioDevices,
    selectAudioDevice,
  };
}
