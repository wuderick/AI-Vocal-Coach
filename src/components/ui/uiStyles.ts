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
  maxWidth: 'var(--container-max-width)',
  margin: '0 auto',
  padding: 'var(--page-padding)',
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

export const uiModalOverlayStyles: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(7, 17, 31, 0.65)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--page-padding)',
  zIndex: 1000,
};

export const uiModalStyles: CSSProperties = {
  width: '100%',
  maxWidth: '40rem',
  background: 'var(--color-background-alt)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-large)',
  boxShadow: 'var(--shadow-popup)',
  padding: 'var(--spacing-large)',
  color: 'var(--color-text-primary)',
};

export const uiModalTitleStyles: CSSProperties = {
  margin: 0,
  marginBottom: 'var(--spacing-medium)',
  fontSize: '1.25rem',
};

export const uiModalCloseButtonStyles: CSSProperties = {
  position: 'absolute',
  top: 'var(--spacing-medium)',
  right: 'var(--spacing-medium)',
  background: 'transparent',
  border: 'none',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  fontSize: '1rem',
};

export const uiDialogActionsStyles: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--spacing-small)',
  marginTop: 'var(--spacing-large)',
};

export const uiDropdownStyles: CSSProperties = {
  position: 'relative',
  display: 'inline-block',
  width: '100%',
};

export const uiDropdownButtonStyles: CSSProperties = {
  ...uiButtonStyles,
  width: '100%',
  justifyContent: 'space-between',
};

export const uiDropdownMenuStyles: CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-medium)',
  marginTop: 'var(--spacing-xsmall)',
  zIndex: 100,
  maxHeight: '16rem',
  overflowY: 'auto',
};

export const uiDropdownItemStyles: CSSProperties = {
  padding: 'var(--spacing-small)',
  cursor: 'pointer',
  color: 'var(--color-text-primary)',
  background: 'transparent',
  border: 'none',
  textAlign: 'left',
  width: '100%',
};

export const uiTabsListStyles: CSSProperties = {
  display: 'flex',
  gap: 'var(--spacing-small)',
  borderBottom: '1px solid var(--color-border)',
  marginBottom: 'var(--spacing-medium)',
};

export const uiTabStyles: CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  padding: 'var(--spacing-small) var(--spacing-medium)',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
};

export const uiTabActiveStyles: CSSProperties = {
  color: 'var(--color-text-primary)',
  borderBottom: '2px solid var(--color-accent)',
};

export const uiTabPanelStyles: CSSProperties = {
  outline: 'none',
};

export const uiProgressTrackStyles: CSSProperties = {
  width: '100%',
  height: '0.75rem',
  borderRadius: 'var(--radius-medium)',
  background: 'var(--color-surface)',
  overflow: 'hidden',
};

export const uiProgressBarStyles: CSSProperties = {
  height: '100%',
  background: 'var(--color-accent)',
  transition: 'width var(--transition-normal)',
};

export const uiSwitchStyles: CSSProperties = {
  position: 'relative',
  width: '3rem',
  height: '1.75rem',
  flexShrink: 0,
  padding: 0,
  border: '1px solid var(--color-border)',
  borderRadius: '999px',
  background: 'var(--color-surface)',
  overflow: 'hidden',
};

export const uiSwitchThumbStyles: CSSProperties = {
  position: 'absolute',
  top: '0.25rem',
  width: '1.25rem',
  height: '1.25rem',
  borderRadius: '50%',
  background: 'var(--color-text-primary)',
  transition: 'left 160ms ease',
  pointerEvents: 'none',
};

export const uiSkeletonStyles: CSSProperties = {
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius-small)',
  animation: 'pulse 1.5s ease-in-out infinite',
};

export const uiTooltipStyles: CSSProperties = {
  position: 'absolute',
  background: 'var(--color-background-alt)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-medium)',
  padding: 'var(--spacing-small)',
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
  zIndex: 200,
};