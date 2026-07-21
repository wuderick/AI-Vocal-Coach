import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AppStateProvider } from '../state/AppStateProvider';
import { useMicrophonePermission } from './useMicrophonePermission';

function TestComp() {
  const { permission, refreshPermission, requestPermission, isRequesting } = useMicrophonePermission();
  return (
    <div>
      <div data-testid="perm">{permission}</div>
      <div data-testid="busy">{String(isRequesting)}</div>
      <button onClick={() => refreshPermission()} data-testid="refresh">refresh</button>
      <button onClick={() => requestPermission()} data-testid="request">request</button>
    </div>
  );
}

describe('useMicrophonePermission', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'navigator');
  });

  it('refreshPermission updates permission from permissions.query', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ state: 'granted' });
    Object.defineProperty(globalThis, 'navigator', { value: { mediaDevices: { getUserMedia: vi.fn() }, permissions: { query: mockQuery } }, configurable: true });

    const wrapper = ({ children }: { children: React.ReactNode }) => <AppStateProvider>{children}</AppStateProvider>;
    render(<TestComp />, { wrapper });

    await waitFor(() => expect(screen.getByTestId('perm').textContent).toBe('granted'));
  });

  it('requestPermission toggles isRequesting and updates permission to granted on success', async () => {
    // controlled promise for getUserMedia
    let resolveStream: (s: unknown) => void;
    const streamPromise = new Promise<unknown>((res) => { resolveStream = res; });
    const stop1 = vi.fn(() => { throw new Error('boom'); });
    const stop2 = vi.fn();
    const mockStream = { getTracks: () => [{ stop: stop1 }, { stop: stop2 }] } as unknown as MediaStream;

    const getUserMedia = vi.fn().mockReturnValue(streamPromise);
    Object.defineProperty(globalThis, 'navigator', { value: { mediaDevices: { getUserMedia } }, configurable: true });

    const wrapper = ({ children }: { children: React.ReactNode }) => <AppStateProvider>{children}</AppStateProvider>;
    render(<TestComp />, { wrapper });

    // click request -> isRequesting should become true
    fireEvent.click(screen.getByTestId('request'));
    await waitFor(() => expect(screen.getByTestId('busy').textContent).toBe('true'));

    // resolve stream
    resolveStream!(mockStream);

    await waitFor(() => expect(screen.getByTestId('perm').textContent).toBe('granted'));
    expect(stop1).toHaveBeenCalled();
    expect(stop2).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('busy').textContent).toBe('false'));
  });

  it('requestPermission updates permission to denied on failure', async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new Error('nope'));
    Object.defineProperty(globalThis, 'navigator', { value: { mediaDevices: { getUserMedia } }, configurable: true });

    const wrapper = ({ children }: { children: React.ReactNode }) => <AppStateProvider>{children}</AppStateProvider>;
    render(<TestComp />, { wrapper });

    fireEvent.click(screen.getByTestId('request'));

    await waitFor(() => expect(screen.getByTestId('perm').textContent).toBe('denied'));
  });
});
