import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AudioCaptureError,
  createAudioContext,
  ensureAudioContext,
  getAudioStream,
  startAudioCapture,
  stopAudioCapture,
  stopMediaStream,
  suspendAudioContext,
} from './audioCaptureService';

class MockAudioContext {
  state: AudioContextState;
  readonly resume = vi.fn(async () => {
    this.state = 'running';
  });
  readonly suspend = vi.fn(async () => {
    this.state = 'suspended';
  });
  readonly close = vi.fn(async () => {
    this.state = 'closed';
  });

  constructor(initialState: AudioContextState = 'running') {
    this.state = initialState;
  }
}

function mockStream(tracks?: Array<{ stop: () => void }>): MediaStream {
  return {
    getTracks: () => tracks ?? [],
  } as unknown as MediaStream;
}

describe('audioCaptureService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses default audio constraint when deviceId is not provided', async () => {
    const getUserMedia = vi.fn().mockResolvedValue(mockStream());
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } } as unknown as Navigator);

    await getAudioStream();

    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
  });

  it('uses exact deviceId constraint when deviceId is provided', async () => {
    const getUserMedia = vi.fn().mockResolvedValue(mockStream());
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } } as unknown as Navigator);

    await getAudioStream('mic-123');

    expect(getUserMedia).toHaveBeenCalledWith({
      audio: {
        deviceId: {
          exact: 'mic-123',
        },
      },
    });
  });

  it('creates AudioContext on first start', async () => {
    const getUserMedia = vi.fn().mockResolvedValue(mockStream());
    const AudioContextCtor = vi.fn(() => new MockAudioContext('running'));
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } } as unknown as Navigator);
    vi.stubGlobal('AudioContext', AudioContextCtor as unknown as typeof AudioContext);

    const runtime = await startAudioCapture();

    expect(AudioContextCtor).toHaveBeenCalledTimes(1);
    expect(runtime.audioContext).toBeTruthy();
    expect(runtime.mediaStream).toBeTruthy();
  });

  it('reuses existing AudioContext and does not create a new one', async () => {
    const getUserMedia = vi.fn().mockResolvedValue(mockStream());
    const AudioContextCtor = vi.fn(() => {
      throw new Error('must not be called');
    });
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } } as unknown as Navigator);
    vi.stubGlobal('AudioContext', AudioContextCtor as unknown as typeof AudioContext);

    const existingContext = new MockAudioContext('running') as unknown as AudioContext;
    const runtime = await startAudioCapture({
      runtime: {
        audioContext: existingContext,
        mediaStream: null,
      },
    });

    expect(runtime.audioContext).toBe(existingContext);
    expect((existingContext.resume as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
    expect(AudioContextCtor).toHaveBeenCalledTimes(0);
  });

  it('resumes suspended AudioContext during start', async () => {
    const getUserMedia = vi.fn().mockResolvedValue(mockStream());
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } } as unknown as Navigator);

    const existingContext = new MockAudioContext('suspended') as unknown as AudioContext;
    const runtime = await startAudioCapture({
      runtime: {
        audioContext: existingContext,
        mediaStream: null,
      },
    });

    const resumeMock = existingContext.resume as unknown as ReturnType<typeof vi.fn>;
    expect(resumeMock).toHaveBeenCalledTimes(1);
    expect(runtime.audioContext).toBe(existingContext);
  });

  it('does not resume running AudioContext during start', async () => {
    const getUserMedia = vi.fn().mockResolvedValue(mockStream());
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } } as unknown as Navigator);

    const existingContext = new MockAudioContext('running') as unknown as AudioContext;
    await startAudioCapture({
      runtime: {
        audioContext: existingContext,
        mediaStream: null,
      },
    });

    const resumeMock = existingContext.resume as unknown as ReturnType<typeof vi.fn>;
    expect(resumeMock).not.toHaveBeenCalled();
  });

  it('stopAudioCapture stops all media stream tracks', async () => {
    const stop1 = vi.fn();
    const stop2 = vi.fn();
    const stream = mockStream([{ stop: stop1 }, { stop: stop2 }]);

    const runtime = await stopAudioCapture({
      audioContext: new MockAudioContext('running') as unknown as AudioContext,
      mediaStream: stream,
    });

    expect(stop1).toHaveBeenCalledTimes(1);
    expect(stop2).toHaveBeenCalledTimes(1);
    expect(runtime.mediaStream).toBeNull();
  });

  it('stopAudioCapture suspends AudioContext', async () => {
    const context = new MockAudioContext('running') as unknown as AudioContext;

    await stopAudioCapture({
      audioContext: context,
      mediaStream: null,
    });

    const suspendMock = context.suspend as unknown as ReturnType<typeof vi.fn>;
    expect(suspendMock).toHaveBeenCalledTimes(1);
  });

  it('stopAudioCapture does not call close on AudioContext', async () => {
    const context = new MockAudioContext('running') as unknown as AudioContext;

    await stopAudioCapture({
      audioContext: context,
      mediaStream: null,
    });

    const closeMock = context.close as unknown as ReturnType<typeof vi.fn>;
    expect(closeMock).not.toHaveBeenCalled();
  });

  it('cleanup functions do not throw on null stream/context', async () => {
    expect(() => stopMediaStream(null)).not.toThrow();
    await expect(suspendAudioContext(null)).resolves.toBeUndefined();

    await expect(
      stopAudioCapture({
        audioContext: null,
        mediaStream: null,
      }),
    ).resolves.toEqual({
      audioContext: null,
      mediaStream: null,
    });
  });

  it('maps NotAllowedError to permission-denied', async () => {
    const getUserMedia = vi.fn().mockRejectedValue({ name: 'NotAllowedError' });
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } } as unknown as Navigator);

    await expect(getAudioStream()).rejects.toMatchObject({
      name: 'AudioCaptureError',
      code: 'permission-denied',
    });
  });

  it('maps NotFoundError to device-not-found', async () => {
    const getUserMedia = vi.fn().mockRejectedValue({ name: 'NotFoundError' });
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } } as unknown as Navigator);

    await expect(getAudioStream()).rejects.toMatchObject({ code: 'device-not-found' });
  });

  it('maps OverconstrainedError to device-not-found', async () => {
    const getUserMedia = vi.fn().mockRejectedValue({ name: 'OverconstrainedError' });
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } } as unknown as Navigator);

    await expect(getAudioStream('missing-device')).rejects.toMatchObject({ code: 'device-not-found' });
  });

  it('maps NotReadableError to device-busy', async () => {
    const getUserMedia = vi.fn().mockRejectedValue({ name: 'NotReadableError' });
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } } as unknown as Navigator);

    await expect(getAudioStream()).rejects.toMatchObject({ code: 'device-busy' });
  });

  it('maps AbortError to device-busy', async () => {
    const getUserMedia = vi.fn().mockRejectedValue({ name: 'AbortError' });
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } } as unknown as Navigator);

    await expect(getAudioStream()).rejects.toMatchObject({ code: 'device-busy' });
  });

  it('maps unsupported browser API to unsupported-browser', async () => {
    vi.stubGlobal('navigator', {} as Navigator);

    await expect(getAudioStream()).rejects.toMatchObject({ code: 'unsupported-browser' });
  });

  it('maps missing AudioContext to audio-context-failed', () => {
    vi.stubGlobal('AudioContext', undefined as unknown as typeof AudioContext);

    expect(() => createAudioContext()).toThrowError(AudioCaptureError);

    try {
      createAudioContext();
    } catch (error) {
      const captureError = error as AudioCaptureError;
      expect(captureError.code).toBe('audio-context-failed');
    }
  });

  it('maps AudioContext constructor failure to audio-context-failed', () => {
    const BrokenAudioContext = vi.fn(() => {
      throw new Error('ctor failed');
    });
    vi.stubGlobal('AudioContext', BrokenAudioContext as unknown as typeof AudioContext);

    expect(() => createAudioContext()).toThrowError(AudioCaptureError);

    try {
      createAudioContext();
    } catch (error) {
      const captureError = error as AudioCaptureError;
      expect(captureError.code).toBe('audio-context-failed');
    }
  });

  it('maps unknown getUserMedia error to unknown', async () => {
    const getUserMedia = vi.fn().mockRejectedValue({ name: 'SecurityPolicyError' });
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } } as unknown as Navigator);

    await expect(getAudioStream()).rejects.toMatchObject({ code: 'unknown' });
  });

  it('continues stopping other tracks when one track.stop throws', () => {
    const stop1 = vi.fn(() => {
      throw new Error('boom');
    });
    const stop2 = vi.fn();

    stopMediaStream(mockStream([{ stop: stop1 }, { stop: stop2 }]));

    expect(stop1).toHaveBeenCalledTimes(1);
    expect(stop2).toHaveBeenCalledTimes(1);
  });

  it('cleans up newly created stream if ensureAudioContext fails during start', async () => {
    const stop = vi.fn();
    const stream = mockStream([{ stop }]);
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } } as unknown as Navigator);

    const suspended = new MockAudioContext('suspended') as unknown as AudioContext;
    const resumeMock = suspended.resume as unknown as ReturnType<typeof vi.fn>;
    resumeMock.mockRejectedValueOnce(new Error('resume failed'));

    await expect(
      startAudioCapture({
        runtime: {
          audioContext: suspended,
          mediaStream: null,
        },
      }),
    ).rejects.toMatchObject({ code: 'audio-context-failed' });

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('stops previous runtime stream before starting a new capture', async () => {
    const previousStop = vi.fn();
    const nextStream = mockStream();
    const getUserMedia = vi.fn().mockResolvedValue(nextStream);
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } } as unknown as Navigator);
    vi.stubGlobal('AudioContext', vi.fn(() => new MockAudioContext('running')) as unknown as typeof AudioContext);

    await startAudioCapture({
      runtime: {
        audioContext: null,
        mediaStream: mockStream([{ stop: previousStop }]),
      },
    });

    expect(previousStop).toHaveBeenCalledTimes(1);
  });

  it('does not stop previous runtime stream when getUserMedia fails', async () => {
    const previousStop = vi.fn();
    const getUserMedia = vi.fn().mockRejectedValue({ name: 'NotAllowedError' });
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } } as unknown as Navigator);

    await expect(
      startAudioCapture({
        runtime: {
          audioContext: null,
          mediaStream: mockStream([{ stop: previousStop }]),
        },
      }),
    ).rejects.toMatchObject({ code: 'permission-denied' });

    expect(previousStop).not.toHaveBeenCalled();
  });

  it('suspendAudioContext is idempotent for suspended context', async () => {
    const context = new MockAudioContext('suspended') as unknown as AudioContext;

    await expect(suspendAudioContext(context)).resolves.toBeUndefined();

    const suspendMock = context.suspend as unknown as ReturnType<typeof vi.fn>;
    expect(suspendMock).not.toHaveBeenCalled();
  });

  it('ensureAudioContext creates a new context when existing context is closed', async () => {
    const closedContext = new MockAudioContext('closed') as unknown as AudioContext;
    const AudioContextCtor = vi.fn(() => new MockAudioContext('running'));
    vi.stubGlobal('AudioContext', AudioContextCtor as unknown as typeof AudioContext);

    const context = await ensureAudioContext(closedContext);

    expect(context).toBeTruthy();
    expect(context).not.toBe(closedContext);
    expect(AudioContextCtor).toHaveBeenCalledTimes(1);
  });
});
