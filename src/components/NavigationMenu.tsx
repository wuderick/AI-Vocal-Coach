import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const linkStyles = {
  textDecoration: 'none',
  color: 'var(--color-text-primary)',
};

export function NavigationMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-medium)' }}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={{
          display: 'none',
          background: 'transparent',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-medium)',
          color: 'var(--color-text-primary)',
          padding: 'var(--spacing-small)',
          cursor: 'pointer',
        }}
        aria-expanded={open}
        aria-label="Toggle navigation"
      >
        Menu
      </button>
      <nav
        aria-label="Primary navigation"
        style={{
          display: 'flex',
          gap: 'var(--spacing-medium)',
        }}
      >
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
      <style>{`
        @media (max-width: var(--breakpoint-mobile)) {
          button {
            display: inline-flex;
          }
          nav {
            display: ${open ? 'flex' : 'none'};
            flex-direction: column;
            background: var(--color-surface);
            position: absolute;
            top: calc(var(--header-padding) + 3rem);
            right: var(--page-padding);
            padding: var(--spacing-medium);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-medium);
          }
        }
      `}</style>
    </div>
  );
}
