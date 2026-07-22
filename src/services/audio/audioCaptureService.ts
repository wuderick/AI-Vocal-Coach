export type AudioCaptureErrorCode =
  | 'permission-denied'
  | 'device-not-found'
  | 'device-busy'
  | 'unsupported-browser'
  | 'audio-context-failed'
  | 'unknown';

export class AudioCaptureError extends Error {
  readonly code: AudioCaptureErrorCode;

  constructor(code: AudioCaptureErrorCode, message: string, options?: { cause?: unknown }) {
    // tsconfig target/lib is ES2020, so ErrorOptions typing is not guaranteed here.
    super(message);
    this.name = 'AudioCaptureError';
    this.code = code;

    if (options && 'cause' in options) {
      Object.defineProperty(this, 'cause', {
        value: options.cause,
        enumerable: false,
        configurable: true,
      });
    }
  }
}

export interface AudioCaptureRuntime {
  readonly audioContext: AudioContext | null;
  readonly mediaStream: MediaStream | null;
}

export interface StartAudioCaptureOptions {
  readonly runtime?: AudioCaptureRuntime | null;
  readonly deviceId?: string | null;
}

type AudioContextConstructor = new () => AudioContext;

const GET_USER_MEDIA_ERROR_CODE_MAP: Record<string, AudioCaptureErrorCode> = {
  NotAllowedError: 'permission-denied',
  NotFoundError: 'device-not-found',
  OverconstrainedError: 'device-not-found',
  NotReadableError: 'device-busy',
  AbortError: 'device-busy',
};

function isGetUserMediaSupported(): boolean {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
    return false;
  }

  return typeof navigator.mediaDevices.getUserMedia === 'function';
}

function getAudioContextConstructor(): AudioContextConstructor | null {
  const maybeAudioContext = (globalThis as unknown as { AudioContext?: AudioContextConstructor }).AudioContext;
  if (typeof maybeAudioContext === 'function') return maybeAudioContext;
  return null;
}

function mapGetUserMediaError(error: unknown): AudioCaptureErrorCode {
  const name = (error as { name?: string })?.name;
  if (!name) return 'unknown';
  return GET_USER_MEDIA_ERROR_CODE_MAP[name] ?? 'unknown';
}

function buildAudioConstraint(deviceId?: string | null): MediaTrackConstraints {
  const constraints: MediaTrackConstraints = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
  };

  if (typeof deviceId === 'string' && deviceId.trim().length > 0) {
    constraints.deviceId = {
      exact: deviceId,
    };
  }

  return constraints;
}

export function createAudioContext(): AudioContext {
  const AudioContextCtor = getAudioContextConstructor();
  if (!AudioContextCtor) {
    throw new AudioCaptureError('audio-context-failed', 'AudioContext is not supported in this browser.');
  }

  try {
    return new AudioContextCtor();
  } catch (error) {
    throw new AudioCaptureError('audio-context-failed', 'Failed to create AudioContext.', { cause: error });
  }
}

export async function getAudioStream(deviceId?: string | null): Promise<MediaStream> {
  if (!isGetUserMediaSupported()) {
    throw new AudioCaptureError('unsupported-browser', 'getUserMedia is not supported in this browser.');
  }

  const constraints: MediaStreamConstraints = {
    audio: buildAudioConstraint(deviceId),
  };

  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    throw new AudioCaptureError(mapGetUserMediaError(error), 'Failed to start audio capture.', { cause: error });
  }
}

export async function ensureAudioContext(existingContext?: AudioContext | null): Promise<AudioContext> {
  if (!existingContext || existingContext.state === 'closed') {
    return createAudioContext();
  }

  if (existingContext.state === 'suspended') {
    try {
      await existingContext.resume();
    } catch (error) {
      throw new AudioCaptureError('audio-context-failed', 'Failed to resume AudioContext.', { cause: error });
    }
  }

  return existingContext;
}

export function stopMediaStream(stream?: MediaStream | null): void {
  if (!stream) return;

  const tracks = stream.getTracks();
  for (const track of tracks) {
    try {
      track.stop();
    } catch {
      // Keep cleanup best-effort: stop remaining tracks even if one fails.
    }
  }
}

export async function suspendAudioContext(context?: AudioContext | null): Promise<void> {
  if (!context) return;
  if (context.state === 'closed' || context.state === 'suspended') return;

  try {
    await context.suspend();
  } catch {
    // Keep stop idempotent and best-effort.
  }
}

export async function startAudioCapture(options: StartAudioCaptureOptions = {}): Promise<AudioCaptureRuntime> {
  const previousRuntime = options.runtime ?? null;
  const mediaStream = await getAudioStream(options.deviceId);

  if (previousRuntime?.mediaStream) {
    stopMediaStream(previousRuntime.mediaStream);
  }

  try {
    const audioContext = await ensureAudioContext(previousRuntime?.audioContext ?? null);
    return {
      audioContext,
      mediaStream,
    };
  } catch (error) {
    stopMediaStream(mediaStream);
    throw error;
  }
}

export async function stopAudioCapture(runtime: AudioCaptureRuntime): Promise<AudioCaptureRuntime> {
  stopMediaStream(runtime.mediaStream);
  await suspendAudioContext(runtime.audioContext);

  return {
    audioContext: runtime.audioContext,
    mediaStream: null,
  };
}
