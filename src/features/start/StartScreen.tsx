import { useEffect, useState } from 'react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { Dialog } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { Rich } from '../../components/Rich';
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

  if (rec === undefined) return <AppShell>{null}</AppShell>;
  if (rec === null) {
    return (
      <AppShell>
        <div className="center-message">
          <p>This paper isn't in your library any more.</p>
          <a className="btn btn-ghost" href={href({ name: 'home' })}>
            Back to library
          </a>
        </div>
      </AppShell>
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

  const marks = totalMarks(paper);

  return (
    <AppShell>
      <PageHeader
        crumbs={[{ label: 'Library', href: href({ name: 'home' }) }, { label: paper.title }]}
        eyebrow={paper.subject || 'Question paper'}
        title={paper.title}
      />

      <div className="two-col">
        <article className="sheet start-sheet">
          <dl className="start-facts">
            <div>
              <dt>Time allowed</dt>
              <dd>{paper.durationMinutes} minutes</dd>
            </div>
            <div>
              <dt>Total marks</dt>
              <dd>{marks}</dd>
            </div>
            <div>
              <dt>Questions</dt>
              <dd>
                {questionCount} in {plural(paper.sections.length, 'section')}
              </dd>
            </div>
          </dl>

          <section className="start-block">
            <h2 className="start-block-title">Instructions</h2>
            {paper.instructions ? (
              <Rich text={paper.instructions} className="start-instructions" />
            ) : (
              <p className="start-instructions">Answer all questions in the time allowed.</p>
            )}
          </section>

          <section className="start-block">
            <h2 className="start-block-title">Contents</h2>
            <table className="contents-table">
              <thead>
                <tr>
                  <th scope="col">Section</th>
                  <th scope="col">Questions</th>
                  <th scope="col">Marks</th>
                </tr>
              </thead>
              <tbody>
                {paper.sections.map((s, i) => (
                  <tr key={i}>
                    <td>
                      <span className="muted">{i + 1}.</span> {s.title}
                    </td>
                    <td>{s.questions.length}</td>
                    <td>{s.questions.reduce((t, q) => t + q.marks, 0)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td>{questionCount}</td>
                  <td>{marks}</td>
                </tr>
              </tfoot>
            </table>
          </section>
        </article>

        <aside className="panel sticky-aside" aria-label="Begin">
          <div className="panel-section">
            <h2 className="panel-title">{unfinished ? 'Attempt in progress' : 'Ready to begin'}</h2>
            {unfinished ? (
              <>
                <p className="begin-time">
                  {formatClock(unfinished.durationMs - unfinished.elapsedMs)} <span>remaining</span>
                </p>
                <a className="btn btn-primary btn-lg btn-block" href={href({ name: 'exam', attemptId: unfinished.id })}>
                  <Icon name="play" /> Resume
                </a>
                <button type="button" className="btn btn-ghost btn-block" onClick={() => setConfirmNew(true)}>
                  Start a new attempt
                </button>
              </>
            ) : (
              <>
                <p className="begin-time">
                  {paper.durationMinutes}:00 <span>minutes</span>
                </p>
                <button type="button" className="btn btn-primary btn-lg btn-block" onClick={start}>
                  <Icon name="play" /> Start{attempts.length ? ' new attempt' : ''}
                </button>
              </>
            )}
            <p className="muted begin-note">The timer starts when you select Start. You may pause the exam at any time.</p>
          </div>
          <div className="panel-section">
            <h2 className="panel-title">
              Attempts <span className="count">{attempts.length}</span>
            </h2>
            <AttemptHistory attempts={attempts} />
          </div>
        </aside>
      </div>

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
    </AppShell>
  );
}
