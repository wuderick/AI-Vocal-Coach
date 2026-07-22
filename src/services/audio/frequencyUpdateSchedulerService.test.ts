import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import {
  FrequencyUpdateSchedulerError,
  createSchedulerRuntime,
  startScheduler,
  stopScheduler,
} from './frequencyUpdateSchedulerService';

describe('frequencyUpdateSchedulerService', () => {
  let requestAnimationFrameSpy: MockInstance<(callback: FrameRequestCallback) => number>;
  let cancelAnimationFrameSpy: MockInstance<(handle: number) => void>;
  let scheduledCallbacks: FrameRequestCallback[];
  let nextFrameId: number;

  beforeEach(() => {
    scheduledCallbacks = [];
    nextFrameId = 1;

    requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      scheduledCallbacks.push(cb);
      const id = nextFrameId;
      nextFrameId += 1;
      return id;
    });

    cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates stopped runtime by default', () => {
    const runtime = createSchedulerRuntime();

    expect(runtime.animationFrameId).toBeNull();
    expect(runtime.isRunning).toBe(false);
  });

  it('starts scheduler and sets running invariant', () => {
    const runtime = createSchedulerRuntime();
    const onFrame = vi.fn();
    const onError = vi.fn();

    startScheduler({ runtime, onFrame, onError });

    expect(runtime.isRunning).toBe(true);
    expect(runtime.animationFrameId).toBe(1);
    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);
  });

  it('throws scheduler-already-running on duplicate start and keeps runtime unchanged', () => {
    const runtime = createSchedulerRuntime();
    startScheduler({ runtime, onFrame: vi.fn(), onError: vi.fn() });

    const runningFrameId = runtime.animationFrameId;

    expect(() => startScheduler({ runtime, onFrame: vi.fn(), onError: vi.fn() })).toThrowError(FrequencyUpdateSchedulerError);

    try {
      startScheduler({ runtime, onFrame: vi.fn(), onError: vi.fn() });
    } catch (error) {
      expect((error as FrequencyUpdateSchedulerError).code).toBe('scheduler-already-running');
    }

    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);
    expect(runtime.isRunning).toBe(true);
    expect(runtime.animationFrameId).toBe(runningFrameId);
  });

  it('stops scheduler and sets stopped invariant', () => {
    const runtime = createSchedulerRuntime();
    startScheduler({ runtime, onFrame: vi.fn(), onError: vi.fn() });

    stopScheduler(runtime);

    expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(1);
    expect(runtime.isRunning).toBe(false);
    expect(runtime.animationFrameId).toBeNull();
  });

  it('stopScheduler is idempotent and does not throw for stopped runtime', () => {
    const runtime = createSchedulerRuntime();

    expect(() => stopScheduler(runtime)).not.toThrow();
    expect(cancelAnimationFrameSpy).not.toHaveBeenCalled();
    expect(runtime.isRunning).toBe(false);
    expect(runtime.animationFrameId).toBeNull();

    startScheduler({ runtime, onFrame: vi.fn(), onError: vi.fn() });
    stopScheduler(runtime);

    expect(() => stopScheduler(runtime)).not.toThrow();
    expect(cancelAnimationFrameSpy).toHaveBeenCalledTimes(1);
    expect(runtime.isRunning).toBe(false);
    expect(runtime.animationFrameId).toBeNull();
  });

  it('runs onFrame at most once per RAF callback and schedules next frame only after success', () => {
    const runtime = createSchedulerRuntime();
    const executionOrder: string[] = [];

    requestAnimationFrameSpy.mockImplementation((cb: FrameRequestCallback) => {
      executionOrder.push('request');
      scheduledCallbacks.push(cb);
      const id = nextFrameId;
      nextFrameId += 1;
      return id;
    });

    const onFrame = vi.fn(() => {
      executionOrder.push('onFrame');
    });

    startScheduler({
      runtime,
      onFrame,
      onError: vi.fn(),
    });

    executionOrder.length = 0;

    const firstCallback = scheduledCallbacks[0];
    firstCallback(16);

    expect(onFrame).toHaveBeenCalledTimes(1);
    expect(executionOrder).toEqual(['onFrame', 'request']);
    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(2);
    expect(runtime.animationFrameId).toBe(2);
  });

  it('does not schedule another frame when stopped during callback execution', () => {
    const runtime = createSchedulerRuntime();

    const onFrame = vi.fn(() => {
      stopScheduler(runtime);
    });

    startScheduler({ runtime, onFrame, onError: vi.fn() });

    const firstCallback = scheduledCallbacks[0];
    firstCallback(16);

    expect(onFrame).toHaveBeenCalledTimes(1);
    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);
    expect(runtime.isRunning).toBe(false);
    expect(runtime.animationFrameId).toBeNull();
  });

  it('stops scheduler and calls onError when onFrame throws', () => {
    const runtime = createSchedulerRuntime();
    const frameError = new Error('frame failed');
    const onError = vi.fn();

    startScheduler({
      runtime,
      onFrame: () => {
        throw frameError;
      },
      onError,
    });

    const firstCallback = scheduledCallbacks[0];
    firstCallback(16);

    expect(onError).toHaveBeenCalledWith(frameError);
    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);
    expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(1);
    expect(runtime.isRunning).toBe(false);
    expect(runtime.animationFrameId).toBeNull();
  });

  it('does not let stale callback resurrect old RAF loop after stop and restart', () => {
    const runtime = createSchedulerRuntime();

    startScheduler({ runtime, onFrame: vi.fn(), onError: vi.fn() });
    expect(runtime.animationFrameId).toBe(1);
    const staleCallback = scheduledCallbacks[0];

    stopScheduler(runtime);
    startScheduler({ runtime, onFrame: vi.fn(), onError: vi.fn() });
    expect(runtime.animationFrameId).toBe(2);

    staleCallback(16);

    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(2);
    expect(runtime.animationFrameId).toBe(2);
    expect(runtime.isRunning).toBe(true);
  });

  it('rolls back runtime invariant when initial requestAnimationFrame throws', () => {
    const runtime = createSchedulerRuntime();

    requestAnimationFrameSpy.mockImplementation(() => {
      throw new Error('raf-init-failed');
    });

    expect(() => startScheduler({ runtime, onFrame: vi.fn(), onError: vi.fn() })).toThrowError('raf-init-failed');
    expect(runtime.isRunning).toBe(false);
    expect(runtime.animationFrameId).toBeNull();
  });

  it('stops scheduler and calls onError when next-frame requestAnimationFrame throws', () => {
    const runtime = createSchedulerRuntime();
    const onError = vi.fn();

    requestAnimationFrameSpy.mockImplementation((cb: FrameRequestCallback) => {
      if (nextFrameId === 1) {
        scheduledCallbacks.push(cb);
        nextFrameId += 1;
        return 1;
      }

      throw new Error('raf-next-failed');
    });

    startScheduler({ runtime, onFrame: vi.fn(), onError });
    const firstCallback = scheduledCallbacks[0];
    firstCallback(16);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
    expect((onError.mock.calls[0]?.[0] as Error).message).toBe('raf-next-failed');
    expect(runtime.isRunning).toBe(false);
    expect(runtime.animationFrameId).toBeNull();
    expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(1);
  });
});
