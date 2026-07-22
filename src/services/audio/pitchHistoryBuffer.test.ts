import { describe, expect, it } from 'vitest';
import { createPitchHistoryBuffer, type PitchFrame } from './pitchHistoryBuffer';

describe('pitchHistoryBuffer', () => {
  it('uses a default capacity of 300', () => {
    const buffer = createPitchHistoryBuffer();

    expect(buffer.capacity()).toBe(300);
  });

  it('accepts a valid custom capacity', () => {
    const buffer = createPitchHistoryBuffer(12);

    expect(buffer.capacity()).toBe(12);
  });

  it('rejects zero capacity', () => {
    expect(() => createPitchHistoryBuffer(0)).toThrowError(RangeError);
  });

  it('rejects negative capacity', () => {
    expect(() => createPitchHistoryBuffer(-1)).toThrowError(RangeError);
  });

  it('rejects non-integer capacity', () => {
    expect(() => createPitchHistoryBuffer(1.5)).toThrowError(RangeError);
  });

  it('rejects Infinity capacity', () => {
    expect(() => createPitchHistoryBuffer(Number.POSITIVE_INFINITY)).toThrowError(RangeError);
  });

  it('rejects NaN capacity', () => {
    expect(() => createPitchHistoryBuffer(Number.NaN)).toThrowError(RangeError);
  });

  it('starts empty', () => {
    const buffer = createPitchHistoryBuffer(3);

    expect(buffer.size()).toBe(0);
    expect(buffer.getLatest()).toBeNull();
    expect(buffer.getFrames()).toEqual([]);
  });

  it('push stores frames and updates size', () => {
    const buffer = createPitchHistoryBuffer(3);
    const frameA: PitchFrame = { timestamp: 1, frequency: 220, confidence: 0.9, voiced: true };
    const frameB: PitchFrame = { timestamp: 2, frequency: 221, confidence: 0.8, voiced: true };

    buffer.push(frameA);
    expect(buffer.size()).toBe(1);

    buffer.push(frameB);
    expect(buffer.size()).toBe(2);
  });

  it('getLatest returns the newest frame', () => {
    const buffer = createPitchHistoryBuffer(3);
    const newest: PitchFrame = { timestamp: 2, frequency: 441, confidence: 0.95, voiced: true };

    buffer.push({ timestamp: 1, frequency: 440, confidence: 0.9, voiced: true });
    buffer.push(newest);

    expect(buffer.getLatest()).toBe(newest);
  });

  it('getFrames returns chronological order before reaching capacity', () => {
    const buffer = createPitchHistoryBuffer(4);

    buffer.push({ timestamp: 1, frequency: 200, confidence: 0.7, voiced: true });
    buffer.push({ timestamp: 2, frequency: 201, confidence: 0.71, voiced: true });
    buffer.push({ timestamp: 3, frequency: null, confidence: 0, voiced: false });

    expect(buffer.getFrames().map((frame) => frame.timestamp)).toEqual([1, 2, 3]);
  });

  it('overwrites oldest frame beyond capacity and preserves chronological order', () => {
    const buffer = createPitchHistoryBuffer(3);

    buffer.push({ timestamp: 1, frequency: 100, confidence: 0.8, voiced: true });
    buffer.push({ timestamp: 2, frequency: 101, confidence: 0.8, voiced: true });
    buffer.push({ timestamp: 3, frequency: 102, confidence: 0.8, voiced: true });
    buffer.push({ timestamp: 4, frequency: 103, confidence: 0.8, voiced: true });

    expect(buffer.getFrames().map((frame) => frame.timestamp)).toEqual([2, 3, 4]);
    expect(buffer.getLatest()?.timestamp).toBe(4);
    expect(buffer.size()).toBe(3);
  });

  it('clear resets state and supports reuse', () => {
    const buffer = createPitchHistoryBuffer(3);

    buffer.push({ timestamp: 1, frequency: 300, confidence: 0.9, voiced: true });
    buffer.push({ timestamp: 2, frequency: 301, confidence: 0.9, voiced: true });

    buffer.clear();

    expect(buffer.size()).toBe(0);
    expect(buffer.getLatest()).toBeNull();
    expect(buffer.getFrames()).toEqual([]);

    buffer.push({ timestamp: 3, frequency: 302, confidence: 0.9, voiced: true });
    buffer.push({ timestamp: 4, frequency: null, confidence: 0, voiced: false });

    expect(buffer.size()).toBe(2);
    expect(buffer.getFrames().map((frame) => frame.timestamp)).toEqual([3, 4]);
    expect(buffer.getLatest()?.timestamp).toBe(4);
  });

  it('does not mutate provided PitchFrame objects', () => {
    const buffer = createPitchHistoryBuffer(3);
    const frame: PitchFrame = {
      timestamp: 10,
      frequency: 440,
      confidence: 0.88,
      voiced: true,
    };
    const original = { ...frame };

    buffer.push(frame);

    expect(frame).toEqual(original);
  });
});
