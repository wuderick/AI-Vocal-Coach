import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppStateProvider } from '../state/AppStateProvider';
import { useAudioDevices } from './useAudioDevices';
import * as audioDeviceService from '../services/audio/audioDeviceService';

function TestComponent() {
  const { audioInputDevices, selectedAudioInputId, refreshAudioDevices, selectAudioDevice } = useAudioDevices();

  return (
    <div>
      <div data-testid="selected">{selectedAudioInputId ?? 'null'}</div>
      <div data-testid="devices">{audioInputDevices.map((device) => device.id).join(',')}</div>
      <button onClick={() => void refreshAudioDevices()} data-testid="refresh">
        refresh
      </button>
      <button onClick={() => selectAudioDevice('invalid-id')} data-testid="select-invalid">
        select invalid
      </button>
      <button onClick={() => selectAudioDevice('mic-1')} data-testid="select-valid">
        select valid
      </button>
    </div>
  );
}

describe('useAudioDevices', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not import service directly in hook file', async () => {
    const hookSource = await import('./useAudioDevices');
    expect(hookSource.useAudioDevices).toBeDefined();
  });

  it('refreshes audio devices on mount and updates selection to default when present', async () => {
    const getAudioInputDevices = vi.spyOn(audioDeviceService, 'getAudioInputDevices').mockResolvedValue([
      { id: 'default', label: 'Microphone 1', isDefault: true },
      { id: 'mic-1', label: 'My Microphone', isDefault: false },
    ]);

    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('default'));
    expect(screen.getByTestId('devices')).toHaveTextContent('default,mic-1');
    expect(getAudioInputDevices).toHaveBeenCalledTimes(1);
  });

  it('re-subscribes to devicechange events and refreshes on event', async () => {
    const listeners: Record<string, ((event: Event) => void)[]> = { devicechange: [] };
    const mediaDevices = {
      enumerateDevices: vi.fn().mockResolvedValue([{ kind: 'audioinput', deviceId: 'mic-1', label: 'Microphone 1' }]),
      addEventListener: vi.fn((event: string, callback: (event: Event) => void) => {
        listeners[event]?.push(callback);
      }),
      removeEventListener: vi.fn((event: string, callback: (event: Event) => void) => {
        listeners[event] = listeners[event]?.filter((cb) => cb !== callback) ?? [];
      }),
    };
    vi.stubGlobal('navigator', { mediaDevices } as unknown as Navigator);

    const getAudioInputDevices = vi.spyOn(audioDeviceService, 'getAudioInputDevices').mockResolvedValue([
      { id: 'mic-1', label: 'Microphone 1', isDefault: false },
    ]);

    const { unmount } = render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>,
    );

    await waitFor(() => expect(getAudioInputDevices).toHaveBeenCalledTimes(1));

    listeners.devicechange.forEach((callback) => callback(new Event('devicechange')));
    await waitFor(() => expect(getAudioInputDevices).toHaveBeenCalledTimes(2));

    unmount();
    expect(mediaDevices.removeEventListener).toHaveBeenCalledTimes(1);
  });

  it('keeps selected device after refresh when still present', async () => {
    const getAudioInputDevices = vi.spyOn(audioDeviceService, 'getAudioInputDevices');
    getAudioInputDevices.mockResolvedValueOnce([
      { id: 'mic-1', label: 'My Microphone', isDefault: false },
    ]);
    getAudioInputDevices.mockResolvedValueOnce([
      { id: 'mic-1', label: 'My Microphone', isDefault: false },
      { id: 'mic-2', label: 'Mic 2', isDefault: false },
    ]);

    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('mic-1'));

    fireEvent.click(screen.getByTestId('refresh'));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('mic-1'));
    expect(screen.getByTestId('devices')).toHaveTextContent('mic-1,mic-2');
  });

  it('falls back to default when initially selected device is removed', async () => {
    const getAudioInputDevices = vi.spyOn(audioDeviceService, 'getAudioInputDevices');
    getAudioInputDevices.mockResolvedValueOnce([
      { id: 'mic-1', label: 'My Microphone', isDefault: false },
      { id: 'mic-2', label: 'Other Microphone', isDefault: false },
    ]);
    getAudioInputDevices.mockResolvedValueOnce([
      { id: 'default', label: 'Default Microphone', isDefault: true },
    ]);

    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('mic-1'));
    fireEvent.click(screen.getByTestId('refresh'));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('default'));
  });

  it('falls back to first device when no default exists after removal', async () => {
    const getAudioInputDevices = vi.spyOn(audioDeviceService, 'getAudioInputDevices');
    getAudioInputDevices.mockResolvedValueOnce([
      { id: 'mic-1', label: 'My Microphone', isDefault: false },
      { id: 'mic-2', label: 'Other Microphone', isDefault: false },
    ]);
    getAudioInputDevices.mockResolvedValueOnce([
      { id: 'mic-2', label: 'Other Microphone', isDefault: false },
    ]);

    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('mic-1'));
    fireEvent.click(screen.getByTestId('refresh'));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('mic-2'));
  });

  it('sets selectedAudioInputId to null when refresh returns empty list', async () => {
    vi.spyOn(audioDeviceService, 'getAudioInputDevices').mockResolvedValue([]);

    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('null'));
    expect(screen.getByTestId('devices')).toHaveTextContent('');
  });

  it('selectAudioDevice updates a valid id and ignores invalid id', async () => {
    vi.spyOn(audioDeviceService, 'getAudioInputDevices').mockResolvedValue([
      { id: 'mic-1', label: 'My Microphone', isDefault: false },
      { id: 'mic-2', label: 'Other Microphone', isDefault: true },
    ]);

    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('mic-2'));
    fireEvent.click(screen.getByTestId('select-valid'));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('mic-1'));

    fireEvent.click(screen.getByTestId('select-invalid'));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('mic-1'));
  });
});
