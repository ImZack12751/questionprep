import { useEffect, useRef } from 'react';
import { useTheme } from '../../lib/theme';
import type { DesmosApi, DesmosCalculator } from './desmos';

interface Props {
  api: DesmosApi;
  kind: 'graphing' | 'scientific';
  visible: boolean;
  initialState: unknown;
  onState: (state: unknown) => void;
  /** Changes whenever the pane's size may have changed. */
  layoutKey: string;
}

/** One Desmos instance. Created once and kept alive (hidden, not destroyed) for the session. */
export function CalculatorPane({ api, kind, visible, initialState, onState, layoutKey }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const calc = useRef<DesmosCalculator | null>(null);
  const { theme } = useTheme();
  const onStateRef = useRef(onState);
  onStateRef.current = onState;

  useEffect(() => {
    if (!el.current) return;
    const opts =
      kind === 'graphing'
        ? { expressionsCollapsed: false, settingsMenu: true, zoomButtons: true, border: false }
        : { border: false };
    const c = kind === 'graphing' ? api.GraphingCalculator(el.current, opts) : api.ScientificCalculator(el.current, opts);
    if (initialState) {
      try {
        c.setState(initialState);
      } catch {
        /* incompatible saved state: start fresh */
      }
    }
    let t: number | undefined;
    c.observeEvent('change', () => {
      clearTimeout(t);
      t = window.setTimeout(() => onStateRef.current(c.getState()), 600);
    });
    calc.current = c;
    return () => {
      clearTimeout(t);
      onStateRef.current(c.getState());
      c.destroy();
      calc.current = null;
    };
    // The instance lives for the whole exam; initial state is only applied once.
  }, [api, kind]);

  // The graphing calculator has a native dark rendering; the scientific one stays light.
  useEffect(() => {
    if (kind === 'graphing') calc.current?.updateSettings?.({ invertedColors: theme === 'dark' });
  }, [kind, theme]);

  useEffect(() => {
    if (visible) calc.current?.resize();
  }, [visible, layoutKey]);

  return <div ref={el} className={`calc-pane calc-pane-${kind}`} hidden={!visible} />;
}
