import type { Answerable } from '../../paper/schema';
import type { Answer } from '../../attempt/types';
import { FillBlankInput } from './FillBlankInput';
import { MathInput } from './MathInput';
import { McqInput } from './McqInput';
import { TypedInput } from './TypedInput';

interface Props {
  item: Answerable;
  answerKey: string;
  value: Answer | undefined;
  onChange: (key: string, a: Answer) => void;
  disabled: boolean;
  label: string;
  labelledBy: string;
}

/** Picks the input for an answerable item. fill_blank also renders the item's text. */
export function AnswerInput({ item, answerKey, value, onChange, disabled, label, labelledBy }: Props) {
  const set = (a: Answer) => onChange(answerKey, a);
  switch (item.type) {
    case 'mcq':
      return (
        <McqInput
          name={answerKey}
          options={item.options}
          allowMultiple={item.allowMultiple}
          value={value?.type === 'mcq' ? value : undefined}
          onChange={set}
          disabled={disabled}
          labelledBy={labelledBy}
        />
      );
    case 'typed':
      return <TypedInput value={value?.type === 'typed' ? value : undefined} onChange={set} disabled={disabled} labelledBy={labelledBy} />;
    case 'math':
      return <MathInput value={value?.type === 'math' ? value : undefined} onChange={set} disabled={disabled} label={label} />;
    case 'fill_blank':
      return (
        <FillBlankInput
          text={item.text}
          blanks={item.blanks}
          value={value?.type === 'fill_blank' ? value : undefined}
          onChange={set}
          disabled={disabled}
          label={label}
        />
      );
  }
}
