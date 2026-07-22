export type PitchDetectionErrorCode = 'invalid-input';

export class PitchDetectionError extends Error {
  readonly code: PitchDetectionErrorCode;

  constructor(code: PitchDetectionErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'PitchDetectionError';
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

export interface PitchDetectionResult {
  readonly frequency: number | null;
  readonly confidence: number;
  readonly isVoiced: boolean;
}

export interface DetectPitchOptions {
  readonly timeDomainData: Float32Array;
  readonly sampleRate: number;
}

export function detectPitch(options: DetectPitchOptions): PitchDetectionResult {
  if (options.timeDomainData.length <= 0) {
    throw new PitchDetectionError('invalid-input', 'timeDomainData must contain at least one sample.');
  }

  if (!Number.isFinite(options.sampleRate) || options.sampleRate <= 0) {
    throw new PitchDetectionError('invalid-input', 'sampleRate must be greater than zero.');
  }

  return {
    frequency: null,
    confidence: 0,
    isVoiced: false,
  };
}
