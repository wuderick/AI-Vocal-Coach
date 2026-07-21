import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { Dropdown } from './Dropdown';
import { EmptyState } from './EmptyState';
import { Input } from './Input';
import { Modal } from './Modal';
import { Progress } from './Progress';
import { Switch } from './Switch';
import { Tabs } from './Tabs';
import { Tooltip } from './Tooltip';
import { Badge } from './Badge';

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

describe('Modal', () => {
  it('does not render when closed', () => {
    render(<Modal title="Modal" open={false} onClose={() => {}}>Content</Modal>);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(<Modal title="Modal" open onClose={() => {}}>Content</Modal>);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /modal/i })).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('Escape calls onClose', () => {
    const handleClose = vi.fn();
    render(<Modal title="Modal" open onClose={handleClose}>Content</Modal>);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(handleClose).toHaveBeenCalled();
  });

  it('has dialog accessibility attributes', () => {
    render(<Modal title="Modal Title" open onClose={() => {}}>Content</Modal>);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });
});

describe('Dialog', () => {
  it('calls confirm and cancel actions', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <Dialog
        title="Confirm"
        description="Are you sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onConfirm).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });

  it('renders title and description with accessible roles', () => {
    render(
      <Dialog
        title="Confirm"
        description="Are you sure?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByRole('heading', { level: 2, name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByText(/are you sure\?/i)).toBeInTheDocument();
  });
});

describe('Dropdown', () => {
  it('renders items and selected value', () => {
    const items = ['One', 'Two'];
    render(<Dropdown items={items} selected="One" onChange={() => {}} />);

    expect(screen.getByRole('button', { name: /one/i })).toBeInTheDocument();
  });

  it('calls onChange when selecting an item', () => {
    const items = ['One', 'Two'];
    const handleChange = vi.fn();
    render(<Dropdown items={items} selected="One" onChange={handleChange} />);

    fireEvent.click(screen.getByRole('button', { name: /one/i }));
    fireEvent.click(screen.getByRole('option', { name: /two/i }));

    expect(handleChange).toHaveBeenCalledWith('Two');
  });
});

describe('Tabs', () => {
  const items = [
    { id: 'tab1', label: 'Tab 1', content: 'Content 1' },
    { id: 'tab2', label: 'Tab 2', content: 'Content 2' },
  ];

  it('renders active tab and content', () => {
    render(<Tabs items={items} defaultActiveId="tab1" />);
    expect(screen.getByRole('tab', { name: /tab 1/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/content 1/i)).toBeInTheDocument();
  });

  it('changes tab on click', () => {
    render(<Tabs items={items} defaultActiveId="tab1" />);
    fireEvent.click(screen.getByRole('tab', { name: /tab 2/i }));

    expect(screen.getByRole('tab', { name: /tab 2/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/content 2/i)).toBeInTheDocument();
  });

  it('navigates tabs with ArrowRight and ArrowLeft', () => {
    render(<Tabs items={items} defaultActiveId="tab1" />);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /tab 2/i })).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: /tab 1/i })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Progress', () => {
  it('renders value', () => {
    render(<Progress value={75} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
  });

  it('clamps values below 0', () => {
    render(<Progress value={-10} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('clamps values above 100', () => {
    render(<Progress value={150} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});

describe('Switch', () => {
  it('renders checked state and toggles on click', () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} />);

    const switchButton = screen.getByRole('switch');
    expect(switchButton).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(switchButton);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not toggle when disabled', () => {
    const onChange = vi.fn();
    render(<Switch checked={false} disabled onChange={onChange} />);

    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('toggles with keyboard interaction', () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} />);

    const switchButton = screen.getByRole('switch');
    fireEvent.keyDown(switchButton, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('Tooltip', () => {
  it('shows on hover', () => {
    render(
      <Tooltip content="Hint">
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByRole('button', { name: /hover me/i }));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('shows on keyboard focus', () => {
    render(
      <Tooltip content="Hint">
        <button type="button">Focus me</button>
      </Tooltip>,
    );

    fireEvent.focus(screen.getByRole('button', { name: /focus me/i }));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No data" description="Please add an item." />);

    expect(screen.getByRole('heading', { level: 2, name: /no data/i })).toBeInTheDocument();
    expect(screen.getByText(/please add an item\./i)).toBeInTheDocument();
  });
});
