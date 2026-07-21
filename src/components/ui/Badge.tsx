import { CSSProperties } from 'react';
import { uiBadgeBaseStyles, uiBadgeVariantStyles } from './uiStyles';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'info', children }: React.PropsWithChildren<BadgeProps>) {
  const variantStyles: CSSProperties = uiBadgeVariantStyles[variant];

  return (
    <span style={{ ...uiBadgeBaseStyles, ...variantStyles }}>
      {children}
    </span>
  );
}
