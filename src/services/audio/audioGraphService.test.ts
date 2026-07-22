import { describe, expect, it, vi } from 'vitest';
import {
  AudioGraphError,
  disposeAudioGraph,
  initializeAudioGraph,
  initialAudioGraphRuntime,
} from './audioGraphService';

function createMockAudioNode() {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

describe('audioGraphService', () => {
  it('initializes source and analyser nodes and connects source to analyser', () => {
    const sourceNode = createMockAudioNode();
    const analyserNode = createMockAudioNode();

    const audioContext = {
      createMediaStreamSource: vi.fn(() => sourceNode),
      createAnalyser: vi.fn(() => analyserNode),
    } as unknown as AudioContext;

    const stream = {} as MediaStream;

    const runtime = initializeAudioGraph({
      audioContext,
      mediaStream: stream,
    });

    expect(audioContext.createMediaStreamSource).toHaveBeenCalledWith(stream);
    expect(audioContext.createAnalyser).toHaveBeenCalledTimes(1);
    expect(sourceNode.connect).toHaveBeenCalledWith(analyserNode);
    expect(runtime.sourceNode).toBe(sourceNode);
    expect(runtime.analyserNode).toBe(analyserNode);
  });

  it('does not dispose runtime as part of initialize flow', () => {
    const sourceNode = createMockAudioNode();
    const analyserNode = createMockAudioNode();

    const audioContext = {
      createMediaStreamSource: vi.fn(() => sourceNode),
      createAnalyser: vi.fn(() => analyserNode),
    } as unknown as AudioContext;

    initializeAudioGraph({
      audioContext,
      mediaStream: {} as MediaStream,
    });

    expect(sourceNode.disconnect).not.toHaveBeenCalled();
    expect(analyserNode.disconnect).not.toHaveBeenCalled();
  });

  it('disposeAudioGraph is idempotent for null runtime', () => {
    expect(disposeAudioGraph(null)).toEqual(initialAudioGraphRuntime);
    expect(disposeAudioGraph(undefined)).toEqual(initialAudioGraphRuntime);
  });

  it('disposeAudioGraph disconnects both nodes and returns cleared runtime', () => {
    const sourceNode = createMockAudioNode();
    const analyserNode = createMockAudioNode();

    const runtime = disposeAudioGraph({
      sourceNode: sourceNode as unknown as MediaStreamAudioSourceNode,
      analyserNode: analyserNode as unknown as AnalyserNode,
    });

    expect(sourceNode.disconnect).toHaveBeenCalledTimes(1);
    expect(analyserNode.disconnect).toHaveBeenCalledTimes(1);
    expect(runtime).toEqual(initialAudioGraphRuntime);
  });

  it('continues disposal when one disconnect throws', () => {
    const sourceNode = {
      disconnect: vi.fn(() => {
        throw new Error('disconnect failed');
      }),
    };

    const analyserNode = createMockAudioNode();

    const runtime = disposeAudioGraph({
      sourceNode: sourceNode as unknown as MediaStreamAudioSourceNode,
      analyserNode: analyserNode as unknown as AnalyserNode,
    });

    expect(sourceNode.disconnect).toHaveBeenCalledTimes(1);
    expect(analyserNode.disconnect).toHaveBeenCalledTimes(1);
    expect(runtime).toEqual(initialAudioGraphRuntime);
  });

  it('throws invalid-runtime when context or stream is missing', () => {
    expect(() => initializeAudioGraph({ audioContext: null, mediaStream: null })).toThrowError(AudioGraphError);

    try {
      initializeAudioGraph({ audioContext: null, mediaStream: null });
    } catch (error) {
      const graphError = error as AudioGraphError;
      expect(graphError.code).toBe('invalid-runtime');
    }
  });

  it('throws graph-init-failed when node creation fails', () => {
    const audioContext = {
      createMediaStreamSource: vi.fn(() => {
        throw new Error('source fail');
      }),
      createAnalyser: vi.fn(),
    } as unknown as AudioContext;

    expect(() => initializeAudioGraph({ audioContext, mediaStream: {} as MediaStream })).toThrowError(AudioGraphError);

    try {
      initializeAudioGraph({ audioContext, mediaStream: {} as MediaStream });
    } catch (error) {
      const graphError = error as AudioGraphError;
      expect(graphError.code).toBe('graph-init-failed');
    }
  });

  it('cleans partially created nodes when connect fails', () => {
    const sourceNode = {
      connect: vi.fn(() => {
        throw new Error('connect fail');
      }),
      disconnect: vi.fn(),
    };

    const analyserNode = createMockAudioNode();

    const audioContext = {
      createMediaStreamSource: vi.fn(() => sourceNode),
      createAnalyser: vi.fn(() => analyserNode),
    } as unknown as AudioContext;

    expect(() => initializeAudioGraph({ audioContext, mediaStream: {} as MediaStream })).toThrowError(AudioGraphError);
    expect(sourceNode.disconnect).toHaveBeenCalledTimes(1);
    expect(analyserNode.disconnect).toHaveBeenCalledTimes(1);
  });
});
