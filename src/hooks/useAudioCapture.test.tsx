import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppStateProvider } from '../state/AppStateProvider';
import { useAppStateContext } from '../state/AppStateContext';
import { useAudioCapture } from './useAudioCapture';
import * as audioCaptureService from '../services/audio/audioCaptureService';
import * as audioDeviceService from '../services/audio/audioDeviceService';
import * as audioGraphService from '../services/audio/audioGraphService';

vi.mock('../services/audio/audioCaptureService', async () => {
  const actual = await vi.importActual<typeof import('../services/audio/audioCaptureService')>('../services/audio/audioCaptureService');
  return {
    ...actual,
    startAudioCapture: vi.fn(),
    stopAudioCapture: vi.fn(),
  };
});

vi.mock('../services/audio/audioDeviceService', async () => {
  const actual = await vi.importActual<typeof import('../services/audio/audioDeviceService')>('../services/audio/audioDeviceService');
  return {
    ...actual,
    getAudioInputDevices: vi.fn().mockResolvedValue([]),
    subscribeToDeviceChanges: vi.fn(() => () => {}),
  };
});

vi.mock('../services/audio/audioGraphService', async () => {
  const actual = await vi.importActual<typeof import('../services/audio/audioGraphService')>('../services/audio/audioGraphService');
  return {
    ...actual,
    initializeAudioGraph: vi.fn(),
    disposeAudioGraph: vi.fn(),
  };
});

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function createRuntime(overrides: Partial<audioCaptureService.AudioCaptureRuntime> = {}): audioCaptureService.AudioCaptureRuntime {
  return {
    audioContext: null,
    mediaStream: null,
    ...overrides,
  };
}

function TestCaptureHarness() {
  const { state, actions } = useAppStateContext();
  const { startAudioCapture, stopAudioCapture, isAudioGraphReady } = useAudioCapture();

  return (
    <div>
      <div data-testid="status">{state.audioCaptureStatus}</div>
      <div data-testid="error">{state.audioCaptureErrorCode ?? 'null'}</div>
      <div data-testid="selected">{state.selectedAudioInputId ?? 'null'}</div>
      <div data-testid="runtime-stream">{String(Boolean(state.audioCaptureRuntime.mediaStream))}</div>
      <div data-testid="runtime-graph-source">{String(Boolean(state.audioGraphRuntime.sourceNode))}</div>
      <div data-testid="runtime-graph-analyser">{String(Boolean(state.audioGraphRuntime.analyserNode))}</div>
      <div data-testid="graph-ready">{String(isAudioGraphReady)}</div>
      <button data-testid="start" onClick={() => void startAudioCapture()}>start</button>
      <button data-testid="stop" onClick={() => void stopAudioCapture()}>stop</button>
      <button data-testid="refresh-devices" onClick={() => void actions.refreshAudioDevices()}>refresh devices</button>
      <button data-testid="select-mic-1" onClick={() => actions.selectAudioDevice('mic-1')}>select mic 1</button>
      <button data-testid="reset-settings" onClick={() => actions.resetSettings()}>reset</button>
    </div>
  );
}

function renderCaptureHarness(options?: { strictMode?: boolean }) {
  const tree = (
    <AppStateProvider>
      <TestCaptureHarness />
    </AppStateProvider>
  );

  if (options?.strictMode) {
    return render(<React.StrictMode>{tree}</React.StrictMode>);
  }

  return render(tree);
}

describe('useAudioCapture + AppStateProvider', () => {
  const mockedStartAudioCapture = vi.mocked(audioCaptureService.startAudioCapture);
  const mockedStopAudioCapture = vi.mocked(audioCaptureService.stopAudioCapture);
  const mockedGetAudioInputDevices = vi.mocked(audioDeviceService.getAudioInputDevices);
  const mockedInitializeAudioGraph = vi.mocked(audioGraphService.initializeAudioGraph);
  const mockedDisposeAudioGraph = vi.mocked(audioGraphService.disposeAudioGraph);

  const graphRuntime = {
    sourceNode: { disconnect: vi.fn() } as unknown as MediaStreamAudioSourceNode,
    analyserNode: { disconnect: vi.fn() } as unknown as AnalyserNode,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAudioInputDevices.mockResolvedValue([]);
    mockedStartAudioCapture.mockResolvedValue(createRuntime());
    mockedStopAudioCapture.mockResolvedValue(createRuntime());
    mockedInitializeAudioGraph.mockReturnValue(graphRuntime);
    mockedDisposeAudioGraph.mockReturnValue({ sourceNode: null, analyserNode: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with idle state', () => {
    render(
      <AppStateProvider>
        <TestCaptureHarness />
      </AppStateProvider>,
    );

    expect(screen.getByTestId('status')).toHaveTextContent('idle');
    expect(screen.getByTestId('error')).toHaveTextContent('null');
  });

  it('transitions idle -> starting -> active and saves runtime stream', async () => {
    const deferred = createDeferred<audioCaptureService.AudioCaptureRuntime>();
    mockedStartAudioCapture.mockReturnValueOnce(deferred.promise);

    const stream = { getTracks: () => [] } as unknown as MediaStream;

    render(
      <AppStateProvider>
        <TestCaptureHarness />
      </AppStateProvider>,
    );

    fireEvent.click(screen.getByTestId('start'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('starting'));

    deferred.resolve(createRuntime({ mediaStream: stream }));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('active'));
    await waitFor(() => expect(screen.getByTestId('runtime-stream')).toHaveTextContent('true'));
    await waitFor(() => expect(screen.getByTestId('graph-ready')).toHaveTextContent('true'));
    expect(mockedInitializeAudioGraph).toHaveBeenCalledTimes(1);
  });

  it('passes selectedAudioInputId to startAudioCapture', async () => {
    mockedGetAudioInputDevices.mockResolvedValue([
      { id: 'default', label: 'Default', isDefault: true },
      { id: 'mic-1', label: 'Mic 1', isDefault: false },
    ]);

    render(
      <AppStateProvider>
        <TestCaptureHarness />
      </AppStateProvider>,
    );

    fireEvent.click(screen.getByTestId('refresh-devices'));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('default'));

    fireEvent.click(screen.getByTestId('select-mic-1'));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('mic-1'));

    fireEvent.click(screen.getByTestId('start'));

    await waitFor(() => {
      expect(mockedStartAudioCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceId: 'mic-1',
        }),
      );
    });
  });

  it('passes null deviceId when no selected device exists', async () => {
    render(
      <AppStateProvider>
        <TestCaptureHarness />
      </AppStateProvider>,
    );

    fireEvent.click(screen.getByTestId('start'));

    await waitFor(() => {
      expect(mockedStartAudioCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceId: null,
        }),
      );
    });
  });

  it('transitions starting -> error on start failure and saves error code', async () => {
    mockedStartAudioCapture.mockRejectedValueOnce(
      new audioCaptureService.AudioCaptureError('permission-denied', 'denied'),
    );

    render(
      <AppStateProvider>
        <TestCaptureHarness />
      </AppStateProvider>,
    );

    fireEvent.click(screen.getByTestId('start'));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'));
    expect(screen.getByTestId('error')).toHaveTextContent('permission-denied');
  });

  it('clears old error when a new start begins', async () => {
    mockedStartAudioCapture.mockRejectedValueOnce(
      new audioCaptureService.AudioCaptureError('device-not-found', 'missing device'),
    );

    const deferred = createDeferred<audioCaptureService.AudioCaptureRuntime>();
    mockedStartAudioCapture.mockReturnValueOnce(deferred.promise);

    render(
      <AppStateProvider>
        <TestCaptureHarness />
      </AppStateProvider>,
    );

    fireEvent.click(screen.getByTestId('start'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'));
    expect(screen.getByTestId('error')).toHaveTextContent('device-not-found');

    fireEvent.click(screen.getByTestId('start'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('starting'));
    expect(screen.getByTestId('error')).toHaveTextContent('null');

    deferred.resolve(createRuntime());
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('active'));
  });

  it('transitions active -> stopping -> idle and clears runtime stream on stop', async () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    mockedStartAudioCapture.mockResolvedValueOnce(createRuntime({ mediaStream: stream }));

    const deferredStop = createDeferred<audioCaptureService.AudioCaptureRuntime>();
    mockedStopAudioCapture.mockReturnValueOnce(deferredStop.promise);

    render(
      <AppStateProvider>
        <TestCaptureHarness />
      </AppStateProvider>,
    );

    fireEvent.click(screen.getByTestId('start'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('active'));

    fireEvent.click(screen.getByTestId('stop'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('stopping'));

    deferredStop.resolve(createRuntime({ mediaStream: null }));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('idle'));
    expect(screen.getByTestId('runtime-stream')).toHaveTextContent('false');
    await waitFor(() => expect(screen.getByTestId('graph-ready')).toHaveTextContent('false'));
    expect(mockedDisposeAudioGraph).toHaveBeenCalled();
  });

  it('ignores duplicate start while status is starting', async () => {
    const deferred = createDeferred<audioCaptureService.AudioCaptureRuntime>();
    mockedStartAudioCapture.mockReturnValueOnce(deferred.promise);

    render(
      <AppStateProvider>
        <TestCaptureHarness />
      </AppStateProvider>,
    );

    fireEvent.click(screen.getByTestId('start'));
    fireEvent.click(screen.getByTestId('start'));

    expect(mockedStartAudioCapture).toHaveBeenCalledTimes(1);

    deferred.resolve(createRuntime());
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('active'));
  });

  it('ignores duplicate stop while status is stopping', async () => {
    mockedStartAudioCapture.mockResolvedValueOnce(createRuntime());

    const deferredStop = createDeferred<audioCaptureService.AudioCaptureRuntime>();
    mockedStopAudioCapture.mockReturnValueOnce(deferredStop.promise);

    render(
      <AppStateProvider>
        <TestCaptureHarness />
      </AppStateProvider>,
    );

    fireEvent.click(screen.getByTestId('start'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('active'));

    fireEvent.click(screen.getByTestId('stop'));
    fireEvent.click(screen.getByTestId('stop'));

    expect(mockedStopAudioCapture).toHaveBeenCalledTimes(1);

    deferredStop.resolve(createRuntime());
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('idle'));
  });

  it('invalidates pending start when stop is invoked and does not return to active on stale resolve', async () => {
    const staleStreamStop = vi.fn();
    const staleRuntime = createRuntime({
      audioContext: { state: 'running' } as AudioContext,
      mediaStream: { getTracks: () => [{ stop: staleStreamStop }] } as unknown as MediaStream,
    });

    const startDeferred = createDeferred<audioCaptureService.AudioCaptureRuntime>();
    mockedStartAudioCapture.mockReturnValueOnce(startDeferred.promise);
    mockedStopAudioCapture.mockResolvedValueOnce(createRuntime({ audioContext: staleRuntime.audioContext, mediaStream: null }));

    render(
      <AppStateProvider>
        <TestCaptureHarness />
      </AppStateProvider>,
    );

    fireEvent.click(screen.getByTestId('start'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('starting'));

    fireEvent.click(screen.getByTestId('stop'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('idle'));

    startDeferred.resolve(staleRuntime);

    await waitFor(() => expect(staleStreamStop).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('status')).toHaveTextContent('idle');
  });

  it('does not let stale rejected start override newer operation state', async () => {
    const start1Deferred = createDeferred<audioCaptureService.AudioCaptureRuntime>();
    const start2Deferred = createDeferred<audioCaptureService.AudioCaptureRuntime>();

    mockedStartAudioCapture
      .mockReturnValueOnce(start1Deferred.promise)
      .mockReturnValueOnce(start2Deferred.promise);

    mockedStopAudioCapture.mockResolvedValue(createRuntime());

    render(
      <AppStateProvider>
        <TestCaptureHarness />
      </AppStateProvider>,
    );

    fireEvent.click(screen.getByTestId('start'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('starting'));

    fireEvent.click(screen.getByTestId('stop'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('idle'));

    fireEvent.click(screen.getByTestId('start'));

    start2Deferred.resolve(createRuntime());
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('active'));

    start1Deferred.reject(new audioCaptureService.AudioCaptureError('unknown', 'stale failure'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('active'));
  });

  it('resetSettings stops capture and leaves no active stream', async () => {
    const stopTrack = vi.fn();
    const stream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
    const runtime = createRuntime({ mediaStream: stream, audioContext: { state: 'running' } as AudioContext });

    mockedStartAudioCapture.mockResolvedValueOnce(runtime);
    mockedStopAudioCapture.mockImplementation(async (currentRuntime) => {
      audioCaptureService.stopMediaStream(currentRuntime.mediaStream);
      return {
        audioContext: currentRuntime.audioContext,
        mediaStream: null,
      };
    });

    render(
      <AppStateProvider>
        <TestCaptureHarness />
      </AppStateProvider>,
    );

    fireEvent.click(screen.getByTestId('start'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('active'));

    fireEvent.click(screen.getByTestId('reset-settings'));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('idle'));
    await waitFor(() => expect(screen.getByTestId('runtime-stream')).toHaveTextContent('false'));
    await waitFor(() => expect(screen.getByTestId('graph-ready')).toHaveTextContent('false'));
    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect(mockedDisposeAudioGraph).toHaveBeenCalled();
  });

  it('does not update state after unmount when pending start resolves', async () => {
    const startDeferred = createDeferred<audioCaptureService.AudioCaptureRuntime>();
    mockedStartAudioCapture.mockReturnValueOnce(startDeferred.promise);

    const { unmount } = render(
      <AppStateProvider>
        <TestCaptureHarness />
      </AppStateProvider>,
    );

    fireEvent.click(screen.getByTestId('start'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('starting'));

    unmount();

    expect(() => {
      startDeferred.resolve(createRuntime());
    }).not.toThrow();
  });

  it('supports selectAudioDevice state updates under React.StrictMode', async () => {
    mockedGetAudioInputDevices.mockResolvedValue([
      { id: 'default', label: 'Default', isDefault: true },
      { id: 'mic-1', label: 'Mic 1', isDefault: false },
    ]);

    renderCaptureHarness({ strictMode: true });

    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('default'));

    fireEvent.click(screen.getByTestId('select-mic-1'));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('mic-1'));
  });

  it('supports resetSettings updates under React.StrictMode', async () => {
    mockedGetAudioInputDevices.mockResolvedValue([
      { id: 'default', label: 'Default', isDefault: true },
      { id: 'mic-1', label: 'Mic 1', isDefault: false },
    ]);

    renderCaptureHarness({ strictMode: true });

    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('default'));
    fireEvent.click(screen.getByTestId('select-mic-1'));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('mic-1'));

    fireEvent.click(screen.getByTestId('reset-settings'));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('null'));
    expect(screen.getByTestId('status')).toHaveTextContent('idle');
  });

  it('supports idle -> starting -> active transition under React.StrictMode', async () => {
    const deferred = createDeferred<audioCaptureService.AudioCaptureRuntime>();
    mockedStartAudioCapture.mockReturnValueOnce(deferred.promise);

    renderCaptureHarness({ strictMode: true });

    fireEvent.click(screen.getByTestId('start'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('starting'));

    deferred.resolve(createRuntime({ mediaStream: { getTracks: () => [] } as unknown as MediaStream }));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('active'));
  });

  it('does not leave mounted guard permanently disabled after StrictMode effect cleanup/setup', async () => {
    mockedStartAudioCapture.mockResolvedValueOnce(createRuntime());

    renderCaptureHarness({ strictMode: true });

    fireEvent.click(screen.getByTestId('start'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('active'));
  });

  it('stops active media stream tracks on unmount', async () => {
    const stopTrack = vi.fn();
    const runtime = createRuntime({
      audioContext: { state: 'running' } as AudioContext,
      mediaStream: { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream,
    });

    mockedStartAudioCapture.mockResolvedValueOnce(runtime);
    mockedStopAudioCapture.mockImplementation(async (currentRuntime) => {
      audioCaptureService.stopMediaStream(currentRuntime.mediaStream);
      return {
        audioContext: currentRuntime.audioContext,
        mediaStream: null,
      };
    });

    const { unmount } = renderCaptureHarness();

    fireEvent.click(screen.getByTestId('start'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('active'));

    unmount();
    await waitFor(() => expect(stopTrack).toHaveBeenCalledTimes(1));
    expect(mockedDisposeAudioGraph).toHaveBeenCalled();
  });

  it('stores graph runtime in state after successful start', async () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    mockedStartAudioCapture.mockResolvedValueOnce(createRuntime({ mediaStream: stream, audioContext: {} as AudioContext }));

    renderCaptureHarness();

    fireEvent.click(screen.getByTestId('start'));

    await waitFor(() => expect(screen.getByTestId('runtime-graph-source')).toHaveTextContent('true'));
    await waitFor(() => expect(screen.getByTestId('runtime-graph-analyser')).toHaveTextContent('true'));
  });

  it('keeps old graph runtime when new graph initialization fails', async () => {
    const stream1 = { getTracks: () => [] } as unknown as MediaStream;
    const stream2Stop = vi.fn();
    const stream2 = { getTracks: () => [{ stop: stream2Stop }] } as unknown as MediaStream;

    mockedStartAudioCapture
      .mockResolvedValueOnce(createRuntime({ mediaStream: stream1, audioContext: {} as AudioContext }))
      .mockResolvedValueOnce(createRuntime({ mediaStream: stream2, audioContext: {} as AudioContext }));

    mockedInitializeAudioGraph
      .mockReturnValueOnce(graphRuntime)
      .mockImplementationOnce(() => {
        throw new audioGraphService.AudioGraphError('graph-init-failed', 'graph failure');
      });

    mockedStopAudioCapture.mockImplementation(async (runtime) => {
      audioCaptureService.stopMediaStream(runtime.mediaStream);
      return {
        audioContext: runtime.audioContext,
        mediaStream: null,
      };
    });

    renderCaptureHarness();

    fireEvent.click(screen.getByTestId('start'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('active'));
    expect(screen.getByTestId('graph-ready')).toHaveTextContent('true');

    const disposeCallCountBeforeFailure = mockedDisposeAudioGraph.mock.calls.length;

    fireEvent.click(screen.getByTestId('start'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'));

    expect(screen.getByTestId('graph-ready')).toHaveTextContent('true');
    expect(stream2Stop).toHaveBeenCalledTimes(1);
    expect(mockedDisposeAudioGraph).toHaveBeenCalledTimes(disposeCallCountBeforeFailure);
  });
});
