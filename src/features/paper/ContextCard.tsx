import { useState } from 'react';
import { Rich } from '../../components/Rich';
import type { PlacedContext } from './contexts';

interface Props {
  placed: PlacedContext;
  /** Start expanded? Defaults to expanded only for the first question in a run. */
  defaultExpanded?: boolean;
}

/**
 * Read-only background material (a source, case study or data table) shown
 * above the question that uses it. Collapsible so a source shared by several
 * consecutive questions isn't repeated in full; print always shows it.
 */
export function ContextCard({ placed, defaultExpanded = placed.firstInRun }: Props) {
  const { context, domId, firstInRun, runStartNumber } = placed;
  const [open, setOpen] = useState(defaultExpanded);
  const labelId = `${domId}-label`;
  const bodyId = `${domId}-body`;

  return (
    <section id={domId} className={`context-card ${open ? 'is-open' : 'is-collapsed'}`} aria-labelledby={labelId}>
      <h3 className="context-heading">
        <button type="button" className="context-toggle" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((o) => !o)}>
          <span className="context-label" id={labelId}>
            {context.label}
          </span>
          {context.title && <span className="context-title">{context.title}</span>}
          <span className="context-hint" aria-hidden>
            {open ? 'Hide' : firstInRun ? 'Show' : `Show (also used by question ${runStartNumber})`}
          </span>
          {!open && !firstInRun && <span className="context-print-ref">Printed in full above question {runStartNumber}.</span>}
        </button>
      </h3>
      <div id={bodyId} className="context-body">
        <Rich text={context.text} className="context-text" />
      </div>
    </section>
  );
}

/** Context cards for one question, in contextIds order. */
export function ContextCards({ items }: { items: PlacedContext[] }) {
  if (!items.length) return null;
  return (
    <div className="context-stack">
      {items.map((p) => (
        <ContextCard key={p.domId} placed={p} />
      ))}
    </div>
  );
}
