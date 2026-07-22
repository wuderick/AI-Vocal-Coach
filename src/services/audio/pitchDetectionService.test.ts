import { describe, expect, it } from 'vitest';
import {
  PitchDetectionError,
  detectPitch,
} from './pitchDetectionService';

describe('pitchDetectionService', () => {
  it('detectPitch returns placeholder result', () => {
    const result = detectPitch({
      timeDomainData: new Float32Array([0.1, -0.2, 0.05]),
      sampleRate: 48000,
    });

    expect(result).toEqual({
      frequency: null,
      confidence: 0,
      isVoiced: false,
    });
  });

  it('rejects empty Float32Array', () => {
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
    const options = {
      timeDomainData: new Float32Array([0.2, -0.1, 0.3]),
      sampleRate: 44100,
    };

    const first = detectPitch(options);
    (first as { confidence: number }).confidence = 0.75;

    const second = detectPitch(options);

    expect(second).toEqual({
      frequency: null,
      confidence: 0,
      isVoiced: false,
    });
    expect(second).not.toBe(first);
  });
});
