import { useCallback, useEffect, useRef, useState } from 'react';
import { htmlToPlainText, plainToHtml, sanitizeAnswerHtml } from '../../../lib/richAnswer';
import type { Answer } from '../../attempt/types';
import { FormatToolbar, type FormatCommand } from './FormatToolbar';

interface Props {
  value: Extract<Answer, { type: 'typed' }> | undefined;
  onChange: (a: Answer) => void;
  disabled: boolean;
  labelledBy: string;
}

const COMMANDS: FormatCommand[] = ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList'];

/**
 * Written answer with basic formatting (bold, italic, underline, lists).
 * The editable element owns its content after mount; React never rewrites it.
 */
export function TypedInput({ value, onChange, disabled, labelledBy }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [active, setActive] = useState<Set<FormatCommand>>(new Set());
  const [empty, setEmpty] = useState(!value?.text.trim());

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = value?.html ? sanitizeAnswerHtml(value.html) : plainToHtml(value?.text ?? '');
    // Set once on mount; later edits come from the user.
  }, []);

  const emit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const html = sanitizeAnswerHtml(el.innerHTML);
    const text = htmlToPlainText(html);
    setEmpty(!text);
    onChangeRef.current({ type: 'typed', text, html: text ? html : '' });
  }, []);

  const refreshActive = useCallback(() => {
    const el = ref.current;
    const sel = document.getSelection();
    if (!el || !sel?.anchorNode || !el.contains(sel.anchorNode)) return;
    setActive(new Set(COMMANDS.filter((c) => document.queryCommandState(c))));
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', refreshActive);
    return () => document.removeEventListener('selectionchange', refreshActive);
  }, [refreshActive]);

  function apply(cmd: FormatCommand) {
    ref.current?.focus();
    document.execCommand(cmd);
    emit();
    refreshActive();
  }

  return (
    <div className={`typed ${disabled ? 'is-disabled' : ''}`}>
      {!disabled && <FormatToolbar active={active} onCommand={apply} />}
      <div
        ref={ref}
        className={`typed-input ${empty ? 'is-empty' : ''}`}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-labelledby={labelledBy}
        aria-readonly={disabled}
        data-placeholder="Write your answer…"
        spellCheck
        onInput={emit}
        onPaste={(e) => {
          // Paste as plain text so outside styles (fonts, colours) never come in.
          e.preventDefault();
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
        }}
        onKeyDown={(e) => {
          // Tab inside a list nests it; elsewhere Tab keeps moving focus.
          if (e.key === 'Tab' && document.queryCommandState('insertUnorderedList') !== document.queryCommandState('insertOrderedList')) {
            e.preventDefault();
            document.execCommand(e.shiftKey ? 'outdent' : 'indent');
            emit();
          }
        }}
      />
    </div>
  );
}
