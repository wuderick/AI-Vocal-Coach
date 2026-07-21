import { Navigation } from './Navigation';

export function Header() {
  return (
    <header style={{
      padding: '1rem',
      borderBottom: '1px solid #ddd',
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
