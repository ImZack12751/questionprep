import { href } from '../lib/router';

export function BrandMark({ compact }: { compact?: boolean }) {
  return (
    <a className={`brand ${compact ? 'brand-compact' : ''}`} href={href({ name: 'home' })} aria-label="Questionprep home">
      <span className="brand-glyph" aria-hidden>
        Q
      </span>
      {!compact && (
        <span className="brand-word">
          Question<em>prep</em>
        </span>
      )}
    </a>
  );
}
