export type FrequencyUpdateSchedulerErrorCode = 'scheduler-already-running' | 'invalid-runtime';

export class FrequencyUpdateSchedulerError extends Error {
  readonly code: FrequencyUpdateSchedulerErrorCode;

  constructor(code: FrequencyUpdateSchedulerErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'FrequencyUpdateSchedulerError';
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

export interface FrequencyUpdateSchedulerRuntime {
  animationFrameId: number | null;
  isRunning: boolean;
}

export interface StartSchedulerOptions {
  runtime: FrequencyUpdateSchedulerRuntime;
  onFrame: () => void;
  onError: (error: unknown) => void;
}

export function createSchedulerRuntime(): FrequencyUpdateSchedulerRuntime {
  return {
    animationFrameId: null,
    isRunning: false,
  };
}

export function stopScheduler(runtime: FrequencyUpdateSchedulerRuntime): void {
  if (runtime.animationFrameId !== null) {
    cancelAnimationFrame(runtime.animationFrameId);
  }

  runtime.animationFrameId = null;
  runtime.isRunning = false;
}

export function startScheduler(options: StartSchedulerOptions): void {
  const { runtime, onFrame, onError } = options;

  if (runtime.isRunning) {
    throw new FrequencyUpdateSchedulerError(
      'scheduler-already-running',
      'Frequency update scheduler is already running.',
    );
  }

  runtime.isRunning = true;
  let frameIdentity: number | null = null;

  const runFrame = () => {
    if (!runtime.isRunning) {
      runtime.animationFrameId = null;
      return;
    }

    if (runtime.animationFrameId !== frameIdentity) {
      return;
    }

    try {
      onFrame();
    } catch (error) {
      stopScheduler(runtime);
      onError(error);
      return;
    }

    if (!runtime.isRunning) {
      runtime.animationFrameId = null;
      return;
    }

    if (runtime.animationFrameId !== frameIdentity) {
      return;
    }

    try {
      const nextFrameIdentity = requestAnimationFrame(runFrame);
      frameIdentity = nextFrameIdentity;
      runtime.animationFrameId = nextFrameIdentity;
    } catch (error) {
      stopScheduler(runtime);
      onError(error);
    }
  };

  try {
    const initialFrameIdentity = requestAnimationFrame(runFrame);
    frameIdentity = initialFrameIdentity;
    runtime.animationFrameId = initialFrameIdentity;
  } catch (error) {
    runtime.animationFrameId = null;
    runtime.isRunning = false;
    throw error;
  }
}
