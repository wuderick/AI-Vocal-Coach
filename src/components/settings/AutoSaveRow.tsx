import { Switch } from '../ui/Switch';
import { Card } from '../ui/Card';

interface AutoSaveRowProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function AutoSaveRow({ enabled, onToggle }: AutoSaveRowProps) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-medium)' }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700 }}>Auto Save Recording</p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Toggle automatic recording persistence.</p>
        </div>
        <Switch checked={enabled} onChange={onToggle} />
      </div>
    </Card>
  );
}
