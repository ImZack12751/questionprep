import { useEffect, useState } from 'react';
import { BrandMark } from '../../components/BrandMark';
import { Icon } from '../../components/Icon';
import { ThemeToggle } from '../../components/ThemeToggle';
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

  if (attempt === undefined) return <div className="page" />;
  if (attempt === null) {
    return (
      <div className="page center-message">
        <p>This attempt couldn't be found.</p>
        <a className="btn btn-ghost" href={href({ name: 'home' })}>
          Back to library
        </a>
      </div>
    );
  }

  const { paper } = attempt;
  const s = attemptSummary(attempt);
  const base = `${slugify(paper.title)}-${new Date(attempt.startedAt).toISOString().slice(0, 10)}`;

  return (
    <div className="page results">
      <header className="site-header no-print">
        <BrandMark />
        <ThemeToggle />
      </header>
      <main className="results-main">
        <a className="back-link no-print" href={href({ name: 'paper', paperId: attempt.paperId })}>
          <Icon name="back" size={16} /> Paper &amp; attempts
        </a>

        <section className="results-hero no-print">
          <p className="eyebrow">{attempt.autoSubmitted ? 'Time ran out — submitted automatically' : 'Submitted'}</p>
          <h1>{paper.title}</h1>
          <p className="muted">{attempt.submittedAt ? formatDate(attempt.submittedAt) : ''}</p>
          <dl className="stats">
            <div>
              <dt>Time taken</dt>
              <dd>{formatDuration(attempt.elapsedMs)}</dd>
              <span className="muted">of {paper.durationMinutes} min</span>
            </div>
            <div>
              <dt>Answered</dt>
              <dd>
                {s.answered}
                <small>/{s.total}</small>
              </dd>
              <span className="muted">{s.partial ? `${s.partial} partly answered` : 'questions'}</span>
            </div>
            <div>
              <dt>Flagged</dt>
              <dd>{s.flagged}</dd>
              <span className="muted">for review</span>
            </div>
            <div>
              <dt>Marks available</dt>
              <dd>{totalMarks(paper)}</dd>
              <span className="muted">not graded here</span>
            </div>
          </dl>
        </section>

        <section className="export-panel no-print" aria-labelledby="export-title">
          <div>
            <h2 id="export-title">Export</h2>
            <p className="muted">
              Answers are not marked in Questionprep. Export the JSON and paste it into Claude or another AI to have your answers marked.
            </p>
          </div>
          <div className="export-actions">
            <div className="export-option">
              <button type="button" className="btn btn-primary" onClick={() => downloadFile(`${base}.json`, toJson(attempt), 'application/json')}>
                <Icon name="download" /> JSON
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={async () => toast((await copyText(toJson(attempt))) ? 'JSON copied — paste it into Claude to get it marked' : 'Copy failed')}
              >
                <Icon name="copy" size={15} /> Copy
              </button>
              <p>Structured, for AI marking</p>
            </div>
            <div className="export-option">
              <button type="button" className="btn btn-ghost" onClick={() => downloadFile(`${base}.md`, toMarkdown(attempt), 'text/markdown')}>
                <Icon name="download" /> Markdown
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={async () => toast((await copyText(toMarkdown(attempt))) ? 'Markdown copied' : 'Copy failed')}
              >
                <Icon name="copy" size={15} /> Copy
              </button>
              <p>Readable notes</p>
            </div>
            <div className="export-option">
              <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
                <Icon name="printer" /> PDF
              </button>
              <p>Print, then “Save as PDF”</p>
            </div>
          </div>
        </section>

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
      </main>
    </div>
  );
}
