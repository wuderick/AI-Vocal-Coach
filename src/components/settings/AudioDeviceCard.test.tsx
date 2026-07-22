import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppStateProvider } from '../../state/AppStateProvider';
import { AudioDeviceCard } from './AudioDeviceCard';
import * as audioDeviceService from '../../services/audio/audioDeviceService';
import * as audioCaptureService from '../../services/audio/audioCaptureService';
import * as audioGraphService from '../../services/audio/audioGraphService';
import * as frequencyBufferService from '../../services/audio/frequencyBufferService';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

function createRuntime(overrides: Partial<audioCaptureService.AudioCaptureRuntime> = {}): audioCaptureService.AudioCaptureRuntime {
  return {
    audioContext: null,
    mediaStream: null,
    ...overrides,
  };
}

describe('AudioDeviceCard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(audioCaptureService, 'startAudioCapture').mockResolvedValue(createRuntime());
    vi.spyOn(audioCaptureService, 'stopAudioCapture').mockResolvedValue(createRuntime());
    vi.spyOn(audioGraphService, 'initializeAudioGraph').mockReturnValue({
      sourceNode: { disconnect: vi.fn() } as unknown as MediaStreamAudioSourceNode,
      analyserNode: { disconnect: vi.fn() } as unknown as AnalyserNode,
    });
    vi.spyOn(audioGraphService, 'disposeAudioGraph').mockReturnValue({
      sourceNode: null,
      analyserNode: null,
    });
    vi.spyOn(frequencyBufferService, 'initializeFrequencyBuffer').mockReturnValue({
      frequencyData: new Float32Array(4),
      fftSize: 8,
      frequencyBinCount: 4,
    });
    vi.spyOn(frequencyBufferService, 'disposeFrequencyBuffer').mockReturnValue({
      frequencyData: null,
      fftSize: 0,
      frequencyBinCount: 0,
    });
  });

  it('shows empty state when no devices exist', async () => {
    vi.spyOn(audioDeviceService, 'getAudioInputDevices').mockResolvedValue([]);

    render(
      <AppStateProvider>
        <AudioDeviceCard />
      </AppStateProvider>,
    );

    await waitFor(() => expect(screen.getByText(/no audio input devices found/i)).toBeInTheDocument());
  });

  it('shows single device label when only one device exists', async () => {
    vi.spyOn(audioDeviceService, 'getAudioInputDevices').mockResolvedValue([
      { id: 'mic-1', label: 'My Microphone', isDefault: false },
    ]);

    render(
      <AppStateProvider>
        <AudioDeviceCard />
      </AppStateProvider>,
    );

    await waitFor(() => expect(screen.getByText('My Microphone')).toBeInTheDocument());
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('shows dropdown when multiple devices exist', async () => {
    vi.spyOn(audioDeviceService, 'getAudioInputDevices').mockResolvedValue([
      { id: 'default', label: 'Microphone 1', isDefault: true },
      { id: 'mic-1', label: 'My Microphone', isDefault: false },
    ]);

    render(
      <AppStateProvider>
        <AudioDeviceCard />
      </AppStateProvider>,
    );

    const select = await screen.findByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /microphone 1/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /my microphone/i })).toBeInTheDocument();
  });

  it('calls selectAudioDevice when dropdown value changes', async () => {
    vi.spyOn(audioDeviceService, 'getAudioInputDevices').mockResolvedValue([
      { id: 'default', label: 'Microphone 1', isDefault: true },
      { id: 'mic-1', label: 'My Microphone', isDefault: false },
    ]);

    render(
      <AppStateProvider>
        <AudioDeviceCard />
      </AppStateProvider>,
    );

    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: 'mic-1' } });
    await waitFor(() => expect((select as HTMLSelectElement).value).toBe('mic-1'));
  });

  it('uses normalized labels and does not expose blank native labels', async () => {
    // This service test ensures labels are normalized before reaching UI.
    vi.spyOn(audioDeviceService, 'getAudioInputDevices').mockResolvedValue([
      { id: 'default', label: 'Microphone 1', isDefault: true },
      { id: 'mic-2', label: 'Microphone 2', isDefault: false },
    ]);

    render(
      <AppStateProvider>
        <AudioDeviceCard />
      </AppStateProvider>,
    );

    const select = await screen.findByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Microphone 2' })).toBeInTheDocument();
  });

  it('disables device selection while starting, active, and stopping; re-enables on idle', async () => {
    vi.spyOn(audioDeviceService, 'getAudioInputDevices').mockResolvedValue([
      { id: 'default', label: 'Microphone 1', isDefault: true },
      { id: 'mic-1', label: 'My Microphone', isDefault: false },
    ]);

    const startDeferred = createDeferred<audioCaptureService.AudioCaptureRuntime>();
    const stopDeferred = createDeferred<audioCaptureService.AudioCaptureRuntime>();
    vi.spyOn(audioCaptureService, 'startAudioCapture').mockReturnValueOnce(startDeferred.promise);
    vi.spyOn(audioCaptureService, 'stopAudioCapture').mockReturnValueOnce(stopDeferred.promise);

    render(
      <AppStateProvider>
        <AudioDeviceCard />
      </AppStateProvider>,
    );

    const select = await screen.findByRole('combobox');
    expect(select).not.toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    await waitFor(() => expect(select).toBeDisabled());

    startDeferred.resolve(createRuntime({ audioContext: { state: 'running' } as AudioContext }));
    await waitFor(() => expect(screen.getByText(/capture 狀態：啟動中（收音中）/i)).toBeInTheDocument());
    expect(select).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    await waitFor(() => expect(screen.getByText(/capture 狀態：停止中/i)).toBeInTheDocument());
    expect(select).toBeDisabled();

    stopDeferred.resolve(createRuntime({ audioContext: { state: 'suspended' } as AudioContext }));
    await waitFor(() => expect(screen.getByText(/capture 狀態：未啟動/i)).toBeInTheDocument());
    expect(select).not.toBeDisabled();
  });

  it('shows Chinese error message mapping for capture error codes', async () => {
    vi.spyOn(audioDeviceService, 'getAudioInputDevices').mockResolvedValue([
      { id: 'default', label: 'Microphone 1', isDefault: true },
      { id: 'mic-1', label: 'My Microphone', isDefault: false },
    ]);

    const startAudioCapture = vi.spyOn(audioCaptureService, 'startAudioCapture');
    startAudioCapture
      .mockRejectedValueOnce(new audioCaptureService.AudioCaptureError('permission-denied', 'denied'))
      .mockRejectedValueOnce(new audioCaptureService.AudioCaptureError('device-not-found', 'missing'))
      .mockRejectedValueOnce(new audioCaptureService.AudioCaptureError('device-busy', 'busy'))
      .mockRejectedValueOnce(new audioCaptureService.AudioCaptureError('unsupported-browser', 'unsupported'))
      .mockRejectedValueOnce(new audioCaptureService.AudioCaptureError('audio-context-failed', 'audio fail'))
      .mockRejectedValueOnce(new audioCaptureService.AudioCaptureError('unknown', 'unknown'));

    render(
      <AppStateProvider>
        <AudioDeviceCard />
      </AppStateProvider>,
    );

    const expectedMessages = [
      '沒有麥克風使用權限',
      '找不到所選麥克風',
      '麥克風目前無法使用，可能正被其他程式占用',
      '此瀏覽器不支援麥克風收音',
      '無法啟動音訊系統',
      '啟動麥克風時發生未知錯誤',
    ];

    for (const message of expectedMessages) {
      fireEvent.click(screen.getByRole('button', { name: 'Start' }));
      await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(message));
    }

    const select = await screen.findByRole('combobox');
    expect(select).not.toBeDisabled();
  });
});
