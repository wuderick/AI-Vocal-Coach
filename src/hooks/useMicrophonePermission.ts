import { useCallback, useEffect, useState } from 'react';
import { useAppStateContext } from '../state/AppStateContext';
import { MicrophonePermission } from '../state/types';

export function useMicrophonePermission() {
  const { state, actions } = useAppStateContext();
  const [isRequesting, setIsRequesting] = useState(false);

  const refreshPermission = useCallback(async () => {
    // Call provider action which will call the service
    try {
      await actions.refreshMicrophonePermission();
    } catch {
      // provider guarantees not to throw, but guard
    }
  }, [actions]);

  const requestPermission = useCallback(async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      await actions.requestMicrophonePermission();
    } catch {
      // provider will not throw; swallow
    } finally {
      setIsRequesting(false);
    }
  }, [actions, isRequesting]);

  useEffect(() => {
    // On mount, allowed to refresh status once (must not trigger getUserMedia)
    refreshPermission();
  }, [refreshPermission]);

  return {
    permission: state.microphonePermission as MicrophonePermission,
    isSupported: typeof navigator !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    refreshPermission,
    requestPermission,
    isRequesting,
  };
}
