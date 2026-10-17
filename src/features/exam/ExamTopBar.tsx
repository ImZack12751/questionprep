import { Icon } from '../../components/Icon';
import { ThemeToggle } from '../../components/ThemeToggle';
import { formatClock } from '../../lib/format';

interface Props {
  title: string;
  remainingMs: number;
  paused: boolean;
  locked: boolean;
  onPause: () => void;
  onSubmit: () => void;
}

export function ExamTopBar({ title, remainingMs, paused, locked, onPause, onSubmit }: Props) {
  const tone = remainingMs < 60_000 ? 'is-critical' : remainingMs < 5 * 60_000 ? 'is-low' : '';
  return (
    <header className="exam-topbar">
      <div className="exam-title" title={title}>
        <span className="brand-glyph brand-glyph-sm" aria-hidden>
          Q
        </span>
        <span className="exam-title-text">{title}</span>
      </div>
      <div className={`timer ${tone} ${paused ? 'is-paused' : ''}`} role="timer" aria-label="Time remaining">
        <Icon name="clock" size={16} />
        <span className="timer-value">{formatClock(remainingMs)}</span>
      </div>
      <div className="exam-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onPause}
          disabled={locked}
          aria-pressed={paused}
          aria-label={paused ? 'Resume' : 'Pause'}
        >
          <Icon name={paused ? 'play' : 'pause'} size={16} />
          <span className="btn-label">{paused ? 'Resume' : 'Pause'}</span>
        </button>
        <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={locked}>
          <Icon name="check" size={16} /> Submit
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
