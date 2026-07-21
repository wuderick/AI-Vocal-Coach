import { useId, useState } from 'react';
import { uiTooltipStyles } from './uiStyles';

interface TooltipProps {
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

export function Tooltip({ content, placement = 'top', children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  const tooltipPosition = {
    position: 'absolute' as const,
    top: placement === 'bottom' ? '100%' : undefined,
    bottom: placement === 'top' ? '100%' : undefined,
    left: placement === 'right' ? '100%' : 'auto',
    right: placement === 'left' ? '100%' : 'auto',
    marginTop: placement === 'bottom' ? 'var(--spacing-xsmall)' : undefined,
    marginBottom: placement === 'top' ? 'var(--spacing-xsmall)' : undefined,
    marginLeft: placement === 'right' ? 'var(--spacing-xsmall)' : undefined,
    marginRight: placement === 'left' ? 'var(--spacing-xsmall)' : undefined,
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <div
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        tabIndex={0}
        aria-describedby={tooltipId}
        style={{ display: 'inline-flex' }}
      >
        {children}
      </div>
      {visible && (
        <div id={tooltipId} style={{ ...uiTooltipStyles, ...tooltipPosition }} role="tooltip">
          {content}
        </div>
      )}
    </div>
  );
}
