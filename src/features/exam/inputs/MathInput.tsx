import { useCallback, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { makeMathAnswer, mathLines } from '../../attempt/mathAnswer';
import type { Answer } from '../../attempt/types';
import { MathLine, type MathLineHandle } from './MathLine';

interface Props {
  value: Extract<Answer, { type: 'math' }> | undefined;
  onChange: (a: Answer) => void;
  disabled: boolean;
  label: string;
}

interface Row {
  key: number;
  latex: string;
}

/**
 * Multi-line maths working: one MathLive field per line. Enter (or the on-screen
 * keyboard's return key) starts a new line, Backspace on an empty line removes it,
 * and the up/down arrows move between lines.
 */
export function MathInput({ value, onChange, disabled, label }: Props) {
  const nextKey = useRef(0);
  const [rows, setRows] = useState<Row[]>(() => mathLines(value).map((latex) => ({ key: nextKey.current++, latex })));
  const rowsRef = useRef(rows);
  const handles = useRef(new Map<number, MathLineHandle>());
  const [focusKey, setFocusKey] = useState<{ key: number; at: 'start' | 'end' } | null>(null);
  const lastFocused = useRef<number | null>(null);
  const [textMode, setTextMode] = useState(false);

  const commit = useCallback(
    (next: Row[]) => {
      rowsRef.current = next;
      setRows(next);
      onChange(makeMathAnswer(next.map((r) => r.latex)));
    },
    [onChange],
  );

  const indexOf = (key: number) => rowsRef.current.findIndex((r) => r.key === key);

  const focusRow = (key: number | undefined, at: 'start' | 'end') => {
    if (key === undefined) return;
    const h = handles.current.get(key);
    if (h) h.focus(at);
    else setFocusKey({ key, at }); // not mounted yet: focus once created
  };

  // Called from MathLive's own events, so the new line is rendered synchronously.
  const insertAfter = (key: number) => {
    const i = indexOf(key);
    const row = { key: nextKey.current++, latex: '' };
    const next = [...rowsRef.current];
    next.splice(i + 1, 0, row);
    flushSync(() => {
      setFocusKey({ key: row.key, at: 'start' });
      commit(next);
    });
  };

  const remove = (key: number, focus: 'previous' | 'next' = 'previous') => {
    const cur = rowsRef.current;
    if (cur.length <= 1) return;
    const i = indexOf(key);
    const target = focus === 'previous' ? cur[i - 1] ?? cur[i + 1] : cur[i + 1] ?? cur[i - 1];
    handles.current.delete(key);
    flushSync(() => commit(cur.filter((r) => r.key !== key)));
    focusRow(target?.key, 'end');
  };

  const toggleText = () => {
    const key = lastFocused.current ?? rowsRef.current[rowsRef.current.length - 1]!.key;
    const h = handles.current.get(key);
    if (!h) return;
    setTextMode(h.toggleTextMode());
  };

  return (
    <div className={`math-lines ${disabled ? 'is-disabled' : ''}`} role="group" aria-label={`${label}, maths working`}>
      <ol className="math-line-list">
        {rows.map((row, i) => (
          <li key={row.key} className="math-line">
            {rows.length > 1 && (
              <span className="math-line-no" aria-hidden>
                {i + 1}
              </span>
            )}
            <MathLine
              ref={(h) => {
                if (h) handles.current.set(row.key, h);
              }}
              initial={row.latex}
              disabled={disabled}
              label={rows.length > 1 ? `${label}, line ${i + 1} of ${rows.length}` : label}
              autoFocus={focusKey?.key === row.key ? focusKey.at : undefined}
              onFocused={(text) => {
                lastFocused.current = row.key;
                setFocusKey(null);
                setTextMode(text);
              }}
              onModeChange={setTextMode}
              onInput={(latex) => commit(rowsRef.current.map((r) => (r.key === row.key ? { ...r, latex } : r)))}
              onEnter={() => insertAfter(row.key)}
              onBackspaceEmpty={() => remove(row.key)}
              onMoveOut={(dir) => {
                const j = indexOf(row.key);
                if (dir === 'up') focusRow(rowsRef.current[j - 1]?.key, 'end');
                else focusRow(rowsRef.current[j + 1]?.key, 'start');
              }}
            />
            {!disabled && rows.length > 1 && (
              <button
                type="button"
                className="math-line-remove"
                aria-label={`Remove line ${i + 1}`}
                title="Remove line"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => remove(row.key)}
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ol>
      {!disabled && (
        <div className="math-controls">
          <button
            type="button"
            className="math-control"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertAfter(lastFocused.current ?? rowsRef.current[rowsRef.current.length - 1]!.key)}
          >
            + New line
          </button>
          <button
            type="button"
            className={`math-control ${textMode ? 'is-on' : ''}`}
            aria-pressed={textMode}
            title="Type words instead of maths on this line"
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleText}
          >
            Text
          </button>
          <span className="math-hint">Enter for a new line · ↑ ↓ to move between lines</span>
        </div>
      )}
    </div>
  );
}
