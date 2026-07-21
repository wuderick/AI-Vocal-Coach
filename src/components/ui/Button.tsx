import { ButtonHTMLAttributes } from 'react';
import { uiButtonStyles, uiButtonContentStyles, uiVariantStyles } from './uiStyles';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export function Button({ variant = 'primary', loading, disabled, children, ...rest }: ButtonProps) {
  const variantStyles = uiVariantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      style={{
        ...uiButtonStyles,
        ...variantStyles,
        opacity: isDisabled ? 0.6 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
      }}
      {...rest}
    >
      <span style={uiButtonContentStyles}>
        {loading ? 'Loading...' : children}
      </span>
    </button>
  );
}
