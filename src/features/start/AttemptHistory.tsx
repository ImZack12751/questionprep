import { formatDate, formatDuration } from '../../lib/format';
import { href } from '../../lib/router';
import { attemptSummary } from '../attempt/answers';
import type { Attempt } from '../attempt/types';

export function AttemptHistory({ attempts }: { attempts: Attempt[] }) {
  if (!attempts.length) return null;
  return (
    <section className="history" aria-labelledby="history-title">
      <h2 id="history-title" className="section-label">
        Attempts <span>{attempts.length}</span>
      </h2>
      <table className="history-table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Started</th>
            <th scope="col">Status</th>
            <th scope="col">Time used</th>
            <th scope="col">Answered</th>
            <th scope="col">Flagged</th>
            <th scope="col">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a, i) => {
            const s = attemptSummary(a);
            const done = a.status === 'submitted';
            return (
              <tr key={a.id}>
                <td>{attempts.length - i}</td>
                <td>{formatDate(a.startedAt)}</td>
                <td>
                  <span className={`pill ${done ? 'pill-done' : 'pill-progress'}`}>
                    {done ? (a.autoSubmitted ? 'Time up' : 'Submitted') : 'In progress'}
                  </span>
                </td>
                <td>{formatDuration(a.elapsedMs)}</td>
                <td>
                  {s.answered}/{s.total}
                </td>
                <td>{s.flagged}</td>
                <td>
                  <a className="link" href={href(done ? { name: 'results', attemptId: a.id } : { name: 'exam', attemptId: a.id })}>
                    {done ? 'Results & export' : 'Resume'}
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
