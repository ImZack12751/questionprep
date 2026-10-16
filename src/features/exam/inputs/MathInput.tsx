import { useEffect, useRef, useState } from 'react';
import type { Answer } from '../../attempt/types';
import { loadMathLive } from './loadMathLive';

interface Props {
  value: Extract<Answer, { type: 'math' }> | undefined;
  onChange: (a: Answer) => void;
  disabled: boolean;
  label: string;
}

type MathfieldElement = import('mathlive').MathfieldElement;

/** MathLive math-field, created imperatively so React never re-renders its internals. */
export function MathInput({ value, onChange, disabled, label }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const field = useRef<MathfieldElement | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [failed, setFailed] = useState(false);
  /** Last value the field itself reported; echoes of it must not be written back. */
  const emitted = useRef<string | null>(null);
  const latex = value?.latex ?? '';

  useEffect(() => {
    let cancelled = false;
    loadMathLive()
      .then(({ MathfieldElement }) => {
        if (cancelled || !host.current) return;
        const mf = new MathfieldElement();
        mf.mathVirtualKeyboardPolicy = 'auto';
        mf.smartFence = true;
        mf.setAttribute('aria-label', label);
        mf.className = 'math-input';
        mf.value = latex;
        mf.readOnly = disabled;
        mf.addEventListener('input', () => {
          emitted.current = mf.value;
          onChangeRef.current({ type: 'math', latex: mf.value });
        });
        host.current.replaceChildren(mf);
        field.current = mf;
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      field.current?.remove();
      field.current = null;
    };
    // Created once; value/disabled are synced below.
  }, []);

  useEffect(() => {
    const mf = field.current;
    if (mf && latex !== emitted.current && mf.value !== latex) mf.value = latex;
  }, [latex]);

  useEffect(() => {
    if (field.current) field.current.readOnly = disabled;
  }, [disabled]);

  if (failed) {
    // Fallback: plain LaTeX entry if MathLive can't load.
    return (
      <input
        className="math-fallback"
        value={latex}
        disabled={disabled}
        aria-label={`${label} (LaTeX)`}
        placeholder="Type your answer as LaTeX"
        onChange={(e) => onChange({ type: 'math', latex: e.target.value })}
      />
    );
  }
  return <div ref={host} className="math-host" />;
}
