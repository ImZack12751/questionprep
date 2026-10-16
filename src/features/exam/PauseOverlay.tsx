import { Icon } from '../../components/Icon';
import { formatClock } from '../../lib/format';

export function PauseOverlay({ remainingMs, onResume }: { remainingMs: number; onResume: () => void }) {
  return (
    <div className="pause-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <div className="pause-card">
        <p className="eyebrow">Paused</p>
        <h2 id="pause-title">Pens down.</h2>
        <p className="muted">The clock is stopped and the paper is hidden. {formatClock(remainingMs)} remaining.</p>
        <button type="button" className="btn btn-primary btn-lg" onClick={onResume} autoFocus>
          <Icon name="play" /> Resume exam
        </button>
      </div>
    </div>
  );
}
