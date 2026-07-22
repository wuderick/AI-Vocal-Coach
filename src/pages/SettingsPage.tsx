import { useSettingsState } from '../state/useSettings';
import { Container } from '../components/ui/Container';
import { Section } from '../components/ui/Section';
import { ThemeSelector } from '../components/settings/ThemeSelector';
import { AutoSaveRow } from '../components/settings/AutoSaveRow';
import { DeveloperPanel } from '../components/settings/DeveloperPanel';
import { ResetSection } from '../components/settings/ResetSection';
import { MicrophoneCard } from '../components/settings/MicrophoneCard';
import { AudioDeviceCard } from '../components/settings/AudioDeviceCard';

export function SettingsPage() {
  const {
    theme,
    autoSaveRecording,
    recordingState,
    microphonePermission,
    analysisStatus,
    currentRecordingId,
    setTheme,
    setAutoSaveRecording,
    resetSettings,
  } = useSettingsState();

  return (
    <main>
      <Container>
        <h1>Settings</h1>
        <div style={{ display: 'grid', gap: 'var(--spacing-large)' }}>
          <Section title="Appearance" subtitle="Control UI theme preferences.">
            <ThemeSelector value={theme} onChange={setTheme} />
          </Section>

          <Section title="Recording" subtitle="Configure recording behavior.">
            <AutoSaveRow enabled={autoSaveRecording} onToggle={setAutoSaveRecording} />
          </Section>

          <Section title="Developer" subtitle="Inspect the current application state.">
            <div style={{ display: 'grid', gap: 'var(--spacing-medium)' }}>
              <DeveloperPanel
                theme={theme}
                recordingState={recordingState}
                microphonePermission={microphonePermission}
                analysisStatus={analysisStatus}
                currentRecordingId={currentRecordingId}
              />
              <AudioDeviceCard />
              <MicrophoneCard />
              <ResetSection onReset={resetSettings} />
            </div>
          </Section>
        </div>
      </Container>
    </main>
  );
}
