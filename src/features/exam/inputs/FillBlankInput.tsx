import { useCallback } from 'react';
import { Rich } from '../../../components/Rich';
import type { Answer } from '../../attempt/types';

interface Props {
  text: string;
  blanks: number;
  value: Extract<Answer, { type: 'fill_blank' }> | undefined;
  onChange: (a: Answer) => void;
  disabled: boolean;
  label: string;
}

/** Renders the question text with an inline input in place of each {{n}}. */
export function FillBlankInput({ text, blanks, value, onChange, disabled, label }: Props) {
  const values = value?.values ?? [];
  const renderBlank = useCallback(
    (n: number) => {
      const v = values[n - 1] ?? '';
      return (
        <input
          className="blank-input"
          type="text"
          value={v}
          disabled={disabled}
          aria-label={`${label}, blank ${n}`}
          autoComplete="off"
          spellCheck={false}
          size={Math.max(6, v.length + 1)}
          onChange={(e) => {
            const next = Array.from({ length: blanks }, (_, i) => values[i] ?? '');
            next[n - 1] = e.target.value;
            onChange({ type: 'fill_blank', values: next });
          }}
        />
      );
    },
    [values, disabled, label, blanks, onChange],
  );
  return <Rich text={text} renderBlank={renderBlank} className="question-text fill-text" />;
}
