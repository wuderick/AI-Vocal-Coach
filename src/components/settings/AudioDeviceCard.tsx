import { Card } from '../ui/Card';
import { useAudioDevices } from '../../hooks/useAudioDevices';
import { Button } from '../ui/Button';

export function AudioDeviceCard() {
  const { audioInputDevices, selectedAudioInputId, selectAudioDevice, refreshAudioDevices } = useAudioDevices();

  return (
    <Card title="Audio Input Device">
      <div style={{ display: 'grid', gap: 'var(--spacing-medium)' }}>
        {audioInputDevices.length === 0 ? (
          <p>No audio input devices found.</p>
        ) : audioInputDevices.length === 1 ? (
          <p>{audioInputDevices[0].label}</p>
        ) : (
          <label style={{ display: 'grid', gap: 'var(--spacing-small)' }}>
            <span>Selected device</span>
            <select
              value={selectedAudioInputId ?? ''}
              onChange={(event) => selectAudioDevice(event.target.value)}
              style={{ width: '100%', padding: 'var(--spacing-xsmall)' }}
            >
              {audioInputDevices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <Button onClick={refreshAudioDevices}>Refresh Devices</Button>
      </div>
    </Card>
  );
}
