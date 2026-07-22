import { useCallback } from 'react';
import { useAppStateContext } from '../state/AppStateContext';

export function useAudioDevices() {
  const { state, actions } = useAppStateContext();

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
    refreshAudioDevices,
    selectAudioDevice,
  };
}
