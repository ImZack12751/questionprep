import { useEffect, useRef, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  onClose: () => void;
  actions: ReactNode;
  tone?: 'default' | 'danger';
}

/** Native <dialog> for focus trapping and Escape handling. */
export function Dialog({ open, title, children, onClose, actions, tone = 'default' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`dialog dialog-${tone}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="dialog-title"
    >
      {open && (
        <div className="dialog-body">
          <h2 id="dialog-title" className="dialog-title">
            {title}
          </h2>
          <div className="dialog-content">{children}</div>
          <div className="dialog-actions">{actions}</div>
        </div>
      )}
    </dialog>
  );
}
