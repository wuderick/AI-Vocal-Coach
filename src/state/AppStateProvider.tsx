import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateActions, MicrophonePermission } from './types';
import { AppStateContext } from './AppStateContext';
import { initialAppState, initialAudioCaptureRuntime } from './appState';
import * as microphoneService from '../services/audio/microphoneService';
import * as audioDeviceService from '../services/audio/audioDeviceService';
import * as audioCaptureService from '../services/audio/audioCaptureService';
import * as audioGraphService from '../services/audio/audioGraphService';

const CAPTURE_DEVICE_LOCK_STATES = new Set(['starting', 'active', 'stopping']);

function resolveThemeMode(theme: AppState['theme']): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') {
    return theme;
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return 'dark';
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialAppState);
  const stateRef = useRef<AppState>(initialAppState);
  const isMountedRef = useRef(true);
  const captureOperationRef = useRef(0);
  const captureRuntimeRef = useRef<audioCaptureService.AudioCaptureRuntime>(initialAudioCaptureRuntime);
  const graphRuntimeRef = useRef<audioGraphService.AudioGraphRuntime>(audioGraphService.initialAudioGraphRuntime);

  const safeSetState = (updater: (current: AppState) => AppState) => {
    if (!isMountedRef.current) return;

    setState((current) => {
      const next = updater(current);
      stateRef.current = next;
      return next;
    });
  };

  const setCaptureOperation = () => {
    captureOperationRef.current += 1;
    return captureOperationRef.current;
  };

  const shouldBlockDeviceSelection = (captureStatus: AppState['audioCaptureStatus']) =>
    CAPTURE_DEVICE_LOCK_STATES.has(captureStatus);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      setCaptureOperation();
      graphRuntimeRef.current = audioGraphService.disposeAudioGraph(graphRuntimeRef.current);
      void audioCaptureService.stopAudioCapture(captureRuntimeRef.current);
    };
  }, []);

  useEffect(() => {
    const updateDocumentTheme = () => {
      document.documentElement.dataset.theme = resolveThemeMode(state.theme);
    };

    updateDocumentTheme();

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => updateDocumentTheme();

    mediaQuery.addEventListener?.('change', listener);
    return () => mediaQuery.removeEventListener?.('change', listener);
  }, [state.theme]);

  const actions = useMemo<AppStateActions>(() => ({
    setTheme: (theme: AppState['theme']) => setState((current) => ({ ...current, theme })),
    setRecordingState: (recordingState: AppState['recordingState']) => setState((current) => ({ ...current, recordingState })),
    setMicrophonePermission: (microphonePermission: AppState['microphonePermission']) =>
      setState((current) => ({ ...current, microphonePermission })),
    refreshMicrophonePermission: async () => {
      const status = await microphoneService.getPermissionStatus();
      setState((current) => ({ ...current, microphonePermission: status as MicrophonePermission }));
    },
    requestMicrophonePermission: async () => {
      const status = await microphoneService.requestPermission();
      setState((current) => ({ ...current, microphonePermission: status as MicrophonePermission }));
    },
    refreshAudioDevices: async () => {
      try {
        const devices = await audioDeviceService.getAudioInputDevices();
        setState((current) => {
          const selectedId = current.selectedAudioInputId;
          const deviceExists = selectedId ? devices.some((d) => d.id === selectedId) : false;
          const newSelectedId = deviceExists
            ? selectedId
            : audioDeviceService.getDefaultAudioInput(devices)?.id ?? devices[0]?.id ?? null;

          return {
            ...current,
            audioInputDevices: devices,
            selectedAudioInputId: newSelectedId,
          };
        });
      } catch {
        setState((current) => ({
          ...current,
          audioInputDevices: [],
          selectedAudioInputId: null,
        }));
      }
    },
    selectAudioDevice: (deviceId: string) => {
      safeSetState((current) => {
        if (shouldBlockDeviceSelection(current.audioCaptureStatus)) return current;

        const deviceExists = current.audioInputDevices.some((device) => device.id === deviceId);
        if (!deviceExists) return current;
        return { ...current, selectedAudioInputId: deviceId };
      });
    },
    startAudioCapture: async () => {
      const currentStatus = stateRef.current.audioCaptureStatus;
      if (currentStatus === 'starting' || currentStatus === 'stopping') return;

      const operationId = setCaptureOperation();
      const selectedDeviceId = stateRef.current.selectedAudioInputId;
      const previousGraphRuntime = graphRuntimeRef.current;

      safeSetState((current) => ({
        ...current,
        audioCaptureStatus: 'starting',
        audioCaptureErrorCode: null,
      }));

      try {
        const runtime = await audioCaptureService.startAudioCapture({
          runtime: captureRuntimeRef.current,
          deviceId: selectedDeviceId,
        });

        let graphRuntime: audioGraphService.AudioGraphRuntime;
        try {
          graphRuntime = audioGraphService.initializeAudioGraph({
            audioContext: runtime.audioContext,
            mediaStream: runtime.mediaStream,
          });
        } catch (error) {
          const stoppedRuntime = await audioCaptureService.stopAudioCapture(runtime);

          if (!isMountedRef.current) return;
          if (operationId !== captureOperationRef.current) return;

          const errorCode = error instanceof audioCaptureService.AudioCaptureError ? error.code : 'unknown';
          captureRuntimeRef.current = stoppedRuntime;
          graphRuntimeRef.current = previousGraphRuntime;

          safeSetState((current) => ({
            ...current,
            audioCaptureStatus: 'error',
            audioCaptureErrorCode: errorCode,
            audioCaptureRuntime: stoppedRuntime,
            audioGraphRuntime: previousGraphRuntime,
          }));
          return;
        }

        if (!isMountedRef.current) {
          audioGraphService.disposeAudioGraph(graphRuntime);
          void audioCaptureService.stopAudioCapture(runtime);
          return;
        }

        if (operationId !== captureOperationRef.current) {
          audioGraphService.disposeAudioGraph(graphRuntime);
          audioCaptureService.stopMediaStream(runtime.mediaStream);
          captureRuntimeRef.current = {
            audioContext: runtime.audioContext,
            mediaStream: null,
          };
          return;
        }

        audioGraphService.disposeAudioGraph(previousGraphRuntime);
        captureRuntimeRef.current = runtime;
        graphRuntimeRef.current = graphRuntime;
        safeSetState((current) => ({
          ...current,
          audioCaptureStatus: 'active',
          audioCaptureErrorCode: null,
          audioCaptureRuntime: runtime,
          audioGraphRuntime: graphRuntime,
        }));
      } catch (error) {
        graphRuntimeRef.current = audioGraphService.disposeAudioGraph(graphRuntimeRef.current);
        const stoppedRuntime = await audioCaptureService.stopAudioCapture(captureRuntimeRef.current);
        captureRuntimeRef.current = stoppedRuntime;

        if (!isMountedRef.current) return;
        if (operationId !== captureOperationRef.current) return;

        const errorCode = error instanceof audioCaptureService.AudioCaptureError ? error.code : 'unknown';
        safeSetState((current) => ({
          ...current,
          audioCaptureStatus: 'error',
          audioCaptureErrorCode: errorCode,
          audioCaptureRuntime: stoppedRuntime,
          audioGraphRuntime: graphRuntimeRef.current,
        }));
      }
    },
    stopAudioCapture: async () => {
      const currentStatus = stateRef.current.audioCaptureStatus;
      if (currentStatus === 'stopping') return;

      const operationId = setCaptureOperation();

      safeSetState((current) => ({
        ...current,
        audioCaptureStatus: 'stopping',
      }));

      graphRuntimeRef.current = audioGraphService.disposeAudioGraph(graphRuntimeRef.current);

      const runtime = await audioCaptureService.stopAudioCapture(captureRuntimeRef.current);
      captureRuntimeRef.current = runtime;

      if (!isMountedRef.current) return;
      if (operationId !== captureOperationRef.current) return;

      safeSetState((current) => ({
        ...current,
        audioCaptureStatus: 'idle',
        audioCaptureErrorCode: null,
        audioCaptureRuntime: runtime,
        audioGraphRuntime: graphRuntimeRef.current,
      }));
    },
    setAutoSaveRecording: (enabled: boolean) => setState((current) => ({ ...current, autoSaveRecording: enabled })),
    updateCurrentSession: (updater: (currentSession: AppState['currentSession']) => AppState['currentSession']) =>
      setState((current) => ({ ...current, currentSession: updater(current.currentSession) })),
    resetSettings: () => {
      const operationId = setCaptureOperation();

      safeSetState(() => ({
        ...initialAppState,
        audioCaptureRuntime: {
          audioContext: captureRuntimeRef.current.audioContext,
          mediaStream: null,
        },
        audioGraphRuntime: audioGraphService.initialAudioGraphRuntime,
      }));

      graphRuntimeRef.current = audioGraphService.disposeAudioGraph(graphRuntimeRef.current);

      void audioCaptureService.stopAudioCapture(captureRuntimeRef.current).then((runtime) => {
        captureRuntimeRef.current = runtime;
        if (!isMountedRef.current) return;
        if (operationId !== captureOperationRef.current) return;

        safeSetState((current) => ({
          ...current,
          audioCaptureStatus: 'idle',
          audioCaptureErrorCode: null,
          audioCaptureRuntime: runtime,
          audioGraphRuntime: graphRuntimeRef.current,
        }));
      });
    },
  }), []);

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  useEffect(() => {
    const unsubscribe = audioDeviceService.subscribeToDeviceChanges(() => {
      void actions.refreshAudioDevices();
    });

    void actions.refreshAudioDevices();
    return unsubscribe;
  }, [actions]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
