import { Navigation } from './Navigation';

export function Header() {
  return (
    <header style={{
      padding: 'var(--header-padding)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
    }}>
      <div>
        <strong>AI Vocal Coach</strong>
      </div>
      <Navigation />
    </header>
  );
}
