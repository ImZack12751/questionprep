import { Dialog } from '../../components/Dialog';
import { allQuestions, questionStatus } from '../attempt/answers';
import type { Attempt } from '../attempt/types';

interface Props {
  open: boolean;
  attempt: Attempt;
  onCancel: () => void;
  onConfirm: () => void;
  onJump: (sectionIndex: number, questionId: string) => void;
}

export function SubmitDialog({ open, attempt, onCancel, onConfirm, onJump }: Props) {
  const qs = allQuestions(attempt.paper).map((x, i) => ({ ...x, n: i + 1, status: questionStatus(x.q, attempt.answers) }));
  const unanswered = qs.filter((x) => x.status === 'empty');
  const partial = qs.filter((x) => x.status === 'partial');
  const flagged = qs.filter((x) => attempt.flags[x.q.id]);

  const list = (items: typeof qs) => (
    <span className="jump-list">
      {items.map((x) => (
        <button key={x.q.id} type="button" className="jump-chip" onClick={() => onJump(x.sectionIndex, x.q.id)}>
          Q{x.n}
        </button>
      ))}
    </span>
  );

  const allDone = !unanswered.length && !partial.length;
  return (
    <Dialog
      open={open}
      title="Submit your paper?"
      tone={allDone ? 'default' : 'danger'}
      onClose={onCancel}
      actions={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Keep working
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            Submit now
          </button>
        </>
      }
    >
      {allDone ? <p>Every question has an answer.</p> : null}
      {unanswered.length > 0 && (
        <div className="submit-warn">
          <p>
            <strong>{unanswered.length}</strong> unanswered: {list(unanswered)}
          </p>
        </div>
      )}
      {partial.length > 0 && (
        <div className="submit-warn">
          <p>
            <strong>{partial.length}</strong> partly answered: {list(partial)}
          </p>
        </div>
      )}
      {flagged.length > 0 && (
        <p>
          <strong>{flagged.length}</strong> still flagged for review: {list(flagged)}
        </p>
      )}
      <p>Once submitted, answers are locked.</p>
    </Dialog>
  );
}
