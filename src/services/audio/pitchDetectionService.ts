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

const MIN_FREQUENCY = 60;
const MAX_FREQUENCY = 1000;
const NEAR_BEST_CORRELATION_RATIO = 0.98;
const MIN_RMS = 0.01;
const MIN_CONFIDENCE = 0.6;

interface BestLagCandidate {
  readonly lag: number;
  readonly correlation: number;
}

function validateInput(options: DetectPitchOptions): void {
  if (options.timeDomainData.length <= 0) {
    throw new PitchDetectionError('invalid-input', 'timeDomainData must contain at least one sample.');
  }

  if (!Number.isFinite(options.sampleRate) || options.sampleRate <= 0) {
    throw new PitchDetectionError('invalid-input', 'sampleRate must be greater than zero.');
  }
}

function removeDcOffset(timeDomainData: Float32Array): Float32Array {
  let sum = 0;
  for (let index = 0; index < timeDomainData.length; index += 1) {
    sum += timeDomainData[index];
  }

  const mean = sum / timeDomainData.length;
  const centered = new Float32Array(timeDomainData.length);
  for (let index = 0; index < timeDomainData.length; index += 1) {
    centered[index] = timeDomainData[index] - mean;
  }

  return centered;
}

function computeRms(signal: Float32Array): number {
  let sumSquares = 0;

  for (let index = 0; index < signal.length; index += 1) {
    const sample = signal[index];
    sumSquares += sample * sample;
  }

  return Math.sqrt(sumSquares / signal.length);
}

function computeNormalizedAutocorrelation(signal: Float32Array, maximumLag: number): Float32Array {
  const normalized = new Float32Array(maximumLag + 1);

  for (let lag = 1; lag <= maximumLag; lag += 1) {
    let crossCorrelation = 0;
    let leftEnergy = 0;
    let rightEnergy = 0;

    const overlapLength = signal.length - lag;
    for (let index = 0; index < overlapLength; index += 1) {
      const leftSample = signal[index];
      const rightSample = signal[index + lag];
      crossCorrelation += leftSample * rightSample;
      leftEnergy += leftSample * leftSample;
      rightEnergy += rightSample * rightSample;
    }

    const normalization = Math.sqrt(leftEnergy * rightEnergy);
    normalized[lag] = normalization > 0 ? crossCorrelation / normalization : 0;
  }

  return normalized;
}

function findBestLag(normalizedAutocorrelation: Float32Array, minimumLag: number, maximumLag: number): BestLagCandidate | null {
  const peaks: Array<{ lag: number; correlation: number }> = [];
  const availableMaximumLag = normalizedAutocorrelation.length - 1;

  for (let lag = minimumLag; lag <= maximumLag; lag += 1) {
    const correlation = normalizedAutocorrelation[lag];
    const previous = lag - 1 >= 0 ? normalizedAutocorrelation[lag - 1] : Number.NEGATIVE_INFINITY;
    const next = lag + 1 <= availableMaximumLag ? normalizedAutocorrelation[lag + 1] : Number.NEGATIVE_INFINITY;
    if (correlation >= previous && correlation >= next) {
      peaks.push({ lag, correlation });
    }
  }

  if (peaks.length === 0) {
    return null;
  }

  let bestCorrelation = Number.NEGATIVE_INFINITY;
  for (const peak of peaks) {
    if (peak.correlation > bestCorrelation) {
      bestCorrelation = peak.correlation;
    }
  }

  if (bestCorrelation <= 0) {
    return null;
  }

  // Prefer the earliest local peak that is close enough to the global peak
  // so clean periodic signals do not drift toward later periodic multiples.
  const nearBestThreshold = bestCorrelation * NEAR_BEST_CORRELATION_RATIO;
  for (const peak of peaks) {
    if (peak.correlation >= nearBestThreshold) {
      if (peak.lag - 1 >= 0 && peak.lag + 1 <= availableMaximumLag) {
        const previous = normalizedAutocorrelation[peak.lag - 1];
        const current = normalizedAutocorrelation[peak.lag];
        const next = normalizedAutocorrelation[peak.lag + 1];
        const denominator = previous - (2 * current) + next;

        if (denominator !== 0) {
          const offset = 0.5 * (previous - next) / denominator;
          if (Number.isFinite(offset) && Math.abs(offset) <= 1) {
            return {
              lag: peak.lag + offset,
              correlation: peak.correlation,
            };
          }
        }
      }

      return peak;
    }
  }

  return peaks[0] ?? null;
}

function lagToFrequency(lag: number, sampleRate: number): number {
  return sampleRate / lag;
}

function computeConfidence(correlation: number): number {
  if (!Number.isFinite(correlation)) {
    return 0;
  }

  return Math.min(1, Math.max(0, correlation));
}

function isVoicedSignal(frequency: number | null, confidence: number, rms: number): boolean {
  return frequency !== null && confidence >= MIN_CONFIDENCE && rms >= MIN_RMS;
}

function createInvalidResult(): PitchDetectionResult {
  return {
    frequency: null,
    confidence: 0,
    isVoiced: false,
  };
}

export function detectPitch(options: DetectPitchOptions): PitchDetectionResult {
  validateInput(options);

  const centered = removeDcOffset(options.timeDomainData);
  const rms = computeRms(centered);
  if (rms < MIN_RMS) {
    return createInvalidResult();
  }

  const minimumLag = Math.max(1, Math.floor(options.sampleRate / MAX_FREQUENCY));
  const rawSearchMaximumLag = Math.floor(options.sampleRate / MIN_FREQUENCY);
  const searchMaximumLag = Math.min(rawSearchMaximumLag, options.timeDomainData.length - 1);
  if (searchMaximumLag < minimumLag) {
    return createInvalidResult();
  }

  const computationMaximumLag = Math.min(searchMaximumLag + 1, options.timeDomainData.length - 1);

  const normalizedAutocorrelation = computeNormalizedAutocorrelation(centered, computationMaximumLag);
  const bestCandidate = findBestLag(normalizedAutocorrelation, minimumLag, searchMaximumLag);
  if (bestCandidate === null) {
    return createInvalidResult();
  }

  const frequency = lagToFrequency(bestCandidate.lag, options.sampleRate);
  const confidence = computeConfidence(bestCandidate.correlation);
  if (!Number.isFinite(frequency) || frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) {
    return createInvalidResult();
  }

  const isVoiced = isVoicedSignal(frequency, confidence, rms);

  return {
    frequency,
    confidence,
    isVoiced,
  };
}
