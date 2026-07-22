import { usePitchDebug } from '../../hooks/usePitchDebug';

export function DebugPanel() {
  const pitch = usePitchDebug();

  if (!pitch.isVoiced) {
    return (
      <section>
        <p>Waiting for voice...</p>
      </section>
    );
  }

  const frequency = pitch.frequency !== null ? `${pitch.frequency.toFixed(2)} Hz` : '---';
  const note = pitch.note ?? '---';
  const midi = pitch.midi !== null ? String(pitch.midi) : '---';
  const cents = pitch.cents !== null
    ? `${pitch.cents >= 0 ? '+' : ''}${pitch.cents.toFixed(1)} cents`
    : '---';
  const confidence = `${Math.round(Math.max(0, Math.min(1, pitch.confidence)) * 100)}%`;

  return (
    <section>
      <h2>Developer Debug</h2>
      <p>Frequency: {frequency}</p>
      <p>Note: {note}</p>
      <p>MIDI: {midi}</p>
      <p>Cents: {cents}</p>
      <p>Confidence: {confidence}</p>
    </section>
  );
}
