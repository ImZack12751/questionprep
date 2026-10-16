import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { getCalculatorState, saveCalculatorState, type CalculatorState } from '../../lib/db';
import { CalculatorPane } from './CalculatorPane';
import { loadDesmos, type DesmosApi } from './desmos';
import { MIN_WIDTH } from './useDrawerWidth';

type Mode = 'graphing' | 'scientific';

interface Props {
  attemptId: string;
  open: boolean;
  onToggle: () => void;
  width: number;
  onResize: (w: number) => void;
}

export function CalculatorDrawer({ attemptId, open, onToggle, width, onResize }: Props) {
  const [api, setApi] = useState<DesmosApi | null>(null);
  const [error, setError] = useState<'missing-key' | 'load-failed' | null>(null);
  const [saved, setSaved] = useState<CalculatorState | null | undefined>(undefined);
  const [mode, setMode] = useState<Mode>('graphing');
  // Panes are mounted the first time their mode is shown, then kept alive.
  const [mounted, setMounted] = useState<Record<Mode, boolean>>({ graphing: false, scientific: false });
  const state = useRef<CalculatorState>({ attemptId, mode: 'graphing' });
  const [resizing, setResizing] = useState(false);

  useEffect(() => {
    void getCalculatorState(attemptId).then((s) => {
      if (s) {
        state.current = s;
        setMode(s.mode);
      }
      setSaved(s ?? null);
    });
  }, [attemptId]);

  const load = useCallback(() => {
    setError(null);
    loadDesmos()
      .then(setApi)
      .catch((e: Error) => setError(e.message === 'missing-key' ? 'missing-key' : 'load-failed'));
  }, []);

  // Load Desmos the first time the drawer opens.
  useEffect(() => {
    if (open && !api && !error) load();
  }, [open, api, error, load]);

  useEffect(() => {
    if (open) setMounted((m) => (m[mode] ? m : { ...m, [mode]: true }));
  }, [open, mode]);

  const persist = useCallback((patch: Partial<CalculatorState>) => {
    state.current = { ...state.current, ...patch };
    void saveCalculatorState(state.current);
  }, []);

  function switchMode(m: Mode) {
    setMode(m);
    persist({ mode: m });
  }

  function startResize(e: React.PointerEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = width;
    setResizing(true);
    const move = (ev: PointerEvent) => onResize(startW + (startX - ev.clientX));
    const up = () => {
      setResizing(false);
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
    };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
  }

  function keyResize(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') onResize(width + 24);
    else if (e.key === 'ArrowRight') onResize(width - 24);
  }

  return (
    <>
      <button
        type="button"
        className={`calc-handle ${open ? 'is-open' : ''}`}
        style={{ right: open ? width : 0 }}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="calc-drawer"
        title={open ? 'Hide calculator' : 'Show calculator'}
      >
        <Icon name="calculator" size={18} />
        <span className="calc-handle-label">Calculator</span>
      </button>

      <aside
        id="calc-drawer"
        className={`calc-drawer ${open ? 'is-open' : ''} ${resizing ? 'is-resizing' : ''}`}
        style={{ width }}
        aria-label="Calculator"
        aria-hidden={!open}
        inert={!open}
      >
        <div
          className="calc-resize"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize calculator"
          aria-valuenow={width}
          aria-valuemin={MIN_WIDTH}
          tabIndex={0}
          onPointerDown={startResize}
          onKeyDown={keyResize}
        />
        <header className="calc-head">
          <div className="segmented" role="radiogroup" aria-label="Calculator type">
            {(['graphing', 'scientific'] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? 'is-on' : ''} onClick={() => switchMode(m)}>
                {m === 'graphing' ? 'Graphing' : 'Scientific'}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-icon btn-ghost" onClick={onToggle} aria-label="Close calculator">
            <Icon name="close" />
          </button>
        </header>

        <div className="calc-body">
          {error === 'missing-key' && (
            <div className="calc-message">
              <h3>Calculator needs an API key</h3>
              <p>
                Add <code>VITE_DESMOS_API_KEY</code> to your <code>.env</code> file (or the repository secret used by the deploy workflow) and
                rebuild. See the README for how to get a free key from Desmos.
              </p>
            </div>
          )}
          {error === 'load-failed' && (
            <div className="calc-message">
              <h3>Couldn't load Desmos</h3>
              <p>Check your internet connection, then try again.</p>
              <button type="button" className="btn btn-ghost" onClick={load}>
                Retry
              </button>
            </div>
          )}
          {!error && (!api || saved === undefined) && open && <div className="calc-message muted">Loading calculator…</div>}
          {api &&
            saved !== undefined &&
            (['graphing', 'scientific'] as const).map(
              (m) =>
                mounted[m] && (
                  <CalculatorPane
                    key={m}
                    api={api}
                    kind={m}
                    visible={open && mode === m}
                    initialState={saved?.[m]}
                    onState={(s) => persist({ [m]: s })}
                    layoutKey={`${width}`}
                  />
                ),
            )}
        </div>
      </aside>
    </>
  );
}
