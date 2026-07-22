import type { AudioInputDevice } from '../../types/audio';

function normalizeLabel(label: string, index: number): string {
  if (label.trim()) return label;
  return `Microphone ${index + 1}`;
}

export function getAudioInputDevices(): Promise<AudioInputDevice[]> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices !== 'function') {
    return Promise.resolve([]);
  }

  return navigator.mediaDevices
    .enumerateDevices()
    .then((devices) =>
      devices
        .filter((device) => device.kind === 'audioinput')
        .map((device, index) => ({
          id: device.deviceId,
          label: normalizeLabel(device.label, index),
          isDefault: device.deviceId === 'default',
        })),
    )
    .catch((error) => {
      // Surface the error to logs for visibility but remain backwards-compatible
      // by returning an empty list to callers.
      // eslint-disable-next-line no-console
      console.error('Failed to enumerate audio input devices.', error);
      return [];
    });
}

export function getDefaultAudioInput(devices: AudioInputDevice[]): AudioInputDevice | null {
  return devices.find((device) => device.isDefault) ?? devices[0] ?? null;
}

export function subscribeToDeviceChanges(listener: () => void): () => void {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
    return () => {};
  }

  const target = navigator.mediaDevices;
  if (typeof target.addEventListener === 'function' && typeof target.removeEventListener === 'function') {
    target.addEventListener('devicechange', listener);
    return () => target.removeEventListener('devicechange', listener);
  }

  // If the environment does not support addEventListener/removeEventListener
  // for mediaDevices, do not attempt any fallback and return a noop unsubscribe.
  return () => {};
}
