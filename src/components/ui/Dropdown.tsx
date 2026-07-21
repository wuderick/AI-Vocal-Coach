import { useEffect, useRef, useState } from 'react';
import { uiDropdownStyles, uiDropdownButtonStyles, uiDropdownMenuStyles, uiDropdownItemStyles } from './uiStyles';

interface DropdownProps {
  items: string[];
  selected: string;
  onChange: (value: string) => void;
}

export function Dropdown({ items, selected, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={uiDropdownStyles}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={uiDropdownButtonStyles}
      >
        {selected}
      </button>
      {open && (
        <div style={uiDropdownMenuStyles} role="listbox">
          {items.map((item) => (
            <button
              type="button"
              key={item}
              style={uiDropdownItemStyles}
              role="option"
              aria-selected={selected === item}
              onClick={() => {
                onChange(item);
                setOpen(false);
              }}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
