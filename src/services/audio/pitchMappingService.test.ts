import { describe, expect, it } from 'vitest';
import { mapFrequencyToPitch } from './pitchMappingService';

describe('pitchMappingService', () => {
  it('maps 27.50 Hz to A0', () => {
    expect(mapFrequencyToPitch(27.5)).toMatchObject({
      midi: 21,
      note: 'A',
      octave: 0,
    });
  });

  it('maps 55.00 Hz to A1', () => {
    expect(mapFrequencyToPitch(55)).toMatchObject({
      midi: 33,
      note: 'A',
      octave: 1,
    });
  });

  it('maps 110.00 Hz to A2', () => {
    expect(mapFrequencyToPitch(110)).toMatchObject({
      midi: 45,
      note: 'A',
      octave: 2,
    });
  });

  it('maps 220.00 Hz to A3', () => {
    expect(mapFrequencyToPitch(220)).toMatchObject({
      midi: 57,
      note: 'A',
      octave: 3,
    });
  });

  it('maps 440.00 Hz to A4', () => {
    expect(mapFrequencyToPitch(440)).toMatchObject({
      midi: 69,
      note: 'A',
      octave: 4,
    });
  });

  it('maps 880.00 Hz to A5', () => {
    expect(mapFrequencyToPitch(880)).toMatchObject({
      midi: 81,
      note: 'A',
      octave: 5,
    });
  });

  it('maps 261.63 Hz to C4', () => {
    const result = mapFrequencyToPitch(261.63);

    expect(result).toMatchObject({
      midi: 60,
      note: 'C',
      octave: 4,
    });
    expect(result.cents).toBeCloseTo(0, 1);
  });

  it('maps 523.25 Hz to C5', () => {
    const result = mapFrequencyToPitch(523.25);

    expect(result).toMatchObject({
      midi: 72,
      note: 'C',
      octave: 5,
    });
    expect(result.cents).toBeCloseTo(0, 1);
  });

  it('maps 4186.01 Hz to C8', () => {
    const result = mapFrequencyToPitch(4186.01);

    expect(result).toMatchObject({
      midi: 108,
      note: 'C',
      octave: 8,
    });
    expect(result.cents).toBeCloseTo(0, 1);
  });

  it('maps 445 Hz to A4 with positive cents', () => {
    const result = mapFrequencyToPitch(445);

    expect(result.midi).toBe(69);
    expect(result.note).toBe('A');
    expect(result.octave).toBe(4);
    expect(result.cents).toBeGreaterThan(0);
    expect(result.cents).toBeCloseTo(19.6, 1);
  });

  it('maps 435 Hz to A4 with negative cents', () => {
    const result = mapFrequencyToPitch(435);

    expect(result.midi).toBe(69);
    expect(result.note).toBe('A');
    expect(result.octave).toBe(4);
    expect(result.cents).toBeLessThan(0);
    expect(result.cents).toBeCloseTo(-19.8, 1);
  });

  it('rejects NaN', () => {
    expect(() => mapFrequencyToPitch(Number.NaN)).toThrowError('frequency must be a positive finite number.');
  });

  it('rejects Infinity', () => {
    expect(() => mapFrequencyToPitch(Number.POSITIVE_INFINITY)).toThrowError('frequency must be a positive finite number.');
  });

  it('rejects 0', () => {
    expect(() => mapFrequencyToPitch(0)).toThrowError('frequency must be a positive finite number.');
  });

  it('rejects negative values', () => {
    expect(() => mapFrequencyToPitch(-1)).toThrowError('frequency must be a positive finite number.');
  });
});
