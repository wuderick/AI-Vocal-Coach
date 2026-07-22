import { Card } from '../ui/Card';
import { useAudioDevices } from '../../hooks/useAudioDevices';
import { Button } from '../ui/Button';
import { useAudioCapture } from '../../hooks/useAudioCapture';

function getCaptureStatusLabel(status: 'idle' | 'starting' | 'active' | 'stopping' | 'error'): string {
  if (status === 'idle') return '未啟動';
  if (status === 'starting') return '啟動中';
  if (status === 'active') return '啟動中（收音中）';
  if (status === 'stopping') return '停止中';
  return '錯誤';
}

export function AudioDeviceCard() {
  const { audioInputDevices, selectedAudioInputId, isDeviceSelectionDisabled, selectAudioDevice, refreshAudioDevices } = useAudioDevices();
  const {
    captureStatus,
    captureErrorMessage,
    startAudioCapture,
    stopAudioCapture,
    startFrequencyUpdateScheduler,
    stopFrequencyUpdateScheduler,
  } = useAudioCapture();
  const isStartDisabled = captureStatus === 'starting' || captureStatus === 'stopping' || captureStatus === 'active';
  const isStopDisabled = captureStatus === 'starting' || captureStatus === 'stopping' || captureStatus === 'idle' || captureStatus === 'error';

  return (
    <Card title="Audio Input Device">
      <div style={{ display: 'grid', gap: 'var(--spacing-medium)' }}>
        <div style={{ display: 'grid', gap: 'var(--spacing-small)' }}>
          <strong>Capture 狀態：{getCaptureStatusLabel(captureStatus)}</strong>
          <div style={{ display: 'flex', gap: 'var(--spacing-small)' }}>
            <Button disabled={isStartDisabled} onClick={() => void (async () => {
              await startAudioCapture();
              startFrequencyUpdateScheduler();
            })()}>Start</Button>
            <Button disabled={isStopDisabled} onClick={() => void (async () => {
              stopFrequencyUpdateScheduler();
              await stopAudioCapture();
            })()}>Stop</Button>
          </div>
          {captureErrorMessage ? <p role="alert">{captureErrorMessage}</p> : null}
        </div>
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
              disabled={isDeviceSelectionDisabled}
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
