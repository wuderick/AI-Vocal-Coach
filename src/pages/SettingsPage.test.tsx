import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppStateProvider } from '../state/AppStateProvider';
import { SettingsPage } from './SettingsPage';

describe('SettingsPage', () => {
  function renderSettings() {
    return render(
      <AppStateProvider>
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      </AppStateProvider>,
    );
  }

  it('renders the theme radio options and updates the selected theme', () => {
    renderSettings();

    const lightOption = screen.getByLabelText(/light/i) as HTMLInputElement;
    expect(lightOption).toBeInTheDocument();
    expect(lightOption.checked).toBe(false);

    fireEvent.click(lightOption);
    expect(lightOption.checked).toBe(true);
  });

  it('toggles auto save recording using the switch', () => {
    renderSettings();

    const switchButton = screen.getByRole('switch');
    expect(switchButton).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(switchButton);
    expect(switchButton).toHaveAttribute('aria-checked', 'false');
  });

  it('resets settings to defaults', () => {
    renderSettings();

    fireEvent.click(screen.getByLabelText(/dark/i));
    fireEvent.click(screen.getByRole('switch'));

    expect(screen.getByLabelText(/dark/i)).toBeChecked();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(screen.getByRole('button', { name: /reset settings/i }));

    expect(screen.getByLabelText(/system/i)).toBeChecked();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('renders developer panel values from app state', () => {
    renderSettings();

    expect(screen.getByText('Theme', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Recording State', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Microphone Permission', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Analysis Status', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Current Session ID', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('None', { exact: true })).toBeInTheDocument();
  });
});
