export interface PitchMappingResult {
  readonly midi: number;
  readonly note: string;
  readonly octave: number;
  readonly cents: number;
  readonly referenceFrequency: number;
}

const A4_FREQUENCY = 440;
const A4_MIDI = 69;
const SEMITONES_PER_OCTAVE = 12;
const CENTS_PER_OCTAVE = 1200;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

function validateFrequency(frequency: number): void {
  if (!Number.isFinite(frequency) || frequency <= 0) {
    throw new Error('frequency must be a positive finite number.');
  }
}

function frequencyToMidi(frequency: number): number {
  return A4_MIDI + (SEMITONES_PER_OCTAVE * Math.log2(frequency / A4_FREQUENCY));
}

function nearestMidi(midiFloat: number): number {
  return Math.round(midiFloat);
}

function midiToNote(midi: number): string {
  return NOTE_NAMES[((midi % SEMITONES_PER_OCTAVE) + SEMITONES_PER_OCTAVE) % SEMITONES_PER_OCTAVE];
}

function midiToOctave(midi: number): number {
  return Math.floor(midi / SEMITONES_PER_OCTAVE) - 1;
}

function midiToReferenceFrequency(midi: number): number {
  return A4_FREQUENCY * (2 ** ((midi - A4_MIDI) / SEMITONES_PER_OCTAVE));
}

function frequencyToCentOffset(frequency: number, referenceFrequency: number): number {
  return CENTS_PER_OCTAVE * Math.log2(frequency / referenceFrequency);
}

export function mapFrequencyToPitch(frequency: number): PitchMappingResult {
  validateFrequency(frequency);

  const midiFloat = frequencyToMidi(frequency);
  const midi = nearestMidi(midiFloat);
  const referenceFrequency = midiToReferenceFrequency(midi);

  return {
    midi,
    note: midiToNote(midi),
    octave: midiToOctave(midi),
    cents: frequencyToCentOffset(frequency, referenceFrequency),
    referenceFrequency,
  };
}
