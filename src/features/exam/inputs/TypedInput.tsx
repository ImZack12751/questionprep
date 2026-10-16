import { useLayoutEffect, useRef } from 'react';
import type { Answer } from '../../attempt/types';

interface Props {
  value: Extract<Answer, { type: 'typed' }> | undefined;
  onChange: (a: Answer) => void;
  disabled: boolean;
  labelledBy: string;
}

export function TypedInput({ value, onChange, disabled, labelledBy }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const text = value?.text ?? '';

  // Grow with the content (CSS field-sizing where supported; this covers the rest).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [text]);

  return (
    <textarea
      ref={ref}
      className="typed-input"
      rows={3}
      value={text}
      disabled={disabled}
      aria-labelledby={labelledBy}
      placeholder="Write your answer…"
      spellCheck
      onChange={(e) => onChange({ type: 'typed', text: e.target.value })}
    />
  );
}
