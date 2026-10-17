import { useEffect, useState } from 'react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { copyText, downloadFile, slugify } from '../../lib/clipboard';
import { getAttempt } from '../../lib/db';
import { formatDate, formatDuration } from '../../lib/format';
import { href, navigate } from '../../lib/router';
import { attemptSummary, totalMarks } from '../attempt/answers';
import type { Attempt } from '../attempt/types';
import { toJson } from '../export/exportData';
import { toMarkdown } from '../export/markdown';
import { AnswerReview } from './AnswerReview';

export function ResultsScreen({ attemptId }: { attemptId: string }) {
  const [attempt, setAttempt] = useState<Attempt | null | undefined>(undefined);
  const toast = useToast();

  useEffect(() => {
    void getAttempt(attemptId).then((a) => {
      if (a?.status === 'in_progress') navigate({ name: 'exam', attemptId }, true);
      else setAttempt(a ?? null);
    });
  }, [attemptId]);

  if (attempt === undefined) return <AppShell>{null}</AppShell>;
  if (attempt === null) {
    return (
      <AppShell>
        <div className="center-message">
          <p>This attempt couldn't be found.</p>
          <a className="btn btn-ghost" href={href({ name: 'home' })}>
            Back to library
          </a>
        </div>
      </AppShell>
    );
  }

  const { paper } = attempt;
  const s = attemptSummary(attempt);
  const base = `${slugify(paper.title)}-${new Date(attempt.startedAt).toISOString().slice(0, 10)}`;

  const jsonCopy = async () => toast((await copyText(toJson(attempt))) ? 'JSON copied — paste it into Claude to get it marked' : 'Copy failed');
  const mdCopy = async () => toast((await copyText(toMarkdown(attempt))) ? 'Markdown copied' : 'Copy failed');

  return (
    <AppShell>
      <PageHeader
        crumbs={[
          { label: 'Library', href: href({ name: 'home' }) },
          { label: paper.title, href: href({ name: 'paper', paperId: attempt.paperId }) },
          { label: 'Results' },
        ]}
        eyebrow={attempt.autoSubmitted ? 'Time ran out — submitted automatically' : 'Submitted'}
        title={paper.title}
        description={attempt.submittedAt ? `Submitted ${formatDate(attempt.submittedAt)}` : undefined}
        actions={
          <a className="btn btn-ghost" href={href({ name: 'paper', paperId: attempt.paperId })}>
            Attempt again
          </a>
        }
      />

      <div className="two-col two-col-left">
        <aside className="panel sticky-aside no-print" aria-label="Summary and export">
          <div className="panel-section">
            <h2 className="panel-title">Summary</h2>
            <dl className="summary-list">
              <div>
                <dt>Time taken</dt>
                <dd>
                  {formatDuration(attempt.elapsedMs)} <span>of {paper.durationMinutes} min</span>
                </dd>
              </div>
              <div>
                <dt>Answered</dt>
                <dd>
                  {s.answered}/{s.total}
                  {s.partial ? <span>{s.partial} partly</span> : null}
                </dd>
              </div>
              <div>
                <dt>Flagged</dt>
                <dd>{s.flagged}</dd>
              </div>
              <div>
                <dt>Marks available</dt>
                <dd>
                  {totalMarks(paper)} <span>not graded</span>
                </dd>
              </div>
            </dl>
            <div className="progress" aria-hidden>
              <span style={{ width: `${s.total ? (s.answered / s.total) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="panel-section">
            <h2 className="panel-title">Export</h2>
            <p className="muted export-note">Answers are not marked here. Copy the JSON into Claude or another AI to have them marked.</p>
            <div className="export-rows">
              <div className="export-row">
                <button type="button" className="btn btn-primary" onClick={() => downloadFile(`${base}.json`, toJson(attempt), 'application/json')}>
                  <Icon name="download" size={16} /> JSON
                </button>
                <button type="button" className="btn btn-ghost btn-icon-text" onClick={jsonCopy}>
                  <Icon name="copy" size={15} /> Copy
                </button>
                <span className="export-desc">For AI marking</span>
              </div>
              <div className="export-row">
                <button type="button" className="btn btn-ghost" onClick={() => downloadFile(`${base}.md`, toMarkdown(attempt), 'text/markdown')}>
                  <Icon name="download" size={16} /> Markdown
                </button>
                <button type="button" className="btn btn-ghost btn-icon-text" onClick={mdCopy}>
                  <Icon name="copy" size={15} /> Copy
                </button>
                <span className="export-desc">Readable notes</span>
              </div>
              <div className="export-row">
                <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
                  <Icon name="printer" size={16} /> PDF
                </button>
                <span className="export-desc">Print, then “Save as PDF”</span>
              </div>
            </div>
          </div>
        </aside>

        <article className="sheet results-sheet print-doc">
          <header className="print-head">
            <p className="eyebrow">{paper.subject || 'Question paper'} · Answer script</p>
            <h2>{paper.title}</h2>
            <p className="print-meta">
              Time taken {formatDuration(attempt.elapsedMs)} of {paper.durationMinutes} min{attempt.autoSubmitted ? ' (time ran out)' : ''} ·
              Answered {s.answered}/{s.total} · Flagged {s.flagged} · {totalMarks(paper)} marks available
              {attempt.submittedAt ? ` · Submitted ${formatDate(attempt.submittedAt)}` : ''}
            </p>
          </header>
          <AnswerReview attempt={attempt} />
        </article>
      </div>
    </AppShell>
  );
}
