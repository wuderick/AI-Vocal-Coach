export interface PitchFrame {
	readonly timestamp: number;
	readonly frequency: number | null;
	readonly confidence: number;
	readonly voiced: boolean;
}

export interface PitchHistoryBuffer {
	push(frame: PitchFrame): void;
	clear(): void;
	size(): number;
	capacity(): number;
	getLatest(): PitchFrame | null;
	getFrames(): readonly PitchFrame[];
}

const DEFAULT_CAPACITY = 300;

function validateCapacity(value: number): number {
	if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
		throw new RangeError(`Pitch history buffer capacity must be a finite positive integer. Received: ${value}`);
	}

	return value;
}

export function createPitchHistoryBuffer(capacity: number = DEFAULT_CAPACITY): PitchHistoryBuffer {
	const resolvedCapacity = validateCapacity(capacity);
	const storage: Array<PitchFrame | null> = new Array(resolvedCapacity).fill(null);
	let writeIndex = 0;
	let count = 0;

	return {
		push(frame: PitchFrame): void {
			storage[writeIndex] = frame;
			writeIndex = (writeIndex + 1) % resolvedCapacity;
			if (count < resolvedCapacity) {
				count += 1;
			}
		},

		clear(): void {
			writeIndex = 0;
			count = 0;
		},

		size(): number {
			return count;
		},

		capacity(): number {
			return resolvedCapacity;
		},

		getLatest(): PitchFrame | null {
			if (count === 0) {
				return null;
			}

			const latestIndex = (writeIndex - 1 + resolvedCapacity) % resolvedCapacity;
			return storage[latestIndex];
		},

		getFrames(): readonly PitchFrame[] {
			if (count === 0) {
				return [];
			}

			const oldestIndex = count === resolvedCapacity ? writeIndex : 0;
			const frames = new Array<PitchFrame>(count);

			for (let offset = 0; offset < count; offset += 1) {
				const index = (oldestIndex + offset) % resolvedCapacity;
				frames[offset] = storage[index] as PitchFrame;
			}

			return frames;
		},
	};
}
