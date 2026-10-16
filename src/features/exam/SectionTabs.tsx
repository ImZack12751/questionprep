import type { Paper } from '../paper/schema';
import { questionStatus } from '../attempt/answers';
import type { Attempt } from '../attempt/types';

interface Props {
  paper: Paper;
  attempt: Attempt;
  current: number;
  onSelect: (i: number) => void;
}

export function SectionTabs({ paper, attempt, current, onSelect }: Props) {
  return (
    <div className="section-tabs" role="tablist" aria-label="Sections">
      {paper.sections.map((s, i) => {
        const answered = s.questions.filter((q) => questionStatus(q, attempt.answers) === 'complete').length;
        const flagged = s.questions.some((q) => attempt.flags[q.id]);
        const selected = i === current;
        return (
          <button
            key={i}
            type="button"
            role="tab"
            id={`tab-${i}`}
            aria-selected={selected}
            aria-controls="section-panel"
            tabIndex={selected ? 0 : -1}
            className={`section-tab ${selected ? 'is-active' : ''}`}
            onClick={() => onSelect(i)}
            onKeyDown={(e) => {
              const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
              if (!delta) return;
              const next = (i + delta + paper.sections.length) % paper.sections.length;
              onSelect(next);
              document.getElementById(`tab-${next}`)?.focus();
            }}
          >
            <span className="section-tab-title">{s.title}</span>
            <span className={`section-tab-count ${answered === s.questions.length ? 'is-complete' : ''}`}>
              {answered}/{s.questions.length}
            </span>
            {flagged && <span className="section-tab-flag" title="Has flagged questions" aria-label="has flagged questions" />}
          </button>
        );
      })}
    </div>
  );
}
