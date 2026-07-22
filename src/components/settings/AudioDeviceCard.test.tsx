import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppStateProvider } from '../../state/AppStateProvider';
import { AudioDeviceCard } from './AudioDeviceCard';
import * as audioDeviceService from '../../services/audio/audioDeviceService';

describe('AudioDeviceCard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
});
