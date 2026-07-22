export type FrequencyBufferErrorCode = 'buffer-init-failed' | 'invalid-runtime';

export class FrequencyBufferError extends Error {
  readonly code: FrequencyBufferErrorCode;

  constructor(code: FrequencyBufferErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'FrequencyBufferError';
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

export interface FrequencyBufferRuntime {
  readonly frequencyData: Float32Array | null;
  readonly fftSize: number;
  readonly frequencyBinCount: number;
}

export interface InitializeFrequencyBufferOptions {
  readonly analyserNode: AnalyserNode | null;
}

export interface ReadFrequencyDataOptions {
  readonly analyserNode: AnalyserNode | null;
  readonly runtime: FrequencyBufferRuntime | null;
}

export const initialFrequencyBufferRuntime: FrequencyBufferRuntime = {
  frequencyData: null,
  fftSize: 0,
  frequencyBinCount: 0,
};

export function disposeFrequencyBuffer(runtime?: FrequencyBufferRuntime | null): FrequencyBufferRuntime {
  if (!runtime) return initialFrequencyBufferRuntime;
  return initialFrequencyBufferRuntime;
}

export function initializeFrequencyBuffer(options: InitializeFrequencyBufferOptions): FrequencyBufferRuntime {
  if (!options.analyserNode) {
    throw new FrequencyBufferError('invalid-runtime', 'AnalyserNode is required for frequency buffer initialization.');
  }

  try {
    return {
      frequencyData: new Float32Array(options.analyserNode.frequencyBinCount),
      fftSize: options.analyserNode.fftSize,
      frequencyBinCount: options.analyserNode.frequencyBinCount,
    };
  } catch (error) {
    throw new FrequencyBufferError('buffer-init-failed', 'Failed to initialize frequency buffer.', { cause: error });
  }
}

export function readFrequencyData(options: ReadFrequencyDataOptions): Float32Array {
  if (!options.analyserNode || !options.runtime?.frequencyData) {
    throw new FrequencyBufferError('invalid-runtime', 'AnalyserNode and frequency buffer runtime are required to read frequency data.');
  }

  // DOM lib versions can disagree on the exact Float32Array generic here.
  // Narrow only the analyser method signature so we can pass the existing runtime buffer through unchanged.
  const analyserNode = options.analyserNode as {
    getFloatFrequencyData: (array: Float32Array) => void;
  };
  const frequencyData = options.runtime.frequencyData;
  analyserNode.getFloatFrequencyData(frequencyData);
  return frequencyData;
}
