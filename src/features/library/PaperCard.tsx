import { Icon } from '../../components/Icon';
import { formatClock, formatDate } from '../../lib/format';
import { href } from '../../lib/router';
import { totalMarks } from '../attempt/answers';
import type { LibraryEntry } from './useLibrary';

function lastStatus(entry: LibraryEntry) {
  const last = entry.attempts[0];
  if (!last) return { tone: 'none', text: 'Not attempted yet' };
  if (last.status === 'in_progress') {
    return { tone: 'progress', text: `In progress · ${formatClock(last.durationMs - last.elapsedMs)} left` };
  }
  return { tone: 'done', text: `Submitted ${formatDate(last.submittedAt ?? last.updatedAt)}` };
}

export function PaperCard({ entry, onDelete }: { entry: LibraryEntry; onDelete: () => void }) {
  const { paper, id } = entry.record;
  const status = lastStatus(entry);
  const questions = paper.sections.reduce((n, s) => n + s.questions.length, 0);
  return (
    <article className="paper-card">
      <a className="paper-card-link" href={href({ name: 'paper', paperId: id })}>
        <span className="paper-card-subject">{paper.subject || 'General'}</span>
        <h3 className="paper-card-title">{paper.title}</h3>
        <dl className="paper-card-facts">
          <div>
            <dt>Time</dt>
            <dd>{paper.durationMinutes} min</dd>
          </div>
          <div>
            <dt>Marks</dt>
            <dd>{totalMarks(paper)}</dd>
          </div>
          <div>
            <dt>Questions</dt>
            <dd>{questions}</dd>
          </div>
          <div>
            <dt>Attempts</dt>
            <dd>{entry.attempts.length}</dd>
          </div>
        </dl>
        <p className={`paper-card-status status-${status.tone}`}>
          <span className="status-dot" aria-hidden />
          {status.text}
        </p>
      </a>
      <button
        type="button"
        className="btn btn-icon btn-ghost paper-card-delete"
        onClick={onDelete}
        aria-label={`Delete ${paper.title}`}
        title="Delete paper"
      >
        <Icon name="trash" size={16} />
      </button>
    </article>
  );
}
