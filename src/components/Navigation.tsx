import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

const linkStyles = {
  textDecoration: 'none',
  color: 'var(--color-text-primary)',
};

export function Navigation() {
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const breakpoint = getComputedStyle(document.documentElement)
      .getPropertyValue('--breakpoint-mobile')
      .trim();

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint})`);
    const update = () => setIsMobile(mediaQuery.matches);

    update();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update);
    } else {
      mediaQuery.addListener(update);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', update);
      } else {
        mediaQuery.removeListener(update);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setOpen(false);
    }
  }, [isMobile]);

  const navStyle = {
    display: isMobile ? (open ? 'flex' : 'none') : 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: 'var(--spacing-small)',
    position: isMobile ? 'absolute' : 'static',
    right: isMobile ? 'var(--page-padding)' : undefined,
    top: isMobile ? '100%' : undefined,
    background: isMobile ? 'var(--color-surface)' : undefined,
    border: isMobile ? '1px solid var(--color-border)' : undefined,
    borderRadius: isMobile ? 'var(--radius-medium)' : undefined,
    padding: isMobile ? 'var(--spacing-medium)' : undefined,
    zIndex: isMobile ? 10 : undefined,
    minWidth: isMobile ? '12rem' : undefined,
  } as const;

  const buttonStyle = {
    display: isMobile ? 'inline-flex' : 'none',
    background: 'transparent',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-medium)',
    color: 'var(--color-text-primary)',
    padding: 'var(--spacing-small)',
    cursor: 'pointer',
  } as const;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-medium)', position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={buttonStyle}
        aria-expanded={open}
        aria-label="Toggle navigation"
      >
        Menu
      </button>
      <nav aria-label="Primary navigation" style={navStyle}>
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
    </div>
  );
}
