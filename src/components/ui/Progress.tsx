import { uiProgressBarStyles, uiProgressTrackStyles } from './uiStyles';

interface ProgressProps {
  value: number;
}

export function Progress({ value }: ProgressProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div
      style={uiProgressTrackStyles}
      role="progressbar"
      aria-label="Progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clampedValue}
    >
      <div style={{ ...uiProgressBarStyles, width: `${clampedValue}%` }} />
    </div>
  );
}
