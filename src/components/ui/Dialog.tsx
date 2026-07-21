import { useId } from 'react';
import { Button } from './Button';
import { uiDialogActionsStyles, uiSurfaceStyles, uiModalTitleStyles } from './uiStyles';

interface DialogProps {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Dialog({
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <div style={uiSurfaceStyles} role="dialog" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <h2 id={titleId} style={uiModalTitleStyles}>{title}</h2>
      <p id={descriptionId}>{description}</p>
      <div style={uiDialogActionsStyles}>
        <Button variant="secondary" onClick={onCancel}>{cancelText}</Button>
        <Button variant="primary" onClick={onConfirm}>{confirmText}</Button>
      </div>
    </div>
  );
}
