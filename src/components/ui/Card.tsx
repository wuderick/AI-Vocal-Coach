import { PropsWithChildren } from 'react';
import { uiCardStyles } from './uiStyles';

interface CardProps {
  title?: string;
}

export function Card({ title, children }: PropsWithChildren<CardProps>) {
  return (
    <section style={uiCardStyles}>
      {title ? <h2 style={{ marginTop: 0, marginBottom: 'var(--spacing-medium)' }}>{title}</h2> : null}
      {children}
    </section>
  );
}
