import { describe, expect, it } from 'vitest';
import {
  PitchDetectionError,
  detectPitch,
} from './pitchDetectionService';

function createSineWave(
  frequency: number,
  sampleRate: number,
  durationSeconds: number,
  dcOffset = 0,
  amplitude = 1,
): Float32Array {
  const sampleCount = Math.max(0, Math.floor(sampleRate * durationSeconds));
  const samples = new Float32Array(sampleCount);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    samples[index] = (amplitude * Math.sin(2 * Math.PI * frequency * time)) + dcOffset;
  }

  return samples;
}

function createWhiteNoise(
  sampleRate: number,
  durationSeconds: number,
  amplitude = 1,
  seed = 12345,
): Float32Array {
  const sampleCount = Math.max(0, Math.floor(sampleRate * durationSeconds));
  const samples = new Float32Array(sampleCount);

  let state = seed >>> 0;
  for (let index = 0; index < sampleCount; index += 1) {
    state = ((1664525 * state) + 1013904223) >>> 0;
    const normalized = (state / 0xFFFFFFFF) * 2 - 1;
    samples[index] = amplitude * normalized;
  }

  return samples;
}

function addSignals(primary: Float32Array, secondary: Float32Array): Float32Array {
  const length = Math.min(primary.length, secondary.length);
  const mixed = new Float32Array(length);

  for (let index = 0; index < length; index += 1) {
    mixed[index] = primary[index] + secondary[index];
  }

  return mixed;
}

function expectFrequencyNear(actual: number | null, expected: number, toleranceHz = 5): void {
  expect(actual).not.toBeNull();
  expect(Math.abs((actual as number) - expected)).toBeLessThanOrEqual(toleranceHz);
}

describe('pitchDetectionService', () => {
  it('detects 220Hz sine wave', () => {
    const sampleRate = 48000;
    const result = detectPitch({
      timeDomainData: createSineWave(220, sampleRate, 0.1),
      sampleRate,
    });

    expectFrequencyNear(result.frequency, 220);
  });

  it('detects 440Hz sine wave', () => {
    const sampleRate = 48000;
    const result = detectPitch({
      timeDomainData: createSineWave(440, sampleRate, 0.1),
      sampleRate,
    });

    expectFrequencyNear(result.frequency, 440);
  });

  it('detects 880Hz sine wave', () => {
    const sampleRate = 48000;
    const result = detectPitch({
      timeDomainData: createSineWave(880, sampleRate, 0.1),
      sampleRate,
    });

    expectFrequencyNear(result.frequency, 880);
  });

  it('detects 523.25Hz sine wave', () => {
    const sampleRate = 48000;
    const result = detectPitch({
      timeDomainData: createSineWave(523.25, sampleRate, 0.1),
      sampleRate,
    });

    expectFrequencyNear(result.frequency, 523.25, 2);
  });

  it('detects frequency near upper boundary (997Hz)', () => {
    const sampleRate = 48000;
    const result = detectPitch({
      timeDomainData: createSineWave(997, sampleRate, 0.1),
      sampleRate,
    });

    expectFrequencyNear(result.frequency, 997, 2);
  });

  it('detects frequency near lower boundary (61Hz)', () => {
    const sampleRate = 48000;
    const result = detectPitch({
      timeDomainData: createSineWave(61, sampleRate, 0.2),
      sampleRate,
    });

    expectFrequencyNear(result.frequency, 61, 1.5);
  });

  it('strong 440Hz tone returns high confidence and voiced true', () => {
    const sampleRate = 48000;
    const result = detectPitch({
      timeDomainData: createSineWave(440, sampleRate, 0.1),
      sampleRate,
    });

    expectFrequencyNear(result.frequency, 440);
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.isVoiced).toBe(true);
  });

  it('silence returns null', () => {
    const result = detectPitch({
      timeDomainData: new Float32Array(4096),
      sampleRate: 48000,
    });

    expect(result).toEqual({
      frequency: null,
      confidence: 0,
      isVoiced: false,
    });
  });

  it('white noise returns low confidence or zero and isVoiced false', () => {
    const sampleRate = 48000;
    const result = detectPitch({
      timeDomainData: createWhiteNoise(sampleRate, 0.1, 1),
      sampleRate,
    });

    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(0.2);
    expect(result.isVoiced).toBe(false);
  });

  it('low-amplitude 440Hz returns null with zero confidence and unvoiced result', () => {
    const sampleRate = 48000;
    const result = detectPitch({
      timeDomainData: createSineWave(440, sampleRate, 0.1, 0, 0.005),
      sampleRate,
    });

    expect(result).toEqual({
      frequency: null,
      confidence: 0,
      isVoiced: false,
    });
  });

  it('440Hz with 5% white noise remains voiced and near 440Hz', () => {
    const sampleRate = 48000;
    const pure = createSineWave(440, sampleRate, 0.1, 0, 1);
    const noise = createWhiteNoise(sampleRate, 0.1, 0.05);
    const result = detectPitch({
      timeDomainData: addSignals(pure, noise),
      sampleRate,
    });

    expectFrequencyNear(result.frequency, 440, 4);
    expect(result.isVoiced).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('DC offset does not affect estimation', () => {
    const sampleRate = 48000;
    const noOffset = detectPitch({
      timeDomainData: createSineWave(440, sampleRate, 0.1, 0),
      sampleRate,
    });
    const withOffset = detectPitch({
      timeDomainData: createSineWave(440, sampleRate, 0.1, 0.35),
      sampleRate,
    });

    expectFrequencyNear(noOffset.frequency, 440);
    expectFrequencyNear(withOffset.frequency, 440);
  });

  it('short buffer returns null', () => {
    const sampleRate = 48000;
    const result = detectPitch({
      timeDomainData: createSineWave(440, sampleRate, 0.0001),
      sampleRate,
    });

    expect(result).toEqual({
      frequency: null,
      confidence: 0,
      isVoiced: false,
    });
  });

  it('invalid input throws', () => {
    expect(() => detectPitch({
      timeDomainData: new Float32Array(0),
      sampleRate: 48000,
    })).toThrowError(PitchDetectionError);

    try {
      detectPitch({
        timeDomainData: new Float32Array(0),
        sampleRate: 48000,
      });
    } catch (error) {
      expect((error as PitchDetectionError).code).toBe('invalid-input');
    }
  });

  it('rejects sampleRate <= 0', () => {
    expect(() => detectPitch({
      timeDomainData: new Float32Array([0.1]),
      sampleRate: 0,
    })).toThrowError(PitchDetectionError);

    expect(() => detectPitch({
      timeDomainData: new Float32Array([0.1]),
      sampleRate: -44100,
    })).toThrowError(PitchDetectionError);

    try {
      detectPitch({
        timeDomainData: new Float32Array([0.1]),
        sampleRate: 0,
      });
    } catch (error) {
      expect((error as PitchDetectionError).code).toBe('invalid-input');
    }
  });

  it('service is stateless', () => {
    const sampleRate = 48000;
    const input = createSineWave(440, sampleRate, 0.1);
    const inputSnapshot = Float32Array.from(input);

    const options = {
      timeDomainData: input,
      sampleRate,
    };

    const first = detectPitch(options);
    (first as { frequency: number | null }).frequency = 123;

    const second = detectPitch(options);

    expectFrequencyNear(second.frequency, 440);
    expect(second).not.toBe(first);
    expect(Array.from(input)).toEqual(Array.from(inputSnapshot));
  });
});
