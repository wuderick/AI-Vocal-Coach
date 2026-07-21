import { InputHTMLAttributes } from 'react';
import { uiInputStyles, uiLabelStyles } from './uiStyles';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, id, disabled, ...rest }: InputProps) {
  const inputId = id ?? `input-${Math.random().toString(16).slice(2)}`;

  return (
    <label htmlFor={inputId} style={{ display: 'block', width: '100%' }}>
      {label ? <span style={uiLabelStyles}>{label}</span> : null}
      <input id={inputId} disabled={disabled} style={{ ...uiInputStyles, opacity: disabled ? 0.6 : 1 }} {...rest} />
    </label>
  );
}
