export type TimeDomainBufferErrorCode = 'invalid-runtime' | 'buffer-init-failed' | 'buffer-read-failed';

export class TimeDomainBufferError extends Error {
  readonly code: TimeDomainBufferErrorCode;

  constructor(code: TimeDomainBufferErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'TimeDomainBufferError';
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

export interface TimeDomainBufferRuntime {
  readonly timeDomainData: Float32Array | null;
  readonly fftSize: number;
}

export interface InitializeTimeDomainBufferOptions {
  readonly analyserNode: AnalyserNode | null;
}

export interface ReadTimeDomainDataOptions {
  readonly analyserNode: AnalyserNode | null;
  readonly runtime: TimeDomainBufferRuntime | null;
}

export const initialTimeDomainBufferRuntime: TimeDomainBufferRuntime = {
  timeDomainData: null,
  fftSize: 0,
};

export function disposeTimeDomainBuffer(runtime?: TimeDomainBufferRuntime | null): TimeDomainBufferRuntime {
  if (!runtime) return initialTimeDomainBufferRuntime;
  return initialTimeDomainBufferRuntime;
}

export function initializeTimeDomainBuffer(options: InitializeTimeDomainBufferOptions): TimeDomainBufferRuntime {
  if (!options.analyserNode) {
    throw new TimeDomainBufferError('invalid-runtime', 'AnalyserNode is required for time-domain buffer initialization.');
  }

  const { fftSize } = options.analyserNode;
  if (!Number.isInteger(fftSize) || fftSize <= 0) {
    throw new TimeDomainBufferError('invalid-runtime', 'AnalyserNode.fftSize must be a positive integer.');
  }

  try {
    return {
      timeDomainData: new Float32Array(fftSize),
      fftSize,
    };
  } catch (error) {
    throw new TimeDomainBufferError('buffer-init-failed', 'Failed to initialize time-domain buffer.', { cause: error });
  }
}

export function readTimeDomainData(options: ReadTimeDomainDataOptions): Float32Array {
  const runtime = options.runtime;
  if (
    !options.analyserNode
    || !runtime
    || !runtime.timeDomainData
    || runtime.fftSize <= 0
    || runtime.timeDomainData.length <= 0
    || runtime.timeDomainData.length !== runtime.fftSize
  ) {
    throw new TimeDomainBufferError('invalid-runtime', 'AnalyserNode and time-domain buffer runtime are required to read time-domain data.');
  }

  const timeDomainData = runtime.timeDomainData;

  try {
    options.analyserNode.getFloatTimeDomainData(timeDomainData as unknown as Float32Array<ArrayBuffer>);
    return timeDomainData;
  } catch (error) {
    throw new TimeDomainBufferError('buffer-read-failed', 'Failed to read time-domain data.', { cause: error });
  }
}
