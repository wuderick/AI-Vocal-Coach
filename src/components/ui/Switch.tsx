import { useCallback } from 'react';
import { uiSwitchStyles, uiSwitchThumbStyles } from './uiStyles';

interface SwitchProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function Switch({ checked, disabled, onChange }: SwitchProps) {
  const toggle = useCallback(() => {
    if (!disabled) {
      onChange(!checked);
    }
  }, [checked, disabled, onChange]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={toggle}
      onKeyDown={(event) => {
        if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
          event.preventDefault();
          onChange(!checked);
        }
      }}
      style={{
        ...uiSwitchStyles,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        justifyContent: checked ? 'flex-end' : 'flex-start',
      }}
    >
      <span style={{
        ...uiSwitchThumbStyles,
        transform: checked ? 'translateX(1.25rem)' : 'translateX(0)',
      }} />
    </button>
  );
}
