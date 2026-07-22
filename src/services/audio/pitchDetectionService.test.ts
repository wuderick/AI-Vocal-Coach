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
): Float32Array {
  const sampleCount = Math.max(0, Math.floor(sampleRate * durationSeconds));
  const samples = new Float32Array(sampleCount);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    samples[index] = Math.sin(2 * Math.PI * frequency * time) + dcOffset;
  }

  return samples;
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
