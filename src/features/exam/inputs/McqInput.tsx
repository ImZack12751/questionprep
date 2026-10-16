import { Rich } from '../../../components/Rich';
import type { Answer } from '../../attempt/types';

interface Props {
  name: string;
  options: string[];
  allowMultiple: boolean;
  value: Extract<Answer, { type: 'mcq' }> | undefined;
  onChange: (a: Answer) => void;
  disabled: boolean;
  labelledBy: string;
}

export const optionLetter = (i: number) => String.fromCharCode(65 + i);

export function McqInput({ name, options, allowMultiple, value, onChange, disabled, labelledBy }: Props) {
  const selected = value?.selected ?? [];
  const toggle = (i: number) => {
    const next = allowMultiple ? (selected.includes(i) ? selected.filter((x) => x !== i) : [...selected, i].sort((a, b) => a - b)) : [i];
    onChange({ type: 'mcq', selected: next });
  };
  return (
    <div className="mcq" role={allowMultiple ? 'group' : 'radiogroup'} aria-labelledby={labelledBy}>
      {allowMultiple && <p className="mcq-hint">Select all that apply</p>}
      {options.map((opt, i) => {
        const id = `${name}-opt-${i}`;
        const checked = selected.includes(i);
        return (
          <label key={i} htmlFor={id} className={`mcq-option ${checked ? 'is-checked' : ''}`}>
            <input
              id={id}
              type={allowMultiple ? 'checkbox' : 'radio'}
              name={name}
              checked={checked}
              disabled={disabled}
              onChange={() => toggle(i)}
            />
            <span className={`mcq-letter ${allowMultiple ? 'is-square' : ''}`} aria-hidden>
              {optionLetter(i)}
            </span>
            <Rich text={opt} inline className="mcq-text" />
          </label>
        );
      })}
      {!allowMultiple && selected.length > 0 && !disabled && (
        <button type="button" className="mcq-clear" onClick={() => onChange({ type: 'mcq', selected: [] })}>
          Clear selection
        </button>
      )}
    </div>
  );
}
