import { describe, expect, it, vi } from 'vitest';
import {
  FrequencyBufferError,
  disposeFrequencyBuffer,
  initializeFrequencyBuffer,
  initialFrequencyBufferRuntime,
  readFrequencyData,
} from './frequencyBufferService';

describe('frequencyBufferService', () => {
  it('initializes Float32Array buffer using analyser frequencyBinCount', () => {
    const analyserNode = {
      fftSize: 1024,
      frequencyBinCount: 512,
    } as AnalyserNode;

    const runtime = initializeFrequencyBuffer({ analyserNode });

    expect(runtime.frequencyData).toBeInstanceOf(Float32Array);
    expect(runtime.frequencyData).toHaveLength(512);
    expect(runtime.fftSize).toBe(1024);
    expect(runtime.frequencyBinCount).toBe(512);
  });

  it('readFrequencyData delegates to analyser.getFloatFrequencyData', () => {
    const getFloatFrequencyData = vi.fn((buffer: Float32Array) => {
      buffer[0] = -12.5;
      buffer[1] = -24.25;
    });

    const analyserNode = {
      frequencyBinCount: 2,
      getFloatFrequencyData,
    } as unknown as AnalyserNode;

    const runtime = initializeFrequencyBuffer({ analyserNode });
    const buffer = readFrequencyData({ analyserNode, runtime });

    expect(getFloatFrequencyData).toHaveBeenCalledWith(runtime.frequencyData);
    expect(buffer[0]).toBe(-12.5);
    expect(buffer[1]).toBe(-24.25);
  });

  it('reuses the same Float32Array across repeated readFrequencyData calls', () => {
    const getFloatFrequencyData = vi.fn();
    const analyserNode = {
      fftSize: 8,
      frequencyBinCount: 4,
      getFloatFrequencyData,
    } as unknown as AnalyserNode;

    const runtime = initializeFrequencyBuffer({ analyserNode });

    const first = readFrequencyData({ analyserNode, runtime });
    const second = readFrequencyData({ analyserNode, runtime });
    const third = readFrequencyData({ analyserNode, runtime });

    expect(first).toBe(runtime.frequencyData);
    expect(second).toBe(runtime.frequencyData);
    expect(third).toBe(runtime.frequencyData);
    expect(first).toBe(second);
    expect(second).toBe(third);
    expect(getFloatFrequencyData).toHaveBeenCalledTimes(3);
  });

  it('disposeFrequencyBuffer is idempotent', () => {
    expect(disposeFrequencyBuffer(null)).toEqual(initialFrequencyBufferRuntime);
    expect(disposeFrequencyBuffer(undefined)).toEqual(initialFrequencyBufferRuntime);
    expect(disposeFrequencyBuffer({ frequencyData: new Float32Array(2), fftSize: 4, frequencyBinCount: 2 })).toEqual(initialFrequencyBufferRuntime);
  });

  it('throws invalid-runtime when analyser is missing during init', () => {
    expect(() => initializeFrequencyBuffer({ analyserNode: null })).toThrowError(FrequencyBufferError);

    try {
      initializeFrequencyBuffer({ analyserNode: null });
    } catch (error) {
      expect((error as FrequencyBufferError).code).toBe('invalid-runtime');
    }
  });

  it('throws buffer-init-failed when Float32Array allocation fails', () => {
    const originalFloat32Array = globalThis.Float32Array;
    const fakeFloat32Array = vi.fn(() => {
      throw new Error('allocation failed');
    });

    Object.defineProperty(globalThis, 'Float32Array', {
      value: fakeFloat32Array,
      configurable: true,
    });

    try {
      expect(() => initializeFrequencyBuffer({ analyserNode: { fftSize: 8, frequencyBinCount: 4 } as AnalyserNode })).toThrowError(FrequencyBufferError);

      try {
        initializeFrequencyBuffer({ analyserNode: { fftSize: 8, frequencyBinCount: 4 } as AnalyserNode });
      } catch (error) {
        expect((error as FrequencyBufferError).code).toBe('buffer-init-failed');
      }
    } finally {
      Object.defineProperty(globalThis, 'Float32Array', {
        value: originalFloat32Array,
        configurable: true,
      });
    }
  });

  it('throws invalid-runtime when readFrequencyData is called without analyser or runtime', () => {
    expect(() => readFrequencyData({ analyserNode: null, runtime: null })).toThrowError(FrequencyBufferError);

    try {
      readFrequencyData({ analyserNode: null, runtime: null });
    } catch (error) {
      expect((error as FrequencyBufferError).code).toBe('invalid-runtime');
    }
  });
});
