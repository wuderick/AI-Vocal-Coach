import { describe, it, expect, vi, afterEach } from 'vitest';
import { getAudioInputDevices, getDefaultAudioInput, subscribeToDeviceChanges } from './audioDeviceService';

describe('audioDeviceService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns [] when navigator is missing and subscribe returns a safe no-op', async () => {
    vi.stubGlobal('navigator', undefined as unknown as Navigator);

    expect(await getAudioInputDevices()).toEqual([]);

    const unsubscribe = subscribeToDeviceChanges(() => {
      throw new Error('should not be called');
    });

    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });

  it('returns [] when navigator.mediaDevices is missing and subscribe returns a safe no-op', async () => {
    vi.stubGlobal('navigator', {} as Navigator);

    expect(await getAudioInputDevices()).toEqual([]);

    const unsubscribe = subscribeToDeviceChanges(() => {
      throw new Error('should not be called');
    });

    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });

  it('filters only audioinput devices and maps deviceId/label/isDefault correctly', async () => {
    const enumerateDevices = vi.fn().mockResolvedValue([
      { kind: 'audioinput', deviceId: 'default', label: '', groupId: '1' },
      { kind: 'audioinput', deviceId: 'mic-1', label: 'My microphone', groupId: '1' },
      { kind: 'audioinput', deviceId: 'mic-2', label: '', groupId: '1' },
      { kind: 'videoinput', deviceId: 'camera-1', label: 'Camera', groupId: '2' },
      { kind: 'audiooutput', deviceId: 'speaker-1', label: 'Speaker', groupId: '3' },
    ]);

    vi.stubGlobal('navigator', { mediaDevices: { enumerateDevices } } as unknown as Navigator);

    const devices = await getAudioInputDevices();

    expect(devices).toEqual([
      { id: 'default', label: 'Microphone 1', isDefault: true },
      { id: 'mic-1', label: 'My microphone', isDefault: false },
      { id: 'mic-2', label: 'Microphone 3', isDefault: false },
    ]);
  });

  it('returns [] when enumerateDevices rejects', async () => {
    const enumerateDevices = vi.fn().mockRejectedValue(new Error('Permissions denied'));
    vi.stubGlobal('navigator', { mediaDevices: { enumerateDevices } } as unknown as Navigator);

    await expect(getAudioInputDevices()).resolves.toEqual([]);
  });

  it('getDefaultAudioInput returns the default device if present', () => {
    const defaultDevice = { id: 'default', label: 'Microphone 1', isDefault: true };
    const otherDevice = { id: 'mic-1', label: 'My microphone', isDefault: false };

    expect(getDefaultAudioInput([defaultDevice, otherDevice])).toBe(defaultDevice);
  });

  it('getDefaultAudioInput returns the first device when no default exists', () => {
    const device = { id: 'mic-1', label: 'My microphone', isDefault: false };
    expect(getDefaultAudioInput([device])).toBe(device);
  });

  it('getDefaultAudioInput returns null for an empty device list', () => {
    expect(getDefaultAudioInput([])).toBeNull();
  });

  it('uses addEventListener/removeEventListener when supported and invokes callback', () => {
    const listeners: Record<string, ((event: Event) => void)[]> = { devicechange: [] };
    const mediaDevices = {
      addEventListener: vi.fn((event: string, listener: (event: Event) => void) => {
        listeners[event]?.push(listener);
      }),
      removeEventListener: vi.fn((event: string, listener: (event: Event) => void) => {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter((item) => item !== listener);
      }),
    };

    vi.stubGlobal('navigator', { mediaDevices } as unknown as Navigator);

    const callback = vi.fn();
    const unsubscribe = subscribeToDeviceChanges(callback);

    expect(mediaDevices.addEventListener).toHaveBeenCalledWith('devicechange', callback);
    expect(typeof unsubscribe).toBe('function');

    listeners.devicechange.forEach((listener) => listener(new Event('devicechange')));
    expect(callback).toHaveBeenCalledTimes(1);

    unsubscribe();
    expect(mediaDevices.removeEventListener).toHaveBeenCalledWith('devicechange', callback);
  });
});
