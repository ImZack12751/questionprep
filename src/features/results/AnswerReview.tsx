import { useCallback } from 'react';
import { Rich } from '../../components/Rich';
import { plural } from '../../lib/format';
import { renderLatex } from '../../lib/richtext';
import { plainToHtml, sanitizeAnswerHtml } from '../../lib/richAnswer';
import { answerKey, isAnswered, optionLetter } from '../attempt/answers';
import type { Answer, Attempt } from '../attempt/types';
import type { Answerable } from '../paper/schema';
import { ContextCards } from '../paper/ContextCard';
import { placeContexts, sectionFirstNumbers } from '../paper/contexts';

const NoAnswer = () => <p className="review-none">No answer</p>;

function FilledBlanks({ item, values }: { item: Extract<Answerable, { type: 'fill_blank' }>; values: string[] }) {
  const render = useCallback(
    (n: number) => {
      const v = values[n - 1]?.trim();
      return <span className={`review-blank ${v ? '' : 'is-empty'}`}>{v || '—'}</span>;
    },
    [values],
  );
  return <Rich text={item.text} renderBlank={render} className="question-text fill-text" />;
}

function ItemReview({ item, answer }: { item: Answerable; answer: Answer | undefined }) {
  const answered = isAnswered(item, answer);
  if (item.type === 'fill_blank') {
    return <FilledBlanks item={item} values={answer?.type === 'fill_blank' ? answer.values : []} />;
  }
  return (
    <>
      <Rich text={item.text} className="question-text" />
      <div className={`review-answer ${answered ? '' : 'is-empty'}`}>
        <span className="review-answer-label">Answer</span>
        {item.type === 'mcq' ? (
          <ul className="review-options">
            {item.options.map((o, i) => {
              const chosen = answer?.type === 'mcq' && answer.selected.includes(i);
              return (
                <li key={i} className={chosen ? 'is-chosen' : ''}>
                  <span className="review-letter">{optionLetter(i)}</span>
                  <Rich text={o} inline />
                  {chosen && <span className="sr-only"> (selected)</span>}
                </li>
              );
            })}
            {!answered && <li className="review-none">No option selected</li>}
          </ul>
        ) : !answered ? (
          <NoAnswer />
        ) : item.type === 'math' && answer?.type === 'math' ? (
          <div className="review-math" dangerouslySetInnerHTML={{ __html: renderLatex(answer.latex, true) }} />
        ) : answer?.type === 'typed' ? (
          <div
            className="review-typed"
            dangerouslySetInnerHTML={{ __html: answer.html ? sanitizeAnswerHtml(answer.html) : plainToHtml(answer.text) }}
          />
        ) : null}
      </div>
    </>
  );
}

/** The paper with the student's answers. Also the layout used for PDF printing. */
export function AnswerReview({ attempt }: { attempt: Attempt }) {
  let n = 0;
  const firsts = sectionFirstNumbers(attempt.paper);
  return (
    <div className="review">
      {attempt.paper.sections.map((s, si) => {
        const placed = placeContexts(attempt.paper, s, firsts[si]!);
        return (
        <section key={si} className="review-section">
          <h3 className="review-section-title">
            <span>Section {si + 1}</span> {s.title}
          </h3>
          {s.questions.map((q) => {
            n++;
            const flagged = !!attempt.flags[q.id];
            const contexts = placed.get(q.id) ?? [];
            return (
              <div key={q.id} className="review-group">
              <ContextCards items={contexts} />
              <article
                className={`review-q ${flagged ? 'is-flagged' : ''}`}
                aria-describedby={contexts.length ? contexts.map((c) => c.domId).join(' ') : undefined}
              >
                <header className="review-q-head">
                  <span className="question-number">{n}</span>
                  <span className="review-q-meta">
                    {flagged && <span className="review-flag">Flagged</span>}
                    <span className="marks">[{plural(q.marks, 'mark')}]</span>
                  </span>
                </header>
                {q.type === 'multipart' ? (
                  <>
                    {q.text && <Rich text={q.text} className="question-text question-stem" />}
                    {q.parts.map((p) => (
                      <div key={p.label} className="review-part">
                        <div className="review-part-head">
                          <span className="part-label">({p.label})</span>
                          <span className="marks">[{plural(p.marks, 'mark')}]</span>
                        </div>
                        <ItemReview item={p} answer={attempt.answers[answerKey(q.id, p.label)]} />
                      </div>
                    ))}
                  </>
                ) : (
                  <ItemReview item={q} answer={attempt.answers[q.id]} />
                )}
              </article>
              </div>
            );
          })}
        </section>
        );
      })}
    </div>
  );
}
