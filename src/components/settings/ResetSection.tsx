import { Button } from '../ui/Button';

interface ResetSectionProps {
  onReset: () => void;
}

export function ResetSection({ onReset }: ResetSectionProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--spacing-small)' }}>
      <Button variant="secondary" onClick={onReset}>
        Reset Settings
      </Button>
    </div>
  );
}
