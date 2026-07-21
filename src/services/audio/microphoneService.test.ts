import { vi } from 'vitest';
import * as svc from './microphoneService';

describe('microphoneService', () => {
  beforeEach(() => {
    // remove navigator if previously defined
    Reflect.deleteProperty(globalThis, 'navigator');
  });

  it('isSupported returns false when mediaDevices missing', () => {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
    expect(svc.isSupported()).toBe(false);
  });

  it('getPermissionStatus returns unsupported when not supported', async () => {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
    const status = await svc.getPermissionStatus();
    expect(status).toBe('unsupported');
  });

  it('getPermissionStatus returns prompt when permissions API missing', async () => {
    Object.defineProperty(globalThis, 'navigator', { value: { mediaDevices: { getUserMedia: vi.fn() } }, configurable: true });
    const status = await svc.getPermissionStatus();
    expect(status).toBe('prompt');
  });

  it('getPermissionStatus maps granted/denied from permissions.query', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ state: 'granted' });
    Object.defineProperty(globalThis, 'navigator', { value: { mediaDevices: { getUserMedia: vi.fn() }, permissions: { query: mockQuery } }, configurable: true });
    const status = await svc.getPermissionStatus();
    expect(status).toBe('granted');

    mockQuery.mockResolvedValueOnce({ state: 'denied' });
    const status2 = await svc.getPermissionStatus();
    expect(status2).toBe('denied');
  });

  it('requestPermission returns granted and stops tracks on success', async () => {
    const stopMock = vi.fn();
    const mockStream = { getTracks: () => [{ stop: stopMock }] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(mockStream);
    Object.defineProperty(globalThis, 'navigator', { value: { mediaDevices: { getUserMedia } }, configurable: true });

    const res = await svc.requestPermission();
    expect(res).toBe('granted');
    expect(stopMock).toHaveBeenCalled();
  });

  it('requestPermission returns denied on failure', async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new Error('nope'));
    Object.defineProperty(globalThis, 'navigator', { value: { mediaDevices: { getUserMedia } }, configurable: true });

    const res = await svc.requestPermission();
    expect(res).toBe('denied');
  });

  it('stops all tracks even if some stop() throw', async () => {
    const stop1 = vi.fn(() => { throw new Error('boom'); });
    const stop2 = vi.fn();
    const mockStream = { getTracks: () => [{ stop: stop1 }, { stop: stop2 }] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(mockStream);
    Object.defineProperty(globalThis, 'navigator', { value: { mediaDevices: { getUserMedia } }, configurable: true });

    const res = await svc.requestPermission();
    expect(res).toBe('granted');
    expect(stop1).toHaveBeenCalled();
    expect(stop2).toHaveBeenCalled();
  });
});
