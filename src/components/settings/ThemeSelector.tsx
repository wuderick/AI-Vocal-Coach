import { Card } from '../ui/Card';

const themeOptions = ['system', 'light', 'dark'] as const;

interface ThemeSelectorProps {
  value: typeof themeOptions[number];
  onChange: (value: typeof themeOptions[number]) => void;
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  return (
    <Card>
      <div style={{ display: 'grid', gap: 'var(--spacing-medium)' }}>
        {themeOptions.map((option) => (
          <label key={option} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-medium)' }}>
            <input
              type="radio"
              name="theme"
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              style={{ accentColor: 'var(--color-accent)' }}
            />
            <span style={{ color: 'var(--color-text-primary)' }}>{option.charAt(0).toUpperCase() + option.slice(1)}</span>
          </label>
        ))}
      </div>
    </Card>
  );
}
