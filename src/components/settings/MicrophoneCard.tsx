import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useMicrophonePermission } from '../../hooks/useMicrophonePermission';

export function MicrophoneCard() {
  const { permission, requestPermission, isRequesting } = useMicrophonePermission();

  const statusLabel = permission;
  const buttonDisabled = isRequesting || permission === 'granted' || permission === 'unsupported';

  return (
    <Card title="Microphone">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div>Microphone permission status</div>
          <Badge>{statusLabel}</Badge>
        </div>
        <div>
          <Button disabled={buttonDisabled} onClick={() => requestPermission()}>
            Request Permission
          </Button>
        </div>
      </div>
    </Card>
  );
}
