import { Card } from '../ui/Card';

interface DeveloperPanelProps {
  theme: string;
  recordingState: string;
  microphonePermission: string;
  analysisStatus: string;
  currentRecordingId: string | null;
}

export function DeveloperPanel({ theme, recordingState, microphonePermission, analysisStatus, currentRecordingId }: DeveloperPanelProps) {
  return (
    <Card title="State Overview">
      <dl style={{ display: 'grid', gap: 'var(--spacing-small)', margin: 0 }}>
        <div>
          <dt style={{ fontWeight: 700 }}>Theme</dt>
          <dd style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{theme}</dd>
        </div>
        <div>
          <dt style={{ fontWeight: 700 }}>Recording State</dt>
          <dd style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{recordingState}</dd>
        </div>
        <div>
          <dt style={{ fontWeight: 700 }}>Microphone Permission</dt>
          <dd style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{microphonePermission}</dd>
        </div>
        <div>
          <dt style={{ fontWeight: 700 }}>Analysis Status</dt>
          <dd style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{analysisStatus}</dd>
        </div>
        <div>
          <dt style={{ fontWeight: 700 }}>Current Session ID</dt>
          <dd style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{currentRecordingId ?? 'None'}</dd>
        </div>
      </dl>
    </Card>
  );
}
