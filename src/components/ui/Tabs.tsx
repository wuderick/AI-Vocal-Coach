import { useEffect, useRef, useState } from 'react';
import { uiTabStyles, uiTabActiveStyles, uiTabsListStyles, uiTabPanelStyles } from './uiStyles';

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultActiveId?: string;
}

export function Tabs({ items, defaultActiveId }: TabsProps) {
  const activeId = defaultActiveId ?? items[0]?.id;
  const [current, setCurrent] = useState(activeId);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!listRef.current) return;
      const tabButtons = Array.from(listRef.current.querySelectorAll<HTMLButtonElement>('button'));
      const currentIndex = tabButtons.findIndex((tab) => tab.dataset.tabId === current);

      if (currentIndex < 0) return;

      if (event.key === 'ArrowRight') {
        const nextIndex = (currentIndex + 1) % tabButtons.length;
        tabButtons[nextIndex].focus();
        setCurrent(tabButtons[nextIndex].dataset.tabId ?? current);
      }

      if (event.key === 'ArrowLeft') {
        const previousIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
        tabButtons[previousIndex].focus();
        setCurrent(tabButtons[previousIndex].dataset.tabId ?? current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [current]);

  const activeItem = items.find((item) => item.id === current) ?? items[0];

  return (
    <div>
      <div ref={listRef} style={uiTabsListStyles} role="tablist">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            data-tab-id={item.id}
            role="tab"
            aria-selected={item.id === current}
            onClick={() => setCurrent(item.id)}
            style={{
              ...uiTabStyles,
              ...(item.id === current ? uiTabActiveStyles : {}),
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div style={uiTabPanelStyles} role="tabpanel">
        {activeItem?.content}
      </div>
    </div>
  );
}
