import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { SAMPLES } from './samples';

export function SampleMenu({ onPick }: { onPick: (data: unknown, name: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div className="menu" ref={ref}>
      <button type="button" className="btn btn-ghost" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)}>
        <Icon name="book" /> Load sample
      </button>
      {open && (
        <div className="menu-popover" role="menu">
          {SAMPLES.map((s) => (
            <button
              key={s.name}
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={() => {
                setOpen(false);
                onPick(s.data, s.name);
              }}
            >
              <span className="menu-item-title">{s.name}</span>
              <span className="menu-item-sub">{s.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
