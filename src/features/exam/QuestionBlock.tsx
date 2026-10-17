import { memo } from 'react';
import { Icon } from '../../components/Icon';
import { Rich } from '../../components/Rich';
import { plural } from '../../lib/format';
import { answerKey, type QuestionStatus } from '../attempt/answers';
import type { Answer, Attempt } from '../attempt/types';
import type { Answerable, Question } from '../paper/schema';
import { ContextCards } from '../paper/ContextCard';
import type { PlacedContext } from '../paper/contexts';
import { AnswerInput } from './inputs/AnswerInput';

interface Props {
  question: Question;
  number: number;
  answers: Attempt['answers'];
  flagged: boolean;
  status: QuestionStatus;
  locked: boolean;
  onAnswer: (key: string, a: Answer) => void;
  onToggleFlag: (questionId: string) => void;
  /** Sources / case studies shown above the question. */
  contexts?: PlacedContext[];
}

const Marks = ({ n }: { n: number }) => <span className="marks">[{plural(n, 'mark')}]</span>;

function Item({
  item,
  keyName,
  label,
  textId,
  answers,
  locked,
  onAnswer,
}: {
  item: Answerable;
  keyName: string;
  label: string;
  textId: string;
  answers: Attempt['answers'];
  locked: boolean;
  onAnswer: Props['onAnswer'];
}) {
  return (
    <>
      {item.type !== 'fill_blank' && <Rich text={item.text} className="question-text" />}
      <div className="answer-area">
        <AnswerInput
          item={item}
          answerKey={keyName}
          value={answers[keyName]}
          onChange={onAnswer}
          disabled={locked}
          label={label}
          labelledBy={textId}
        />
      </div>
    </>
  );
}

export const QuestionBlock = memo(function QuestionBlock({
  question: q,
  number,
  answers,
  flagged,
  status,
  locked,
  onAnswer,
  onToggleFlag,
  contexts = [],
}: Props) {
  const headId = `q-${q.id}-head`;
  return (
    <div id={`question-${q.id}`} className="question-group">
      <ContextCards items={contexts} />
      <article
        className={`question ${flagged ? 'is-flagged' : ''} ${contexts.length ? 'has-context' : ''}`}
        aria-labelledby={headId}
        aria-describedby={contexts.length ? contexts.map((c) => c.domId).join(' ') : undefined}
      >
        <header className="question-head">
          <h3 id={headId} className="question-number">
            <span className="sr-only">Question </span>
            {number}
            {status === 'complete' && <span className="question-done" title="Answered" aria-label="answered" />}
          </h3>
          <div className="question-tools">
            <Marks n={q.marks} />
            <button
              type="button"
              className={`flag-btn ${flagged ? 'is-on' : ''}`}
              aria-pressed={flagged}
              onClick={() => onToggleFlag(q.id)}
              title={flagged ? 'Remove review flag' : 'Flag for review'}
            >
              <Icon name="flag" size={15} />
              <span>{flagged ? 'Flagged' : 'Flag'}</span>
            </button>
          </div>
        </header>

        <div className="question-body">
          {q.type === 'multipart' ? (
            <>
              {q.text && <Rich text={q.text} className="question-text question-stem" />}
              <ol className="parts">
                {q.parts.map((p) => {
                  const key = answerKey(q.id, p.label);
                  return (
                    <li key={p.label} className="part">
                      <div className="part-head">
                        <span className="part-label">({p.label})</span>
                        <Marks n={p.marks} />
                      </div>
                      <div className="part-body" id={`${headId}-${p.label}`}>
                        <Item
                          item={p}
                          keyName={key}
                          label={`Question ${number} part ${p.label}`}
                          textId={`${headId}-${p.label}`}
                          answers={answers}
                          locked={locked}
                          onAnswer={onAnswer}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
            </>
          ) : (
            <div id={`${headId}-text`}>
              <Item
                item={q}
                keyName={answerKey(q.id)}
                label={`Question ${number}`}
                textId={`${headId}-text`}
                answers={answers}
                locked={locked}
                onAnswer={onAnswer}
              />
            </div>
          )}
        </div>
      </article>
    </div>
  );
});
