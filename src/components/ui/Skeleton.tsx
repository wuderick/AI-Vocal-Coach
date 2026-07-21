import { CSSProperties } from 'react';
import { uiSkeletonStyles } from './uiStyles';

interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: boolean;
}

export function Skeleton({ width = '100%', height = '1rem', rounded }: SkeletonProps) {
  const styles: CSSProperties = {
    ...uiSkeletonStyles,
    width,
    height,
    borderRadius: rounded ? 'var(--radius-large)' : 'var(--radius-small)',
  };

  return <div style={styles} aria-hidden="true" />;
}
