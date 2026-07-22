import React, { useEffect, useMemo, useState } from 'react';
import { AppState, AppStateActions, MicrophonePermission } from './types';
import { AppStateContext } from './AppStateContext';
import { initialAppState } from './appState';
import * as microphoneService from '../services/audio/microphoneService';
import * as audioDeviceService from '../services/audio/audioDeviceService';

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
      setState((current) => {
        const deviceExists = current.audioInputDevices.some((device) => device.id === deviceId);
        if (!deviceExists) return current;
        return { ...current, selectedAudioInputId: deviceId };
      });
    },
    setAutoSaveRecording: (enabled: boolean) => setState((current) => ({ ...current, autoSaveRecording: enabled })),
    updateCurrentSession: (updater: (currentSession: AppState['currentSession']) => AppState['currentSession']) =>
      setState((current) => ({ ...current, currentSession: updater(current.currentSession) })),
    resetSettings: () => setState(initialAppState),
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
