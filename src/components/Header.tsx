import { Navigation } from './Navigation';

export function Header() {
  return (
    <header style={{
      padding: 'var(--spacing-medium)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div>
        <strong>AI Vocal Coach</strong>
      </div>
      <Navigation />
    </header>
  );
}
