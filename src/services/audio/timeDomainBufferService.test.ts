import { describe, expect, it, vi } from 'vitest';
import {
  TimeDomainBufferError,
  disposeTimeDomainBuffer,
  initializeTimeDomainBuffer,
  initialTimeDomainBufferRuntime,
  readTimeDomainData,
} from './timeDomainBufferService';

describe('timeDomainBufferService', () => {
  it('initializes Float32Array buffer using analyser fftSize', () => {
    const analyserNode = {
      fftSize: 1024,
    } as AnalyserNode;

    const runtime = initializeTimeDomainBuffer({ analyserNode });

    expect(runtime.timeDomainData).toBeInstanceOf(Float32Array);
    expect(runtime.timeDomainData).toHaveLength(1024);
    expect(runtime.fftSize).toBe(1024);
  });

  it('readTimeDomainData delegates to analyser.getFloatTimeDomainData', () => {
    const getFloatTimeDomainData = vi.fn((buffer: Float32Array) => {
      buffer[0] = 0.25;
      buffer[1] = -0.5;
    });

    const analyserNode = {
      fftSize: 4,
      getFloatTimeDomainData,
    } as unknown as AnalyserNode;

    const runtime = initializeTimeDomainBuffer({ analyserNode });
    const buffer = readTimeDomainData({ analyserNode, runtime });

    expect(getFloatTimeDomainData).toHaveBeenCalledWith(runtime.timeDomainData);
    expect(buffer[0]).toBe(0.25);
    expect(buffer[1]).toBe(-0.5);
  });

  it('reuses the same Float32Array across repeated readTimeDomainData calls', () => {
    const getFloatTimeDomainData = vi.fn();
    const analyserNode = {
      fftSize: 8,
      getFloatTimeDomainData,
    } as unknown as AnalyserNode;

    const runtime = initializeTimeDomainBuffer({ analyserNode });

    const first = readTimeDomainData({ analyserNode, runtime });
    const second = readTimeDomainData({ analyserNode, runtime });
    const third = readTimeDomainData({ analyserNode, runtime });

    expect(first).toBe(runtime.timeDomainData);
    expect(second).toBe(runtime.timeDomainData);
    expect(third).toBe(runtime.timeDomainData);
    expect(first).toBe(second);
    expect(second).toBe(third);
  });

  it('treats zero-length buffer as invalid-runtime', () => {
    const analyserNode = {
      fftSize: 0,
      getFloatTimeDomainData: vi.fn(),
    } as unknown as AnalyserNode;

    const runtime = {
      timeDomainData: new Float32Array(0),
      fftSize: 0,
    };

    expect(() => readTimeDomainData({ analyserNode, runtime })).toThrowError(TimeDomainBufferError);

    try {
      readTimeDomainData({ analyserNode, runtime });
    } catch (error) {
      expect((error as TimeDomainBufferError).code).toBe('invalid-runtime');
    }
  });

  it('disposeTimeDomainBuffer is idempotent', () => {
    expect(disposeTimeDomainBuffer(null)).toEqual(initialTimeDomainBufferRuntime);
    expect(disposeTimeDomainBuffer(undefined)).toEqual(initialTimeDomainBufferRuntime);
    expect(disposeTimeDomainBuffer({ timeDomainData: new Float32Array(2), fftSize: 2 })).toEqual(initialTimeDomainBufferRuntime);
  });

  it('disposeTimeDomainBuffer remains idempotent when called twice', () => {
    const first = disposeTimeDomainBuffer({ timeDomainData: new Float32Array(2), fftSize: 2 });
    const second = disposeTimeDomainBuffer(first);
    expect(first).toEqual(initialTimeDomainBufferRuntime);
    expect(second).toEqual(initialTimeDomainBufferRuntime);
  });

  it('throws invalid-runtime when analyser is missing during init', () => {
    expect(() => initializeTimeDomainBuffer({ analyserNode: null })).toThrowError(TimeDomainBufferError);

    try {
      initializeTimeDomainBuffer({ analyserNode: null });
    } catch (error) {
      expect((error as TimeDomainBufferError).code).toBe('invalid-runtime');
    }
  });

  it('initialize rejects fftSize === 0', () => {
    const analyserNode = { fftSize: 0 } as AnalyserNode;

    expect(() => initializeTimeDomainBuffer({ analyserNode })).toThrowError(TimeDomainBufferError);

    try {
      initializeTimeDomainBuffer({ analyserNode });
    } catch (error) {
      expect((error as TimeDomainBufferError).code).toBe('invalid-runtime');
    }
  });

  it('initialize rejects a negative fftSize', () => {
    const analyserNode = { fftSize: -32 } as AnalyserNode;

    expect(() => initializeTimeDomainBuffer({ analyserNode })).toThrowError(TimeDomainBufferError);

    try {
      initializeTimeDomainBuffer({ analyserNode });
    } catch (error) {
      expect((error as TimeDomainBufferError).code).toBe('invalid-runtime');
    }
  });

  it('initialize rejects a non-integer fftSize', () => {
    const analyserNode = { fftSize: 64.5 } as AnalyserNode;

    expect(() => initializeTimeDomainBuffer({ analyserNode })).toThrowError(TimeDomainBufferError);

    try {
      initializeTimeDomainBuffer({ analyserNode });
    } catch (error) {
      expect((error as TimeDomainBufferError).code).toBe('invalid-runtime');
    }
  });

  it('throws buffer-read-failed when analyser read fails', () => {
    const analyserNode = {
      fftSize: 4,
      getFloatTimeDomainData: vi.fn(() => {
        throw new Error('read failed');
      }),
    } as unknown as AnalyserNode;

    const runtime = initializeTimeDomainBuffer({ analyserNode });

    expect(() => readTimeDomainData({ analyserNode, runtime })).toThrowError(TimeDomainBufferError);

    try {
      readTimeDomainData({ analyserNode, runtime });
    } catch (error) {
      expect((error as TimeDomainBufferError).code).toBe('buffer-read-failed');
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
      expect(() => initializeTimeDomainBuffer({ analyserNode: { fftSize: 4 } as AnalyserNode })).toThrowError(TimeDomainBufferError);

      try {
        initializeTimeDomainBuffer({ analyserNode: { fftSize: 4 } as AnalyserNode });
      } catch (error) {
        expect((error as TimeDomainBufferError).code).toBe('buffer-init-failed');
      }
    } finally {
      Object.defineProperty(globalThis, 'Float32Array', {
        value: originalFloat32Array,
        configurable: true,
      });
    }
  });

  it('throws invalid-runtime when readTimeDomainData is called without analyser or runtime', () => {
    expect(() => readTimeDomainData({ analyserNode: null, runtime: null })).toThrowError(TimeDomainBufferError);

    try {
      readTimeDomainData({ analyserNode: null, runtime: null });
    } catch (error) {
      expect((error as TimeDomainBufferError).code).toBe('invalid-runtime');
    }
  });

  it('read rejects runtime.fftSize <= 0', () => {
    const analyserNode = {
      fftSize: 4,
      getFloatTimeDomainData: vi.fn(),
    } as unknown as AnalyserNode;

    const runtime = {
      timeDomainData: new Float32Array(4),
      fftSize: 0,
    };

    expect(() => readTimeDomainData({ analyserNode, runtime })).toThrowError(TimeDomainBufferError);

    try {
      readTimeDomainData({ analyserNode, runtime });
    } catch (error) {
      expect((error as TimeDomainBufferError).code).toBe('invalid-runtime');
    }
  });

  it('read rejects timeDomainData.length !== runtime.fftSize', () => {
    const analyserNode = {
      fftSize: 4,
      getFloatTimeDomainData: vi.fn(),
    } as unknown as AnalyserNode;

    const runtime = {
      timeDomainData: new Float32Array(4),
      fftSize: 8,
    };

    expect(() => readTimeDomainData({ analyserNode, runtime })).toThrowError(TimeDomainBufferError);

    try {
      readTimeDomainData({ analyserNode, runtime });
    } catch (error) {
      expect((error as TimeDomainBufferError).code).toBe('invalid-runtime');
    }
  });
});
