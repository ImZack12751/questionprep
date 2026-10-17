import { formatDate, formatDuration } from '../../lib/format';
import { href } from '../../lib/router';
import { attemptSummary } from '../attempt/answers';
import type { Attempt } from '../attempt/types';

/** Compact list of attempts for the start screen's side panel. */
export function AttemptHistory({ attempts }: { attempts: Attempt[] }) {
  if (!attempts.length) return <p className="muted attempt-empty">No attempts yet.</p>;
  return (
    <ol className="attempt-list">
      {attempts.map((a, i) => {
        const s = attemptSummary(a);
        const done = a.status === 'submitted';
        return (
          <li key={a.id}>
            <a className="attempt-item" href={href(done ? { name: 'results', attemptId: a.id } : { name: 'exam', attemptId: a.id })}>
              <span className="attempt-num">#{attempts.length - i}</span>
              <span className="attempt-main">
                <span className="attempt-date">{formatDate(a.startedAt)}</span>
                <span className="attempt-meta">
                  {s.answered}/{s.total} answered · {formatDuration(a.elapsedMs)}
                  {s.flagged ? ` · ${s.flagged} flagged` : ''}
                </span>
              </span>
              <span className={`pill ${done ? 'pill-done' : 'pill-progress'}`}>
                {done ? (a.autoSubmitted ? 'Time up' : 'Submitted') : 'In progress'}
              </span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}
