import { useEffect, useId } from 'react';
import { uiModalOverlayStyles, uiModalStyles, uiModalTitleStyles, uiModalCloseButtonStyles } from './uiStyles';

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ title, open, onClose, children }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div style={uiModalOverlayStyles} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div style={{ position: 'relative', ...uiModalStyles }}>
        <button type="button" onClick={onClose} style={uiModalCloseButtonStyles} aria-label="Close modal">
          ×
        </button>
        <h2 id={titleId} style={uiModalTitleStyles}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
