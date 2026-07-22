export type AudioGraphErrorCode = 'graph-init-failed' | 'invalid-runtime';

export class AudioGraphError extends Error {
  readonly code: AudioGraphErrorCode;

  constructor(code: AudioGraphErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'AudioGraphError';
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

export interface AudioGraphRuntime {
  readonly sourceNode: MediaStreamAudioSourceNode | null;
  readonly analyserNode: AnalyserNode | null;
}

export interface InitializeAudioGraphOptions {
  readonly audioContext: AudioContext | null;
  readonly mediaStream: MediaStream | null;
}

export const initialAudioGraphRuntime: AudioGraphRuntime = {
  sourceNode: null,
  analyserNode: null,
};

function disconnectNode(node?: AudioNode | null): void {
  if (!node) return;

  try {
    node.disconnect();
  } catch {
    // Keep disposal best-effort and idempotent.
  }
}

export function disposeAudioGraph(runtime?: AudioGraphRuntime | null): AudioGraphRuntime {
  if (!runtime) return initialAudioGraphRuntime;

  disconnectNode(runtime.sourceNode);
  disconnectNode(runtime.analyserNode);

  return initialAudioGraphRuntime;
}

export function initializeAudioGraph(options: InitializeAudioGraphOptions): AudioGraphRuntime {
  if (!options.audioContext || !options.mediaStream) {
    throw new AudioGraphError('invalid-runtime', 'AudioContext and MediaStream are required for audio graph initialization.');
  }

  let sourceNode: MediaStreamAudioSourceNode | null = null;
  let analyserNode: AnalyserNode | null = null;

  try {
    sourceNode = options.audioContext.createMediaStreamSource(options.mediaStream);
    analyserNode = options.audioContext.createAnalyser();
    sourceNode.connect(analyserNode);

    return {
      sourceNode,
      analyserNode,
    };
  } catch (error) {
    disconnectNode(sourceNode);
    disconnectNode(analyserNode);

    throw new AudioGraphError('graph-init-failed', 'Failed to initialize audio graph.', { cause: error });
  }
}
