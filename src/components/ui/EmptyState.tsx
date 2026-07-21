interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div style={{
      padding: 'var(--spacing-large)',
      borderRadius: 'var(--radius-large)',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      color: 'var(--color-text-primary)',
      textAlign: 'center',
    }}>
      <h2 style={{ margin: 0, marginBottom: 'var(--spacing-small)' }}>{title}</h2>
      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{description}</p>
    </div>
  );
}
