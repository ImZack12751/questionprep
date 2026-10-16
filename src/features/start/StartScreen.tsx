import { useEffect, useState } from 'react';
import { BrandMark } from '../../components/BrandMark';
import { Dialog } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { Rich } from '../../components/Rich';
import { ThemeToggle } from '../../components/ThemeToggle';
import { getPaper, listAttempts, saveAttempt } from '../../lib/db';
import { formatClock, plural } from '../../lib/format';
import { href, navigate } from '../../lib/router';
import { totalMarks } from '../attempt/answers';
import { createAttempt, submitted } from '../attempt/attempts';
import type { Attempt, PaperRecord } from '../attempt/types';
import { AttemptHistory } from './AttemptHistory';

export function StartScreen({ paperId }: { paperId: string }) {
  const [rec, setRec] = useState<PaperRecord | null | undefined>(undefined);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [confirmNew, setConfirmNew] = useState(false);

  useEffect(() => {
    void Promise.all([getPaper(paperId), listAttempts(paperId)]).then(([p, a]) => {
      setRec(p ?? null);
      setAttempts(a);
    });
  }, [paperId]);

  if (rec === undefined) return <div className="page" />;
  if (rec === null) {
    return (
      <div className="page center-message">
        <p>This paper isn't in your library any more.</p>
        <a className="btn btn-ghost" href={href({ name: 'home' })}>
          Back to library
        </a>
      </div>
    );
  }

  const { paper } = rec;
  const unfinished = attempts.find((a) => a.status === 'in_progress');
  const questionCount = paper.sections.reduce((n, s) => n + s.questions.length, 0);

  async function start() {
    if (unfinished) await saveAttempt(submitted(unfinished));
    const a = await createAttempt(rec!);
    navigate({ name: 'exam', attemptId: a.id });
  }

  return (
    <div className="page start">
      <header className="site-header">
        <BrandMark />
        <ThemeToggle />
      </header>
      <main className="start-main">
        <a className="back-link" href={href({ name: 'home' })}>
          <Icon name="back" size={16} /> Library
        </a>
        <article className="sheet start-sheet">
          <p className="eyebrow">{paper.subject || 'Question paper'}</p>
          <h1 className="start-title">{paper.title}</h1>
          <dl className="start-facts">
            <div>
              <dt>Time allowed</dt>
              <dd>{paper.durationMinutes} minutes</dd>
            </div>
            <div>
              <dt>Total marks</dt>
              <dd>{totalMarks(paper)}</dd>
            </div>
            <div>
              <dt>Questions</dt>
              <dd>
                {questionCount} in {plural(paper.sections.length, 'section')}
              </dd>
            </div>
          </dl>

          {paper.instructions && (
            <section className="start-instructions">
              <h2>Instructions</h2>
              <Rich text={paper.instructions} />
            </section>
          )}

          <ol className="start-sections">
            {paper.sections.map((s, i) => (
              <li key={i}>
                <span>{s.title}</span>
                <span className="muted">
                  {plural(s.questions.length, 'question')} · {s.questions.reduce((t, q) => t + q.marks, 0)} marks
                </span>
              </li>
            ))}
          </ol>

          <div className="start-actions">
            {unfinished ? (
              <>
                <a className="btn btn-primary btn-lg" href={href({ name: 'exam', attemptId: unfinished.id })}>
                  <Icon name="play" /> Resume · {formatClock(unfinished.durationMs - unfinished.elapsedMs)} left
                </a>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmNew(true)}>
                  Start a new attempt
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-primary btn-lg" onClick={start}>
                <Icon name="play" /> Start{attempts.length ? ' new attempt' : ''}
              </button>
            )}
            <p className="muted start-note">The clock starts as soon as you press start. You can pause at any time.</p>
          </div>
        </article>

        <AttemptHistory attempts={attempts} />
      </main>

      <Dialog
        open={confirmNew}
        title="Start a new attempt?"
        onClose={() => setConfirmNew(false)}
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmNew(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={start}>
              Submit it and start fresh
            </button>
          </>
        }
      >
        <p>Your unfinished attempt will be submitted as it is now, so you can still view and export it later.</p>
      </Dialog>
    </div>
  );
}
