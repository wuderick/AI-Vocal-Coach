import { NavLink } from 'react-router-dom';

const linkStyles = {
  textDecoration: 'none',
  color: 'var(--color-text-primary)',
};

export function Navigation() {
  return (
    <nav aria-label="Primary navigation" style={{ display: 'flex', gap: 'var(--spacing-medium)' }}>
      <NavLink to="/" style={linkStyles} end>
        Home
      </NavLink>
      <NavLink to="/dashboard" style={linkStyles}>
        Dashboard
      </NavLink>
      <NavLink to="/settings" style={linkStyles}>
        Settings
      </NavLink>
    </nav>
  );
}
