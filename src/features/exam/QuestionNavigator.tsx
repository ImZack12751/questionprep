import { questionStatus } from '../attempt/answers';
import type { Attempt } from '../attempt/types';

interface Props {
  attempt: Attempt;
  currentSection: number;
  activeQuestionId: string | null;
  onJump: (sectionIndex: number, questionId: string) => void;
  onSelectSection: (sectionIndex: number) => void;
}

const STATUS_LABEL = { complete: 'answered', partial: 'partly answered', empty: 'not answered' } as const;

/** Sidebar overview of every question: status, flags, and click-to-jump. */
export function QuestionNavigator({ attempt, currentSection, activeQuestionId, onJump, onSelectSection }: Props) {
  const { paper } = attempt;
  let n = 0;
  let answered = 0;
  let total = 0;
  let flagged = 0;
  const sections = paper.sections.map((s) => {
    const items = s.questions.map((q) => {
      n++;
      total++;
      const status = questionStatus(q, attempt.answers);
      if (status === 'complete') answered++;
      if (attempt.flags[q.id]) flagged++;
      return { q, n, status, flagged: !!attempt.flags[q.id] };
    });
    return { s, items, done: items.filter((i) => i.status === 'complete').length };
  });

  return (
    <div className="qnav">
      <div className="qnav-progress">
        <div className="qnav-progress-row">
          <span>
            <strong>{answered}</strong> of {total} answered
          </span>
          {flagged > 0 && <span className="qnav-flag-count">{flagged} flagged</span>}
        </div>
        <div className="progress" aria-hidden>
          <span style={{ width: `${total ? (answered / total) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="qnav-sections">
        {sections.map(({ s, items, done }, si) => (
          <section key={si} className={`qnav-section ${si === currentSection ? 'is-current' : ''}`}>
            <button type="button" className="qnav-section-head" onClick={() => onSelectSection(si)} aria-current={si === currentSection ? 'true' : undefined}>
              <span className="qnav-section-title">{s.title}</span>
              <span className="qnav-section-count">
                {done}/{items.length}
              </span>
            </button>
            <div className="qnav-grid">
              {items.map(({ q, n: number, status, flagged: isFlagged }) => (
                <button
                  key={q.id}
                  type="button"
                  className={`qnav-q is-${status} ${isFlagged ? 'is-flagged' : ''} ${activeQuestionId === q.id && si === currentSection ? 'is-active' : ''}`}
                  onClick={() => onJump(si, q.id)}
                  aria-label={`Question ${number}, ${STATUS_LABEL[status]}${isFlagged ? ', flagged' : ''}`}
                  title={`Question ${number} · ${q.marks} mark${q.marks === 1 ? '' : 's'}`}
                >
                  {number}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <ul className="qnav-legend" aria-label="Key">
        <li>
          <span className="qnav-q is-complete" aria-hidden /> Answered
        </li>
        <li>
          <span className="qnav-q is-partial" aria-hidden /> Partly answered
        </li>
        <li>
          <span className="qnav-q is-empty" aria-hidden /> Not answered
        </li>
        <li>
          <span className="qnav-q is-empty is-flagged" aria-hidden /> Flagged
        </li>
      </ul>
    </div>
  );
}
