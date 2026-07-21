import { render, screen } from '@testing-library/react';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';
import { EmptyState } from './EmptyState';

describe('Button', () => {
  it.each([
    ['primary', 'var(--color-accent)'],
    ['secondary', 'var(--color-surface)'],
    ['danger', 'var(--color-danger)'],
    ['ghost', 'transparent'],
  ] as const)("renders %s variant", (variant, expectedBackground) => {
    render(<Button variant={variant}>{variant}</Button>);

    const button = screen.getByRole('button', { name: variant });

    expect(button).toBeInTheDocument();
    expect(button).toHaveStyle({ background: expectedBackground });
  });

  it('renders disabled state', () => {
    render(
      <Button disabled>
        Disabled
      </Button>,
    );

    expect(screen.getByRole('button', { name: /disabled/i })).toBeDisabled();
  });

  it('renders loading state', () => {
    render(
      <Button loading>
        Loading
      </Button>,
    );

    const button = screen.getByRole('button', { name: /loading\.\.\./i });

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/loading/i);
  });
});

describe('Input', () => {
  it('renders with label and disabled state', () => {
    render(<Input label="Name" placeholder="Enter your name" disabled />);

    const input = screen.getByLabelText('Name') as HTMLInputElement;

    expect(input).toBeInTheDocument();
    expect(input).toBeDisabled();
    expect(input.placeholder).toBe('Enter your name');
  });
});

describe('Badge', () => {
  it.each([
    ['success', 'var(--color-success)'],
    ['warning', 'var(--color-warning)'],
    ['error', 'var(--color-error)'],
    ['info', 'var(--color-info)'],
  ] as const)("renders %s variant", (variant, expectedBackground) => {
    render(<Badge variant={variant}>{variant}</Badge>);

    const badge = screen.getByText(variant);

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ background: expectedBackground });
  });
});

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No data" description="Please add an item." />);

    expect(screen.getByRole('heading', { level: 2, name: /no data/i })).toBeInTheDocument();
    expect(screen.getByText(/please add an item\./i)).toBeInTheDocument();
  });
});
