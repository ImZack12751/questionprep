import { useEffect, useState } from 'react';
import { getAttempt } from '../../lib/db';
import { href, navigate } from '../../lib/router';
import type { Attempt } from '../attempt/types';
import { ExamSession } from './ExamSession';

export function ExamScreen({ attemptId }: { attemptId: string }) {
  const [attempt, setAttempt] = useState<Attempt | null | undefined>(undefined);

  useEffect(() => {
    void getAttempt(attemptId).then((a) => {
      if (a?.status === 'submitted') navigate({ name: 'results', attemptId }, true);
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
  return <ExamSession initial={attempt} />;
}
