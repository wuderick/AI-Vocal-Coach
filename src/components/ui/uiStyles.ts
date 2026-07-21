import { CSSProperties } from 'react';

export const uiSurfaceStyles: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-large)',
  color: 'var(--color-text-primary)',
};

export const uiCardStyles: CSSProperties = {
  ...uiSurfaceStyles,
  padding: 'var(--spacing-large)',
  boxShadow: 'var(--shadow-card)',
};

export const uiContainerStyles: CSSProperties = {
  width: '100%',
  maxWidth: '1200px',
  margin: '0 auto',
  padding: 'var(--spacing-medium)',
};

export const uiSectionStyles: CSSProperties = {
  ...uiSurfaceStyles,
  padding: 'var(--spacing-large)',
  marginBottom: 'var(--spacing-large)',
};

export const uiInputStyles: CSSProperties = {
  width: '100%',
  padding: 'var(--spacing-small)',
  borderRadius: 'var(--radius-small)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-background-alt)',
  color: 'var(--color-text-primary)',
  fontFamily: 'inherit',
  fontSize: 'var(--font-size-base)',
};

export const uiLabelStyles: CSSProperties = {
  display: 'block',
  marginBottom: 'var(--spacing-xsmall)',
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--font-size-small)',
};

export const uiButtonStyles: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--spacing-small)',
  padding: 'var(--spacing-small) var(--spacing-large)',
  borderRadius: 'var(--radius-medium)',
  border: '1px solid transparent',
  fontFamily: 'inherit',
  fontWeight: 'var(--font-weight-bold)',
  fontSize: 'var(--font-size-base)',
  transition: 'var(--transition-fast)',
};

export const uiButtonContentStyles: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--spacing-small)',
};

export const uiSectionHeaderStyles: CSSProperties = {
  marginBottom: 'var(--spacing-medium)',
};

export const uiSectionTitleStyles: CSSProperties = {
  margin: 0,
  color: 'var(--color-text-primary)',
};

export const uiSectionSubtitleStyles: CSSProperties = {
  margin: 0,
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--font-size-small)',
};

export const uiBadgeBaseStyles: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.25rem 0.75rem',
  borderRadius: '999px',
  fontSize: '0.85rem',
  fontWeight: 'var(--font-weight-bold)',
  border: '1px solid transparent',
};

export const uiVariantStyles = {
  primary: {
    background: 'var(--color-accent)',
    color: 'var(--color-background)',
    borderColor: 'transparent',
  },
  secondary: {
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    borderColor: 'var(--color-border)',
  },
  danger: {
    background: 'var(--color-danger)',
    color: 'var(--color-background)',
    borderColor: 'transparent',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-primary)',
    borderColor: 'transparent',
  },
};

export const uiBadgeVariantStyles = {
  success: {
    background: 'var(--color-success)',
    color: 'var(--color-background)',
    borderColor: 'transparent',
  },
  warning: {
    background: 'var(--color-warning)',
    color: 'var(--color-background)',
    borderColor: 'transparent',
  },
  error: {
    background: 'var(--color-error)',
    color: 'var(--color-background)',
    borderColor: 'transparent',
  },
  info: {
    background: 'var(--color-info)',
    color: 'var(--color-background)',
    borderColor: 'transparent',
  },
};
