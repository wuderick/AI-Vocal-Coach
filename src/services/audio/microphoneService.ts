export type MicrophonePermission = 'unsupported' | 'prompt' | 'granted' | 'denied';

export function isSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as unknown as { mediaDevices?: { getUserMedia?: unknown } };
  return !!nav.mediaDevices && typeof (nav.mediaDevices as { getUserMedia?: unknown }).getUserMedia === 'function';
}

export async function getPermissionStatus(): Promise<MicrophonePermission> {
  if (!isSupported()) return 'unsupported';

  const perms = (navigator as unknown as { permissions?: { query?: (opts: unknown) => Promise<unknown> } }).permissions;
  if (!perms || typeof perms.query !== 'function') {
    return 'prompt';
  }

  try {
    const status = await perms.query({ name: 'microphone' } as unknown as unknown);
    const state = (status as unknown as { state?: string })?.state;
    if (state === 'granted') return 'granted';
    if (state === 'denied') return 'denied';
    return 'prompt';
  } catch {
    // If query throws, return prompt per spec
    return 'prompt';
  }
}

export async function requestPermission(): Promise<MicrophonePermission> {
  if (!isSupported()) return 'unsupported';

  try {
    const stream = await (navigator as unknown as { mediaDevices: { getUserMedia: (opts: unknown) => Promise<unknown> } }).mediaDevices.getUserMedia({ audio: true } as unknown);
    try {
      const s = stream as unknown as MediaStream;
      if (s && typeof s.getTracks === 'function') {
        s.getTracks().forEach((t) => {
          try { t.stop(); } catch { /* ignore stop errors */ }
        });
      }
    } catch {
      // ignore
    }
    return 'granted';
  } catch {
    return 'denied';
  }
}
