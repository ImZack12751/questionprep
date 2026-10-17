import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { loadMathLive, mathLiveIfLoaded } from './loadMathLive';

type MathfieldElement = import('mathlive').MathfieldElement;

/**
 * Focus a math field immediately. MathfieldElement.focus() moves the real DOM focus in a
 * setTimeout, so keys typed straight after (e.g. after Enter adds a line) went to the
 * previous field. Focusing its keyboard sink (a documented CSS part) is synchronous, and
 * MathLive's own focus handling runs from the sink's focus event.
 */
function focusNow(mf: MathfieldElement, at: 'start' | 'end') {
  const sink = mf.shadowRoot?.querySelector<HTMLElement>('[part~="keyboard-sink"]');
  if (sink) sink.focus();
  else mf.focus();
  mf.position = at === 'start' ? 0 : mf.lastOffset;
}

export interface MathLineHandle {
  focus: (at: 'start' | 'end') => void;
  /** Toggle text/maths mode at the caret; returns true when now in text mode. */
  toggleTextMode: () => boolean;
}

interface Props {
  initial: string;
  disabled: boolean;
  label: string;
  /** Focus as soon as the field exists (used for newly added lines). */
  autoFocus?: 'start' | 'end';
  onInput: (latex: string) => void;
  onEnter: () => void;
  onBackspaceEmpty: () => void;
  onMoveOut: (dir: 'up' | 'down') => void;
  onFocused: (textMode: boolean) => void;
  onModeChange: (text: boolean) => void;
}

/**
 * One MathLive field. Created imperatively so React never re-renders its
 * internals; after mount the field owns its content.
 */
export const MathLine = forwardRef<MathLineHandle, Props>(function MathLine(props, ref) {
  const host = useRef<HTMLDivElement>(null);
  const field = useRef<MathfieldElement | null>(null);
  const cb = useRef(props);
  cb.current = props;
  const [failed, setFailed] = useState(false);
  const [fallback, setFallback] = useState(props.initial);

  useImperativeHandle(ref, () => ({
    focus(at) {
      if (field.current) focusNow(field.current, at);
    },
    toggleTextMode() {
      const mf = field.current;
      if (!mf) return false;
      mf.focus();
      const next = mf.mode === 'text' ? 'math' : 'text';
      mf.executeCommand(['switchMode', next]);
      return next === 'text';
    },
  }));

  // Layout effect + synchronous creation when MathLive is already loaded: a line added by
  // Enter exists and has focus before the next keystroke arrives.
  useLayoutEffect(() => {
    let cancelled = false;
    const cleanups: (() => void)[] = [];
    const create = ({ MathfieldElement }: typeof import('mathlive')) => {
      if (cancelled || !host.current) return;
      const mf = new MathfieldElement();
      mf.mathVirtualKeyboardPolicy = 'auto';
      mf.smartFence = true;
      // Without this the space bar inserts nothing in maths mode ("F = BIL" became "F=BIL").
      mf.mathModeSpace = '\\,';
      mf.setAttribute('aria-label', cb.current.label);
      mf.className = 'math-input';
      mf.value = cb.current.initial;
      mf.readOnly = cb.current.disabled;
      host.current.replaceChildren(mf);
      field.current = mf;

      const on = <K extends string>(type: K, fn: (e: Event) => void, opts?: AddEventListenerOptions) => {
        mf.addEventListener(type, fn, opts);
        cleanups.push(() => mf.removeEventListener(type, fn, opts));
      };
      on('input', () => cb.current.onInput(mf.value));
      // Physical Enter is caught before MathLive sees it (capture phase on the host), so the
      // new line exists before the next keystroke. MathLive's own "commit" on Enter fires
      // "change" too late for fast typists.
      on(
        'keydown',
        (e) => {
          const k = e as KeyboardEvent;
          if (mf.readOnly || k.isComposing) return;
          if (k.key === 'Enter' && !k.shiftKey && !k.altKey && !k.ctrlKey && !k.metaKey) {
            k.preventDefault();
            k.stopPropagation();
            cb.current.onEnter();
          } else if (k.key === 'Backspace' && !mf.value) {
            k.preventDefault();
            k.stopPropagation();
            cb.current.onBackspaceEmpty();
          }
        },
        { capture: true },
      );
      // The on-screen keyboard's return key sends a "commit" (no key event), which MathLive
      // reports as "change". "change" also fires on blur, so only act while focused.
      on('change', () => {
        if (!mf.readOnly && mf.hasFocus()) cb.current.onEnter();
      });
      on('move-out', (e) => {
        const dir = (e as CustomEvent<{ direction: string }>).detail.direction;
        if (dir === 'upward' || dir === 'downward') {
          e.preventDefault();
          cb.current.onMoveOut(dir === 'upward' ? 'up' : 'down');
        }
      });
      on('focusin', () => cb.current.onFocused(mf.mode === 'text'));
      on('mode-change', () => cb.current.onModeChange(mf.mode === 'text'));

      if (cb.current.autoFocus) focusNow(mf, cb.current.autoFocus);
    };
    const ready = mathLiveIfLoaded();
    if (ready) create(ready);
    else loadMathLive().then(create, () => setFailed(true));
    return () => {
      cancelled = true;
      cleanups.forEach((c) => c());
      field.current?.remove();
      field.current = null;
    };
    // Created once; disabled/label are synced below.
  }, []);

  useEffect(() => {
    if (field.current) field.current.readOnly = props.disabled;
  }, [props.disabled]);

  useEffect(() => {
    field.current?.setAttribute('aria-label', props.label);
  }, [props.label]);

  if (failed) {
    // Plain LaTeX entry if MathLive can't load.
    return (
      <input
        className="math-fallback"
        value={fallback}
        disabled={props.disabled}
        aria-label={`${props.label} (LaTeX)`}
        placeholder="Type your answer as LaTeX"
        onChange={(e) => {
          setFallback(e.target.value);
          props.onInput(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            props.onEnter();
          }
        }}
      />
    );
  }
  return <div ref={host} className="math-host" />;
});
